import express from "express";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createLocalUser,
  db,
  findUserByUsername,
  initDb,
  updateUserDisplayName,
  upsertOAuthUser,
  verifyPassword,
} from "./db.js";

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });
const loungeBaseUrl = "https://comm-api.game.naver.com/nng_main/v1/community/lounge/sena_rebirth/feed";
const boardIds = {
  notices: 11,
  devNotes: 3,
};
const boardLinks = {
  notices: "https://game.naver.com/lounge/sena_rebirth/board/11",
  devNotes: "https://game.naver.com/lounge/sena_rebirth/board/3",
};
const authCookieName = "bbibbi_session";
const sessionSecret = process.env.SESSION_SECRET || "dev-session-secret-change-me";
const adminUser = process.env.ADMIN_USER || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin";
const siteUrl = process.env.SITE_URL || "https://www.bbitsena.com";
const kakaoClientId = process.env.KAKAO_CLIENT_ID || "";
const kakaoClientSecret = process.env.KAKAO_CLIENT_SECRET || "";
const kakaoRedirectUri = process.env.KAKAO_REDIRECT_URI || `${siteUrl}/auth/kakao/callback`;
const naverClientId = process.env.NAVER_CLIENT_ID || "";
const naverClientSecret = process.env.NAVER_CLIENT_SECRET || "";
const naverRedirectUri = process.env.NAVER_REDIRECT_URI || `${siteUrl}/auth/naver/callback`;
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || `${siteUrl}/auth/google/callback`;
const defaultGuildSeasonSettings = {
  seasonNote: "세븐나이츠 리버스 길드전",
  round: 0,
  totalRound: 18,
  autoUpdateEnabled: false,
  autoUpdateWeekdays: [1, 3, 6],
  lastAutoUpdateDate: "",
};

initDb({ adminUser, adminPassword });

app.use(express.json({ limit: "8mb" }));
app.use(cookieParser(sessionSecret));
app.use(requireMemberForPrivatePages);
app.use(express.static(__dirname));

