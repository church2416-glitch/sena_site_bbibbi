import express from "express";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLocalUser, db, findUserByUsername, initDb, upsertOAuthUser, verifyPassword } from "./db.js";

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

initDb({ adminUser, adminPassword });

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser(sessionSecret));
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
  return {
    loggedIn: true,
    username: session.username,
    role: session.role,
    isAdmin: session.role === "admin",
    isVerified: session.role === "verified" || session.role === "admin",
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
  res.json({
    loggedIn: true,
    username: user.username,
    role: user.role,
    isAdmin: user.role === "admin",
    isVerified: user.role === "verified" || user.role === "admin",
  });
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
    res.json({
      loggedIn: true,
      username: user.username,
      role: user.role,
      isAdmin: false,
      isVerified: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "회원가입 처리 중 오류가 발생했습니다." });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie(authCookieName);
  res.json({ loggedIn: false, role: "guest" });
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