function signSession(username) {
  const user = findUserByUsername(username);
  const payload = Buffer.from(
    JSON.stringify({ userId: user?.id, username, role: user?.role || "user", iat: Date.now() }),
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readSession(req) {
  const token = req.cookies?.[authCookieName];
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  if (Buffer.byteLength(signature) !== Buffer.byteLength(expected)) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session?.username ? session : null;
  } catch {
    return null;
  }
}

function getPublicUser(req) {
  const session = readSession(req);
  if (!session) return { loggedIn: false, role: "guest" };
  const user = findUserByUsername(session.username);
  const role = user?.role || session.role;
  return {
    loggedIn: true,
    username: session.username,
    displayName: user?.display_name || session.username,
    role,
    isAdmin: role === "admin",
    isVerified: role === "verified" || role === "admin",
  };
}

function requireMemberForPrivatePages(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();

  const requestPath = req.path === "/" ? "/index.html" : req.path;
  const publicPages = new Set(["/index.html"]);
  const isHtmlPage = requestPath.endsWith(".html");

  if (!isHtmlPage || publicPages.has(requestPath)) return next();
  const session = readSession(req);
  if (requestPath === "/admin.html") {
    if (!session) return res.redirect("/?login=required");
    if (session.role !== "admin") return res.status(403).send("관리자 권한이 필요합니다.");
    return next();
  }
  if (session) return next();

  res.redirect("/?login=required");
}

function serializeUser(user) {
  return {
    loggedIn: true,
    username: user.username,
    displayName: user.display_name || user.username,
    role: user.role,
    isAdmin: user.role === "admin",
    isVerified: user.role === "verified" || user.role === "admin",
  };
}

function createOAuthState(provider) {
  const payload = Buffer.from(
    JSON.stringify({ provider, nonce: crypto.randomBytes(12).toString("hex"), iat: Date.now() }),
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyOAuthState(state, provider) {
  const [payload, signature] = String(state || "").split(".");
  if (!payload || !signature) return false;

  const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  if (Buffer.byteLength(signature) !== Buffer.byteLength(expected)) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return parsed.provider === provider && Date.now() - parsed.iat < 1000 * 60 * 10;
  } catch {
    return false;
  }
}

function setAuthCookie(res, username) {
  res.cookie(authCookieName, signSession(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function requireAdmin(req, res, next) {
  const session = readSession(req);
  if (!session || session.role !== "admin") {
    return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  }
  req.session = session;
  next();
}

function requireMember(req, res, next) {
  const session = readSession(req);
  if (!session) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  const user = findUserByUsername(session.username);
  if (!user) {
    return res.status(401).json({ error: "회원 PVP 공략를 찾을 수 없습니다." });
  }

  req.session = session;
  req.user = user;
  next();
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function readSetting(key, fallback) {
  const row = db.prepare("SELECT value_json FROM app_settings WHERE key = ?").get(key);
  if (!row) return fallback;
  return { ...fallback, ...safeJsonParse(row.value_json, {}) };
}

function writeSetting(key, value) {
  db.prepare(
    `
      INSERT INTO app_settings (key, value_json, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value_json = excluded.value_json,
        updated_at = datetime('now')
    `,
  ).run(key, JSON.stringify(value));
}

function getKstDateStamp(date = new Date()) {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = kstDate.getUTCFullYear();
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getKstWeekday(dateStamp = getKstDateStamp()) {
  const [year, month, day] = dateStamp.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function addDays(dateStamp, amount) {
  const [year, month, day] = dateStamp.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function normalizeWeekdays(value, fallback = defaultGuildSeasonSettings.autoUpdateWeekdays) {
  const rawValues = Array.isArray(value) ? value : [value].filter((item) => item !== undefined && item !== null);
  const weekdays = rawValues
    .map(Number)
    .filter((day) => Number.isFinite(day))
    .map((day) => Math.max(0, Math.min(6, day)));
  return [...new Set(weekdays.length ? weekdays : fallback)].sort((a, b) => a - b);
}

function countPassedWeekdays(fromDateStamp, toDateStamp, weekdays) {
  if (!fromDateStamp || fromDateStamp >= toDateStamp) return 0;
  const targetWeekdays = new Set(normalizeWeekdays(weekdays));
  let count = 0;
  let cursor = addDays(fromDateStamp, 1);
  while (cursor <= toDateStamp) {
    if (targetWeekdays.has(getKstWeekday(cursor))) count += 1;
    cursor = addDays(cursor, 1);
  }
  return count;
}

function getGuildSeasonSettings() {
  const settings = readSetting("guildWarSeason", defaultGuildSeasonSettings);
  const totalRound = Math.max(1, Math.min(365, Number(settings.totalRound) || defaultGuildSeasonSettings.totalRound));
  const today = getKstDateStamp();
  const autoUpdateWeekdays = normalizeWeekdays(settings.autoUpdateWeekdays ?? settings.autoUpdateWeekday);
  let round = Math.max(0, Math.min(totalRound, Number(settings.round) || 0));
  let lastAutoUpdateDate = settings.lastAutoUpdateDate || today;

  if (settings.autoUpdateEnabled) {
    const passed = countPassedWeekdays(lastAutoUpdateDate, today, autoUpdateWeekdays);
    if (passed > 0) {
      round = Math.min(totalRound, round + passed);
      lastAutoUpdateDate = today;
      writeSetting("guildWarSeason", {
        ...settings,
        round,
        totalRound,
        autoUpdateWeekdays,
        lastAutoUpdateDate,
      });
    } else if (!settings.lastAutoUpdateDate) {
      writeSetting("guildWarSeason", {
        ...settings,
        round,
        totalRound,
        autoUpdateWeekdays,
        lastAutoUpdateDate,
      });
    }
  }

  return {
    seasonNote: String(settings.seasonNote || defaultGuildSeasonSettings.seasonNote).slice(0, 60),
    round,
    totalRound,
    autoUpdateEnabled: Boolean(settings.autoUpdateEnabled),
    autoUpdateWeekdays,
    lastAutoUpdateDate,
  };
}

function serializePost(row) {
  return {
    id: row.id,
    title: row.title,
    comments: row.comments || 0,
    game: row.game || "",
    category: row.category,
    summary: row.summary || "",
    body: row.body || "",
    tags: safeJsonParse(row.tags_json, []),
    attachment: row.attachment || "",
    media: safeJsonParse(row.media_json, {}),
    votes: row.votes || 0,
    views: row.views || 0,
    status: row.status,
    createdAt: row.created_at,
    author: row.author_name || row.author_username || "익명",
    authorUsername: row.author_username || "",
  };
}

function selectPostRows(where = "posts.status = 'published'", params = []) {
  return db
    .prepare(
      `
        SELECT
          posts.*,
          users.display_name AS author_name,
          users.username AS author_username
        FROM posts
        LEFT JOIN users ON users.id = posts.author_id
        WHERE ${where}
        ORDER BY datetime(posts.created_at) DESC
      `,
    )
    .all(...params);
}

async function fetchLoungeBoard(boardId) {
  const url = `${loungeBaseUrl}?boardId=${boardId}&buffFilteringYN=N&limit=10&offset=0&order=NEW`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: `https://m.game.naver.com/lounge/sena_rebirth/board/${boardId}`,
      Origin: "https://m.game.naver.com",
    },
  });

  if (!response.ok) {
    throw new Error(`Naver lounge API failed: ${response.status}`);
  }

  const data = await response.json();
  const feedList = findFeedList(data);

  if (!Array.isArray(feedList)) {
    console.dir(
      {
        message: "Unexpected lounge response shape",
        boardId,
        topLevelKeys: Object.keys(data || {}),
        contentKeys: data?.content ? Object.keys(data.content) : [],
        sample: JSON.stringify(data).slice(0, 500),
      },
      { depth: 2 },
    );
    throw new Error("Unexpected lounge response shape");
  }

  return feedList.map(normalizeFeedItem);
}

function normalizeFeedItem(item) {
  const feed = item?.feed || item;
  const feedLink = item?.feedLink || feed?.feedLink || {};
  const user = item?.user || feed?.user || {};

  return {
    id: feed?.feedId || feed?.id || item?.id || "",
    title: feed?.title || item?.title || "제목 없음",
    date: feed?.createdDate || feed?.createdAt || item?.createdDate || item?.createdAt || "",
    link: feedLink?.pc || feedLink?.mobile || feed?.url || feed?.link || item?.url || item?.link || "#",
    thumbnail: feed?.repImageUrl || feed?.thumbnailUrl || feed?.imageUrl || item?.thumbnail || "",
    writer: user?.nickname || user?.name || item?.writer || "세븐나이츠",
    views: item?.readCount || feed?.readCount || item?.views || 0,
  };
}

function findFeedList(data) {
  const directCandidates = [
    data?.content?.feedList,
    data?.content?.feeds,
    data?.content?.list,
    data?.content?.items,
    data?.feedList,
    data?.feeds,
    data?.list,
    data?.items,
    data?.result?.content?.feedList,
    data?.result?.feedList,
  ];
  const direct = directCandidates.find(Array.isArray);
  if (direct) return direct;

  return findFirstFeedArray(data);
}

function findFirstFeedArray(value) {
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    const looksLikeFeedList = value.some((item) => item?.feed || item?.feedId || item?.title);
    return looksLikeFeedList ? value : null;
  }

  for (const child of Object.values(value)) {
    const found = findFirstFeedArray(child);
    if (found) return found;
  }

  return null;
}

app.get("/api/me", (req, res) => {
  res.json(getPublicUser(req));
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = findUserByUsername(username);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
  }

  setAuthCookie(res, user.username);
  res.json(serializeUser(user));
});

app.post("/api/register", (req, res) => {
  const { username, password, passwordConfirm, displayName, email } = req.body || {};
  const normalizedUsername = String(username || "").trim();
  const normalizedDisplayName = String(displayName || "").trim();
  const normalizedEmail = String(email || "").trim();

  if (!/^[a-zA-Z0-9_]{4,20}$/.test(normalizedUsername)) {
    return res.status(400).json({ error: "아이디는 영문, 숫자, _ 조합 4~20자로 입력해주세요." });
  }

  if (String(password || "").length < 8) {
    return res.status(400).json({ error: "비밀번호는 8자 이상으로 입력해주세요." });
  }

  if (password !== passwordConfirm) {
    return res.status(400).json({ error: "비밀번호 확인이 일치하지 않습니다." });
  }

  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: "이메일 형식이 올바르지 않습니다." });
  }

  if (findUserByUsername(normalizedUsername)) {
    return res.status(409).json({ error: "이미 사용 중인 아이디입니다." });
  }

  try {
    const user = createLocalUser({
      username: normalizedUsername,
      password,
      displayName: normalizedDisplayName || normalizedUsername,
      email: normalizedEmail,
    });

    setAuthCookie(res, user.username);
    res.json(serializeUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "회원가입 처리 중 오류가 발생했습니다." });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie(authCookieName);
  res.json({ loggedIn: false, role: "guest" });
});

app.patch("/api/me/display-name", (req, res) => {
  const session = readSession(req);
  if (!session) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  const displayName = String(req.body?.displayName || "").trim();
  const displayNameLength = [...displayName].length;

  if (displayNameLength < 2 || displayNameLength > 16) {
    return res.status(400).json({ error: "닉네임은 2~16자로 입력해주세요." });
  }

  const user = updateUserDisplayName(session.username, displayName);
  res.json(serializeUser(user));
});

app.get("/api/posts", requireMember, (req, res) => {
  res.json(selectPostRows().map(serializePost));
});

app.post("/api/posts", requireMember, (req, res) => {
  const title = String(req.body?.title || "").trim();
  const category = String(req.body?.category || "").trim();
  const game = String(req.body?.game || "").trim();
  const summary = String(req.body?.summary || "").trim();
  const body = String(req.body?.body || "").trim();
  const attachment = String(req.body?.attachment || "").trim();
  const tags = Array.isArray(req.body?.tags) ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 4) : [];
  const media = req.body?.media && typeof req.body.media === "object" ? req.body.media : {};

  if (!title || title.length > 70) {
    return res.status(400).json({ error: "제목은 1~70자로 입력해주세요." });
  }
  if (!category) {
    return res.status(400).json({ error: "게시판을 선택해주세요." });
  }
  if (!summary || summary.length > 220) {
    return res.status(400).json({ error: "요약은 1~220자로 입력해주세요." });
  }

  const id = crypto.randomUUID();
  db.prepare(
    `
      INSERT INTO posts (
        id, author_id, category, game, title, summary, body,
        tags_json, attachment, media_json, votes, views, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'published')
    `,
  ).run(id, req.user.id, category, game, title, summary, body, JSON.stringify(tags), attachment, JSON.stringify(media));

  const post = selectPostRows("posts.id = ?", [id])[0];
  res.status(201).json(serializePost(post));
});

app.get("/api/posts/:id", requireMember, (req, res) => {
  const id = String(req.params.id || "");
  db.prepare("UPDATE posts SET views = views + 1 WHERE id = ? AND status = 'published'").run(id);
  const post = selectPostRows("posts.id = ? AND posts.status = 'published'", [id])[0];
  if (!post) {
    return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  }

  const posts = selectPostRows().map(serializePost);
  const index = posts.findIndex((item) => item.id === id);
  res.json({
    post: serializePost(post),
    posts,
    prevPost: index >= 0 ? posts[index - 1] || null : null,
    nextPost: index >= 0 ? posts[index + 1] || null : null,
  });
});

app.get("/auth/kakao", (req, res) => {
  if (!kakaoClientId) {
    return res.status(500).send("KAKAO_CLIENT_ID가 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: kakaoClientId,
    redirect_uri: kakaoRedirectUri,
    state: createOAuthState("kakao"),
  });

  res.redirect(`https://kauth.kakao.com/oauth/authorize?${params.toString()}`);
});

app.get("/auth/kakao/callback", async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    return res.status(400).send(`카카오 로그인 실패: ${errorDescription || error}`);
  }

  if (!code) {
    return res.status(400).send("카카오 인가 코드가 없습니다.");
  }

  if (!verifyOAuthState(state, "kakao")) {
    return res.status(400).send("카카오 로그인 상태값이 올바르지 않습니다.");
  }

  try {
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: kakaoClientId,
      redirect_uri: kakaoRedirectUri,
      code,
    });
    if (kakaoClientSecret) tokenParams.set("client_secret", kakaoClientSecret);

    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: tokenParams,
    });

    if (!tokenResponse.ok) throw new Error(`Kakao token failed: ${tokenResponse.status}`);
    const token = await tokenResponse.json();

    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!userResponse.ok) throw new Error(`Kakao user failed: ${userResponse.status}`);
    const kakaoUser = await userResponse.json();
    const account = kakaoUser.kakao_account || {};
    const profile = account.profile || {};
    const providerId = String(kakaoUser.id);
    const displayName = profile.nickname || `kakao_${providerId}`;
    const username = `kakao:${providerId}`;

    const user = upsertOAuthUser({
      provider: "kakao",
      providerId,
      username,
      displayName,
      email: account.email || "",
      avatarUrl: profile.profile_image_url || profile.thumbnail_image_url || "",
    });

    setAuthCookie(res, user.username);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("카카오 로그인 처리 중 오류가 발생했습니다.");
  }
});

app.get("/auth/naver", (req, res) => {
  if (!naverClientId || !naverClientSecret) {
    return res.status(500).send("NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: naverClientId,
    redirect_uri: naverRedirectUri,
    state: createOAuthState("naver"),
  });

  res.redirect(`https://nid.naver.com/oauth2.0/authorize?${params.toString()}`);
});

app.get("/auth/naver/callback", async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    return res.status(400).send(`네이버 로그인 실패: ${errorDescription || error}`);
  }

  if (!code) {
    return res.status(400).send("네이버 인가 코드가 없습니다.");
  }

  if (!verifyOAuthState(state, "naver")) {
    return res.status(400).send("네이버 로그인 상태값이 올바르지 않습니다.");
  }

  try {
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: naverClientId,
      client_secret: naverClientSecret,
      code,
      state,
    });

    const tokenResponse = await fetch(`https://nid.naver.com/oauth2.0/token?${tokenParams.toString()}`);
    if (!tokenResponse.ok) throw new Error(`Naver token failed: ${tokenResponse.status}`);
    const token = await tokenResponse.json();

    const profileResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!profileResponse.ok) throw new Error(`Naver profile failed: ${profileResponse.status}`);
    const profileData = await profileResponse.json();
    const profile = profileData.response || {};
    const providerId = String(profile.id || "");

    if (!providerId) {
      return res.status(400).send("네이버 사용자 ID를 확인할 수 없습니다.");
    }

    const user = upsertOAuthUser({
      provider: "naver",
      providerId,
      username: `naver:${providerId}`,
      displayName: profile.nickname || profile.name || `naver_${providerId}`,
      email: profile.email || "",
      avatarUrl: profile.profile_image || "",
    });

    setAuthCookie(res, user.username);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("네이버 로그인 처리 중 오류가 발생했습니다.");
  }
});

app.get("/auth/google", (req, res) => {
  if (!googleClientId || !googleClientSecret) {
    return res.status(500).send("GOOGLE_CLIENT_ID 또는 GOOGLE_CLIENT_SECRET이 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: googleClientId,
    redirect_uri: googleRedirectUri,
    scope: "openid email profile",
    state: createOAuthState("google"),
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

app.get("/auth/google/callback", async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    return res.status(400).send(`구글 로그인 실패: ${errorDescription || error}`);
  }

  if (!code) {
    return res.status(400).send("구글 인가 코드가 없습니다.");
  }

  if (!verifyOAuthState(state, "google")) {
    return res.status(400).send("구글 로그인 상태값이 올바르지 않습니다.");
  }

  try {
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: googleRedirectUri,
      code,
    });

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: tokenParams,
    });

    if (!tokenResponse.ok) throw new Error(`Google token failed: ${tokenResponse.status}`);
    const token = await tokenResponse.json();

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!profileResponse.ok) throw new Error(`Google profile failed: ${profileResponse.status}`);
    const profile = await profileResponse.json();
    const providerId = String(profile.sub || "");

    if (!providerId) {
      return res.status(400).send("구글 사용자 ID를 확인할 수 없습니다.");
    }

    const user = upsertOAuthUser({
      provider: "google",
      providerId,
      username: `google:${providerId}`,
      displayName: profile.name || profile.email || `google_${providerId}`,
      email: profile.email || "",
      avatarUrl: profile.picture || "",
    });

    setAuthCookie(res, user.username);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("구글 로그인 처리 중 오류가 발생했습니다.");
  }
});

app.get("/api/admin/db-status", requireAdmin, (req, res) => {
  const tables = ["users", "posts", "post_media", "guild_war_sheets", "app_settings", "audit_logs"];
  const counts = Object.fromEntries(
    tables.map((table) => [table, db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count]),
  );
  res.json({ ok: true, counts });
});

app.get("/api/guild-war/season", (req, res) => {
  res.json({ ok: true, settings: getGuildSeasonSettings() });
});

app.patch("/api/admin/guild-war/season", requireAdmin, (req, res) => {
  const totalRound = Math.max(1, Math.min(365, Number(req.body.totalRound) || defaultGuildSeasonSettings.totalRound));
  const round = Math.max(0, Math.min(totalRound, Number(req.body.round) || 0));
  const seasonNote = String(req.body.seasonNote || defaultGuildSeasonSettings.seasonNote).trim().slice(0, 60);
  const settings = {
    ...getGuildSeasonSettings(),
    seasonNote,
    round,
    totalRound,
    autoUpdateEnabled: Boolean(req.body.autoUpdateEnabled),
    autoUpdateWeekdays: normalizeWeekdays(req.body.autoUpdateWeekdays),
    lastAutoUpdateDate: getKstDateStamp(),
  };
  writeSetting("guildWarSeason", settings);
  res.json({ ok: true, settings });
});

app.get("/api/admin/dashboard", requireAdmin, (req, res) => {
  const counts = {
    users: db.prepare("SELECT COUNT(*) AS count FROM users").get().count,
    admins: db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count,
    verified: db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'verified'").get().count,
    posts: db.prepare("SELECT COUNT(*) AS count FROM posts").get().count,
    publishedPosts: db.prepare("SELECT COUNT(*) AS count FROM posts WHERE status = 'published'").get().count,
    guildSheets: db.prepare("SELECT COUNT(*) AS count FROM guild_war_sheets").get().count,
  };

  const dailyRows = db
    .prepare(
      `
        WITH days(day) AS (
          SELECT date('now', '-6 days')
          UNION ALL
          SELECT date(day, '+1 day') FROM days WHERE day < date('now')
        )
        SELECT
          day,
          (SELECT COUNT(*) FROM users WHERE date(created_at) = day) AS users,
          (SELECT COUNT(*) FROM posts WHERE date(created_at) = day) AS posts
        FROM days
        ORDER BY day
      `,
    )
    .all();

  const recentUsers = db
    .prepare(
      `
        SELECT id, username, display_name, email, provider, role, created_at
        FROM users
        ORDER BY datetime(created_at) DESC
        LIMIT 8
      `,
    )
    .all();

  const recentPosts = db
    .prepare(
      `
        SELECT
          posts.id,
          posts.title,
          posts.category,
          posts.status,
          posts.views,
          posts.votes,
          posts.created_at,
          users.display_name AS author_name,
          users.username AS author_username
        FROM posts
        LEFT JOIN users ON users.id = posts.author_id
        ORDER BY datetime(posts.created_at) DESC
        LIMIT 8
      `,
    )
    .all();

  res.json({
    counts,
    daily: dailyRows,
    recentUsers,
    recentPosts: recentPosts.map(serializePost),
  });
});

app.get("/api/admin/users", requireAdmin, (req, res) => {
  const users = db
    .prepare(
      `
        SELECT
          users.id,
          users.username,
          users.display_name,
          users.email,
          users.provider,
          users.role,
          users.created_at,
          COUNT(posts.id) AS post_count
        FROM users
        LEFT JOIN posts ON posts.author_id = users.id
        GROUP BY users.id
        ORDER BY datetime(users.created_at) DESC
      `,
    )
    .all();
  res.json(users);
});

app.patch("/api/admin/users/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const role = String(req.body?.role || "").trim();
  const displayName = String(req.body?.displayName || "").trim();
  const allowedRoles = new Set(["user", "verified", "admin"]);

  if (!allowedRoles.has(role)) {
    return res.status(400).json({ error: "권한 값이 올바르지 않습니다." });
  }
  if (displayName && [...displayName].length > 16) {
    return res.status(400).json({ error: "닉네임은 16자 이하로 입력해주세요." });
  }

  db.prepare(
    `
      UPDATE users
      SET role = ?,
          display_name = COALESCE(NULLIF(?, ''), display_name),
          updated_at = datetime('now')
      WHERE id = ?
    `,
  ).run(role, displayName, id);

  const user = db.prepare("SELECT id, username, display_name, email, provider, role, created_at FROM users WHERE id = ?").get(id);
  if (!user) return res.status(404).json({ error: "회원을 찾을 수 없습니다." });
  res.json(user);
});

app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const actor = findUserByUsername(req.session.username);
  if (actor?.id === id) {
    return res.status(400).json({ error: "본인 계정은 삭제할 수 없습니다." });
  }

  const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
  if (!result.changes) return res.status(404).json({ error: "회원을 찾을 수 없습니다." });
  res.json({ ok: true });
});

app.get("/api/admin/posts", requireAdmin, (req, res) => {
  res.json(selectPostRows("1 = 1").map(serializePost));
});

app.patch("/api/admin/posts/:id", requireAdmin, (req, res) => {
  const id = String(req.params.id || "");
  const status = String(req.body?.status || "").trim();
  const allowedStatuses = new Set(["published", "hidden", "deleted"]);
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ error: "상태 값이 올바르지 않습니다." });
  }

  const result = db.prepare("UPDATE posts SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  if (!result.changes) return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  const post = selectPostRows("posts.id = ?", [id])[0];
  res.json(serializePost(post));
});

app.delete("/api/admin/posts/:id", requireAdmin, (req, res) => {
  const id = String(req.params.id || "");
  const result = db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  if (!result.changes) return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  res.json({ ok: true });
});

app.get("/api/notices", async (req, res) => {
  try {
    res.json(await fetchLoungeBoard(boardIds.notices));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "공지 불러오기 실패" });
  }
});

app.get("/api/dev-notes", async (req, res) => {
  try {
    res.json(await fetchLoungeBoard(boardIds.devNotes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "개발자노트 불러오기 실패" });
  }
});

app.get("/api/feed-links", (req, res) => {
  res.json(boardLinks);
});

app.listen(port, () => {
  console.log(`server running: http://localhost:${port}`);
});
