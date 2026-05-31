import express from "express";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import dotenv from "dotenv";
import fs from "node:fs";
import multer from "multer";
import net from "node:net";
import path from "node:path";
import tls from "node:tls";
import { fileURLToPath } from "node:url";
import {
  createLocalUser,
  db,
  findUserByUsername,
  initDb,
  updateUserDisplayName,
  upsertOAuthUser,
  hashPassword,
  verifyPassword,
} from "./db.js";

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });
app.set("trust proxy", 1);
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
const siteOrigin = new URL(siteUrl).origin;
const siteHostname = new URL(siteUrl).hostname;
const allowedRequestOrigins = new Set([
  siteOrigin,
  siteHostname.startsWith("www.") ? `${new URL(siteUrl).protocol}//${siteHostname.slice(4)}` : `${new URL(siteUrl).protocol}//www.${siteHostname}`,
  ...(process.env.ALLOWED_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean),
]);
const cookieDomain = process.env.COOKIE_DOMAIN
  || (siteHostname === "bbitsena.com" || siteHostname.endsWith(".bbitsena.com") ? ".bbitsena.com" : undefined);
const kakaoClientId = process.env.KAKAO_CLIENT_ID || "";
const kakaoClientSecret = process.env.KAKAO_CLIENT_SECRET || "";
const kakaoRedirectUri = process.env.KAKAO_REDIRECT_URI || `${siteUrl}/auth/kakao/callback`;
const naverClientId = process.env.NAVER_CLIENT_ID || "";
const naverClientSecret = process.env.NAVER_CLIENT_SECRET || "";
const naverRedirectUri = process.env.NAVER_REDIRECT_URI || `${siteUrl}/auth/naver/callback`;
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || `${siteUrl}/auth/google/callback`;
const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || smtpUser || `no-reply@${siteHostname.replace(/^www\./, "")}`;
const couponRedeemUrl = process.env.COUPON_REDEEM_URL || "https://coupon.netmarble.com/api/coupon";
const couponApiToken = process.env.COUPON_API_TOKEN || "";
const couponGameCode = process.env.COUPON_GAME_CODE || "tskgb";
const couponLangCd = process.env.COUPON_LANG_CD || "EN_US";
const internalNoticeCategory = "\uacf5\uc9c0\uc0ac\ud56d";
const defaultGuildSeasonSettings = {
  seasonNote: "세븐나이츠 리버스 길드전",
  round: 0,
  totalRound: 18,
  autoUpdateEnabled: false,
  autoUpdateWeekdays: [1, 3, 6],
  lastAutoUpdateDate: "",
};
const defaultImportantNoticeSettings = {
  enabled: false,
  title: "중요 공지사항",
  eyebrow: "삐삐 공지사항",
  content: "",
  imageUrl: "",
  imageUrls: [],
  actionLabel: "",
  actionUrl: "",
  updatedAt: "",
};
const defaultMainHeroSettings = {
  imageUrls: [],
  intervalSeconds: 5,
  updatedAt: "",
};
const defaultSiteAppearanceSettings = {
  mentionColor: "#2c7eff",
  updatedAt: "",
};
const defaultBoardTagSettings = {
  tags: [
    { name: "전체 게시판", color: "#6ce7d2" },
    { name: "인기글", color: "#ffdf63" },
    { name: "PVP 게시판", color: "#ff7144" },
    { name: "PVE 공략", color: "#6ce7d2" },
    { name: "파괴신", color: "#ff7144" },
    { name: "공성전", color: "#ffdf63" },
    { name: "돌발레이드", color: "#ff7144" },
    { name: "기술", color: "#8b5cf6" },
    { name: "잡담", color: "#a779ff" },
    { name: "유머", color: "#ff4d88" },
    { name: "쿠폰", color: "#40d2a3" },
  ],
  updatedAt: "",
};
const maxPostImageSize = 25 * 1024 * 1024;
const maxPostVideoSize = 500 * 1024 * 1024;
const uploadRoot = path.join(__dirname, "uploads");
const uploadTmpRoot = path.join(uploadRoot, "tmp");
const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/bmp",
]);
const allowedVideoMimeTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
  "video/mpeg",
  "video/x-msvideo",
  "video/x-matroska",
]);
const authRateWindowMs = 10 * 60 * 1000;
const authRateLimits = new Map();
const emailCodeTtlMs = 10 * 60 * 1000;
const passwordResetTtlMs = 15 * 60 * 1000;
const couponRateWindowMs = 60 * 1000;
const cookieSecure = siteUrl.startsWith("https://") && process.env.COOKIE_SECURE !== "false";
const roleLevels = {
  blocked: 0,
  user: 1,
  verified: 2,
  elite: 2,
  admin: 3,
  superadmin: 4,
};
const permissionKeys = [
  "canReadPosts",
  "canWritePosts",
  "canComment",
  "canVote",
  "canUploadMedia",
  "canEditOwnPosts",
  "canManageOwnComments",
  "canManageGuild",
  "canAccessAdminDb",
  "canManageUsers",
  "canManageContent",
];
const rolePermissionPresets = {
  blocked: {
    canReadPosts: false,
    canWritePosts: false,
    canComment: false,
    canVote: false,
    canUploadMedia: false,
    canEditOwnPosts: false,
    canManageOwnComments: false,
    canManageGuild: false,
    canAccessAdminDb: false,
    canManageUsers: false,
    canManageContent: false,
  },
  user: {
    canReadPosts: true,
    canWritePosts: true,
    canComment: true,
    canVote: true,
    canUploadMedia: true,
    canEditOwnPosts: true,
    canManageOwnComments: true,
    canManageGuild: false,
    canAccessAdminDb: false,
    canManageUsers: false,
    canManageContent: false,
  },
  elite: {
    canReadPosts: true,
    canWritePosts: true,
    canComment: true,
    canVote: true,
    canUploadMedia: true,
    canEditOwnPosts: true,
    canManageOwnComments: true,
    canManageGuild: true,
    canAccessAdminDb: false,
    canManageUsers: false,
    canManageContent: false,
  },
  admin: {
    canReadPosts: true,
    canWritePosts: true,
    canComment: true,
    canVote: true,
    canUploadMedia: true,
    canEditOwnPosts: true,
    canManageOwnComments: true,
    canManageGuild: true,
    canAccessAdminDb: false,
    canManageUsers: false,
    canManageContent: true,
  },
  superadmin: {
    canReadPosts: true,
    canWritePosts: true,
    canComment: true,
    canVote: true,
    canUploadMedia: true,
    canEditOwnPosts: true,
    canManageOwnComments: true,
    canManageGuild: true,
    canAccessAdminDb: true,
    canManageUsers: true,
    canManageContent: true,
  },
};
const notificationStreams = new Map();
const uploadPostMedia = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      fs.mkdirSync(uploadTmpRoot, { recursive: true });
      cb(null, uploadTmpRoot);
    },
    filename(req, file, cb) {
      const extension = extensionFromMime(mimeFromUpload(file, file.fieldname === "images" ? "image" : "video")) || path.extname(file.originalname).slice(1) || "bin";
      cb(null, `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}.${extension}`);
    },
  }),
  limits: {
    fileSize: maxPostVideoSize,
    files: 9,
  },
  fileFilter(req, file, cb) {
    if (file.fieldname === "images" && mimeFromUpload(file, "image")) return cb(null, true);
    if (file.fieldname === "videos" && mimeFromUpload(file, "video")) return cb(null, true);
    return cb(new Error("unsupported_media_type"));
  },
}).fields([
  { name: "images", maxCount: 6 },
  { name: "videos", maxCount: 3 },
]);
const uploadNoticeImage = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const directory = path.join(uploadRoot, "notices");
      fs.mkdirSync(directory, { recursive: true });
      cb(null, directory);
    },
    filename(req, file, cb) {
      const extension = extensionFromMime(mimeFromUpload(file, "image")) || path.extname(file.originalname).slice(1) || "png";
      cb(null, `notice-${Date.now().toString(36)}-${crypto.randomBytes(5).toString("hex")}.${extension}`);
    },
  }),
  limits: {
    fileSize: maxPostImageSize,
    files: 6,
  },
  fileFilter(req, file, cb) {
    if (mimeFromUpload(file, "image")) return cb(null, true);
    return cb(new Error("unsupported_notice_image"));
  },
});
const uploadHeroImage = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const directory = path.join(uploadRoot, "hero");
      fs.mkdirSync(directory, { recursive: true });
      cb(null, directory);
    },
    filename(req, file, cb) {
      const extension = extensionFromMime(mimeFromUpload(file, "image")) || path.extname(file.originalname).slice(1) || "png";
      cb(null, `hero-${Date.now().toString(36)}-${crypto.randomBytes(5).toString("hex")}.${extension}`);
    },
  }),
  limits: {
    fileSize: maxPostImageSize,
    files: 10,
  },
  fileFilter(req, file, cb) {
    if (mimeFromUpload(file, "image")) return cb(null, true);
    return cb(new Error("unsupported_hero_image"));
  },
});

initDb({ adminUser, adminPassword });

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser(sessionSecret));
app.use(requireCsrf);
app.use("/uploads", express.static(uploadRoot, {
  acceptRanges: true,
  dotfiles: "deny",
  immutable: false,
  maxAge: "1h",
  setHeaders(res, filePath) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (/\.(mp4|m4v|webm|ogv|ogg|mov|mpeg|mpg|avi|mkv)$/i.test(filePath)) {
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=3600");
    }
  },
}));
app.use(redirectLegacyHtmlRoutes);
app.use(requireMemberForPrivatePages);

app.get(["/", "/board", "/board/pvp", "/board/pve", "/board/tech"], sendHtmlPage("index.html"));
app.get("/board/notice", sendHtmlPage("notices.html"));
app.get("/board/notice/write", requireCleanAdminPage("관리자 권한이 필요합니다.", "공지 작성은 관리자 이상만 사용할 수 있습니다."), sendHtmlPage("notice-upload.html"));
app.get(["/board/post", "/board/post/:id"], requireCleanMemberPage, sendHtmlPage("post.html"));
app.get("/board/write", requireCleanMemberPage, sendHtmlPage("upload.html"));
app.get("/coupon", requireCleanMemberPage, sendHtmlPage("coupon.html"));
app.get("/guild/war", requireCleanMemberPage, sendHtmlPage("guild-war.html"));
app.get("/guild/war_admin", requireCleanPermissionPage("canManageGuild", "족보 관리 권한이 필요합니다.", "길드전 족보 작성과 수정은 권한이 있는 계정만 사용할 수 있습니다."), sendHtmlPage("guild-war-admin.html"));
app.get("/admin", requireCleanPermissionPage("canAccessAdminDb", "최고관리자 권한이 필요합니다.", "관리자 DB는 권한이 있는 계정만 접근할 수 있습니다."), sendHtmlPage("admin.html"));
app.get("/preview", requireCleanMemberPage, sendHtmlPage("preview.html"));
app.get("/terms", sendHtmlPage("terms.html"));
app.get("/privacy", sendHtmlPage("privacy.html"));

app.use(express.static(__dirname));

function redirectLegacyHtmlRoutes(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const legacyPath = String(req.path || "").replace(/\/+$/, "");
  const redirects = new Map([
    ["/board/post.html", "/board/post"],
    ["/post.html", "/board/post"],
    ["/board/notice-upload.html", "/board/notice/write"],
    ["/notice-upload.html", "/board/notice/write"],
    ["/board/notices.html", "/board/notice"],
    ["/notices.html", "/board/notice"],
    ["/board/upload.html", "/board/write"],
    ["/upload.html", "/board/write"],
    ["/guild-war.html", "/guild/war"],
    ["/guild-war-admin.html", "/guild/war_admin"],
    ["/admin.html", "/admin"],
    ["/coupon.html", "/coupon"],
    ["/preview.html", "/preview"],
    ["/terms.html", "/terms"],
    ["/privacy.html", "/privacy"],
  ]);
  const target = redirects.get(legacyPath);
  if (!target) return next();
  const query = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
  return res.redirect(301, `${target}${query}`);
}

function sendHtmlPage(filename) {
  return (req, res) => {
    res.sendFile(path.join(__dirname, filename));
  };
}

function requireCleanMemberPage(req, res, next) {
  const session = readSession(req);
  if (!session) return res.redirect("/?login=required");
  next();
}

function requireCleanAdminPage(message, detail) {
  return (req, res, next) => {
    const session = readSession(req);
    if (!session) return res.redirect("/?login=required");
    const user = findUserByUsername(session.username);
    if (!user || !hasRole(user, "admin")) {
      return res.status(403).send(renderAccessDeniedPage(message, detail));
    }
    next();
  };
}

function requireCleanPermissionPage(permission, message, detail) {
  return (req, res, next) => {
    const session = readSession(req);
    if (!session) return res.redirect("/?login=required");
    const user = findUserByUsername(session.username);
    if (!user || !hasPermission(user, permission)) {
      return res.status(403).send(renderAccessDeniedPage(message, detail));
    }
    next();
  };
}

function signSession(username) {
  const user = findLoginUser(username);
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

function normalizeRole(role) {
  return role === "verified" ? "elite" : role || "user";
}

function roleLevel(role) {
  return roleLevels[normalizeRole(role)] ?? roleLevels.user;
}

function hasRole(userOrRole, minimumRole) {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
  return roleLevel(role) >= roleLevel(minimumRole);
}

function parsePermissions(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function sanitizePermissions(value) {
  const parsed = parsePermissions(value);
  return Object.fromEntries(
    permissionKeys
      .filter((key) => typeof parsed[key] === "boolean")
      .map((key) => [key, parsed[key]]),
  );
}

function roleFlags(userOrRole, permissionsInput) {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
  const normalized = normalizeRole(role);
  const permissions = sanitizePermissions(
    permissionsInput ?? (typeof userOrRole === "string" ? null : userOrRole?.permissions_json || userOrRole?.permissions),
  );
  const flags = {
    ...(rolePermissionPresets[normalized] || rolePermissionPresets.user),
    ...permissions,
  };
  if (normalized === "superadmin") {
    Object.assign(flags, rolePermissionPresets.superadmin);
  }
  if (normalized === "blocked") {
    Object.assign(flags, rolePermissionPresets.blocked);
  }
  return {
    role: normalized,
    permissions,
    ...flags,
    isSuperAdmin: normalized === "superadmin",
    isAdmin: hasRole(normalized, "admin") || Boolean(flags.canManageGuild || flags.canManageContent || flags.canManageUsers || flags.canAccessAdminDb),
    isVerified: hasRole(normalized, "elite"),
  };
}

function hasPermission(user, key) {
  return Boolean(roleFlags(user)[key]);
}

function getPublicUser(req) {
  const session = readSession(req);
  if (!session) return { loggedIn: false, role: "guest" };
  const user = findUserByUsername(session.username);
  return {
    loggedIn: true,
    username: session.username,
    displayName: user?.display_name || session.username,
    couponUid: user?.coupon_uid || "",
    ...roleFlags(user || session.role),
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderAccessDeniedPage(message, detail = "현재 계정으로는 이 화면을 열 수 없습니다.") {
  const safeMessage = escapeHtml(message);
  const safeDetail = escapeHtml(detail);
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>접근 권한 안내 - bbitsena</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #05060b;
        --panel: rgba(13, 14, 23, 0.88);
        --line: rgba(148, 116, 255, 0.22);
        --line-strong: rgba(108, 231, 210, 0.48);
        --text: #f3f0ff;
        --muted: #9a96b3;
        --accent: #6ce7d2;
        --purple: #8b5cf6;
      }
      * { box-sizing: border-box; }
      body {
        display: grid;
        place-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
        color: var(--text);
        background:
          radial-gradient(circle at 50% 20%, rgba(108, 231, 210, 0.13), transparent 26rem),
          radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.18), transparent 30rem),
          var(--bg);
        font-family: "Pretendard", "Noto Sans KR", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .access-card {
        width: min(440px, 100%);
        padding: 34px;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: var(--panel);
        box-shadow: 0 28px 90px rgba(0, 0, 0, 0.46);
        text-align: center;
        backdrop-filter: blur(18px);
      }
      .access-mark {
        display: grid;
        place-items: center;
        width: 56px;
        height: 56px;
        margin: 0 auto 18px;
        border: 1px solid var(--line-strong);
        border-radius: 50%;
        color: #06100f;
        background: var(--accent);
        box-shadow: 0 0 26px rgba(108, 231, 210, 0.34);
        font-size: 24px;
        font-weight: 1000;
      }
      h1 {
        margin: 0;
        font-size: 26px;
        letter-spacing: 0;
      }
      p {
        margin: 12px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.7;
      }
      .access-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 26px;
      }
      a, button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        border: 1px solid var(--line);
        border-radius: 8px;
        color: var(--text);
        background: rgba(18, 20, 33, 0.82);
        font: inherit;
        font-size: 13px;
        font-weight: 900;
        text-decoration: none;
        cursor: pointer;
      }
      a.primary {
        border-color: rgba(108, 231, 210, 0.68);
        color: #06100f;
        background: var(--accent);
      }
      small {
        display: block;
        margin-top: 18px;
        color: rgba(154, 150, 179, 0.72);
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <main class="access-card">
      <div class="access-mark">!</div>
      <h1>${safeMessage}</h1>
      <p>${safeDetail}</p>
      <div class="access-actions">
        <button type="button" onclick="history.length > 1 ? history.back() : location.href='/'">뒤로가기</button>
        <a class="primary" href="/">메인으로</a>
      </div>
      <small>bbitsena access control</small>
    </main>
  </body>
</html>`;
}

function requireMemberForPrivatePages(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();

  const requestPath = req.path === "/" ? "//" : req.path;
  const publicPages = new Set(["//", "//board/notice", "//terms", "//privacy"]);
  const isHtmlPage = requestPath.endsWith(".html");

  if (!isHtmlPage || publicPages.has(requestPath)) return next();
  const session = readSession(req);
  if (requestPath === "//preview") {
    if (!session) return res.redirect("/?login=required");
    return next();
  }
  if (requestPath === "//board/notice/write") {
    if (!session) return res.redirect("/?login=required");
    const user = findUserByUsername(session.username);
    if (!user || !hasRole(user, "admin")) return res.status(403).send(renderAccessDeniedPage("관리자 권한이 필요합니다.", "공지 작성은 관리자 이상만 사용할 수 있습니다."));
    return next();
  }
  if (requestPath === "//admin") {
    if (!session) return res.redirect("/?login=required");
    const user = findUserByUsername(session.username);
    if (!user || !hasPermission(user, "canAccessAdminDb")) return res.status(403).send(renderAccessDeniedPage("최고관리자 권한이 필요합니다.", "관리자 DB는 최고관리자 권한이 있는 계정만 접근할 수 있습니다."));
    return next();
  }
  if (requestPath === "//guild/war_admin") {
    if (!session) return res.redirect("/?login=required");
    const user = findUserByUsername(session.username);
    if (!user || !hasPermission(user, "canManageGuild")) return res.status(403).send(renderAccessDeniedPage("족보 관리 권한이 필요합니다.", "길드전 족보 작성과 수정은 권한이 있는 계정만 사용할 수 있습니다."));
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
    ...roleFlags(user),
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

function setAuthCookie(res, username, remember = false) {
  const options = {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: cookieSecure,
    maxAge: remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24,
  };
  if (cookieDomain) options.domain = cookieDomain;
  res.cookie(authCookieName, signSession(username), options);
}

function clearAuthCookies(res) {
  const baseOptions = { httpOnly: true, path: "/", sameSite: "lax", secure: cookieSecure };
  const domains = [
    undefined,
    cookieDomain,
    siteHostname,
    siteHostname.startsWith("www.") ? siteHostname.slice(4) : `www.${siteHostname}`,
  ].filter((domain, index, list) => domain === undefined || list.indexOf(domain) === index);

  domains.forEach((domain) => {
    const options = domain ? { ...baseOptions, domain } : baseOptions;
    res.clearCookie(authCookieName, options);
  });
}

function getRateKey(req, scope) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return `${scope}:${forwarded || req.ip || req.socket?.remoteAddress || "unknown"}`;
}

function checkRateLimit(req, res, scope, limit, windowMs = authRateWindowMs) {
  const key = getRateKey(req, scope);
  const now = Date.now();
  const bucket = authRateLimits.get(key);
  if (!bucket || bucket.resetAt <= now) {
    authRateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  if (bucket.count <= limit) return false;

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  res.setHeader("Retry-After", String(retryAfter));
  res.status(429).json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." });
  return true;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function hashRecoverySecret(value) {
  return crypto.createHmac("sha256", sessionSecret).update(String(value || "")).digest("hex");
}

function makeRecoveryCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function findLoginUser(identifier) {
  const value = String(identifier || "").trim();
  if (!value) return null;
  const byUsername = findUserByUsername(value);
  if (byUsername) return byUsername;
  if (!isValidEmail(value)) return null;
  return db
    .prepare(
      `
        SELECT *
        FROM users
        WHERE lower(email) = lower(?)
          AND provider = 'local'
        ORDER BY id ASC
        LIMIT 1
      `,
    )
    .get(value);
}

function selectLocalUsersByEmail(email) {
  return db
    .prepare(
      `
        SELECT id, username, display_name, email
        FROM users
        WHERE lower(email) = lower(?)
          AND provider = 'local'
        ORDER BY id ASC
      `,
    )
    .all(email);
}

function selectPasswordResetUser({ email, username }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = String(username || "").trim();
  if (!normalizedEmail) return null;

  if (normalizedUsername) {
    return db
      .prepare(
        `
          SELECT *
          FROM users
          WHERE lower(email) = lower(?)
            AND username = ?
            AND provider = 'local'
            AND password_hash IS NOT NULL
          LIMIT 1
        `,
      )
      .get(normalizedEmail, normalizedUsername);
  }

  return db
    .prepare(
      `
        SELECT *
        FROM users
        WHERE lower(email) = lower(?)
          AND provider = 'local'
          AND password_hash IS NOT NULL
        ORDER BY id ASC
        LIMIT 1
      `,
    )
    .get(normalizedEmail);
}

function createEmailVerification({ email, username, purpose }) {
  const code = makeRecoveryCode();
  db.prepare(
    `
      INSERT INTO email_verifications (email, username, purpose, code_hash, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `,
  ).run(
    normalizeEmail(email),
    username || null,
    purpose,
    hashRecoverySecret(code),
    new Date(Date.now() + emailCodeTtlMs).toISOString(),
  );
  return code;
}

function findActiveEmailVerification({ email, username, purpose }) {
  const params = [normalizeEmail(email), purpose];
  let usernameClause = "";
  if (username) {
    usernameClause = "AND username = ?";
    params.push(username);
  }
  return db
    .prepare(
      `
        SELECT *
        FROM email_verifications
        WHERE email = ?
          AND purpose = ?
          ${usernameClause}
          AND consumed_at IS NULL
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT 1
      `,
    )
    .get(...params);
}

function verifyEmailCode({ email, username, purpose, code }) {
  const row = findActiveEmailVerification({ email, username, purpose });
  if (!row) return { ok: false, error: "인증 요청을 먼저 진행해주세요." };
  if (Date.parse(row.expires_at) <= Date.now()) {
    return { ok: false, error: "인증 코드가 만료되었습니다. 다시 요청해주세요." };
  }
  if (row.attempts >= 5) {
    return { ok: false, error: "인증 시도 횟수가 초과되었습니다. 다시 요청해주세요." };
  }

  const expected = Buffer.from(row.code_hash, "hex");
  const actual = Buffer.from(hashRecoverySecret(String(code || "").trim()), "hex");
  const matched = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  if (!matched) {
    db.prepare("UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?").run(row.id);
    return { ok: false, error: "인증 코드가 올바르지 않습니다." };
  }

  return { ok: true, row };
}

function consumeEmailVerification(id) {
  db.prepare("UPDATE email_verifications SET consumed_at = datetime('now') WHERE id = ?").run(id);
}

function issuePasswordResetToken(verificationId) {
  const token = crypto.randomBytes(32).toString("base64url");
  db.prepare(
    `
      UPDATE email_verifications
      SET reset_token_hash = ?,
          reset_token_expires_at = ?
      WHERE id = ?
    `,
  ).run(hashRecoverySecret(token), new Date(Date.now() + passwordResetTtlMs).toISOString(), verificationId);
  return token;
}

function findPasswordResetByToken(token) {
  if (!token) return null;
  return db
    .prepare(
      `
        SELECT *
        FROM email_verifications
        WHERE purpose = 'reset_password'
          AND reset_token_hash = ?
          AND reset_token_expires_at IS NOT NULL
        ORDER BY id DESC
        LIMIT 1
      `,
    )
    .get(hashRecoverySecret(token));
}

function smtpConfigured() {
  return Boolean(smtpHost && smtpPort && smtpFrom);
}

function readSmtpResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("SMTP response timeout"));
    }, 15000);
    const cleanup = () => {
      clearTimeout(timeout);
      socket.off("data", onData);
      socket.off("error", onError);
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      if (!lines.length) return;
      const last = lines.at(-1);
      if (/^\d{3} /.test(last)) {
        cleanup();
        resolve(buffer);
      }
    };
    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function smtpCommand(socket, command, expectedCodes) {
  if (command) socket.write(`${command}\r\n`);
  const response = await readSmtpResponse(socket);
  const code = Number(response.slice(0, 3));
  if (!expectedCodes.includes(code)) {
    throw new Error(`SMTP command failed: ${command || "connect"} / ${response.trim()}`);
  }
  return response;
}

function createSmtpSocket() {
  return new Promise((resolve, reject) => {
    const options = { host: smtpHost, port: smtpPort, servername: smtpHost };
    const socket = smtpSecure ? tls.connect(options) : net.connect(options);
    socket.setTimeout(20000);
    socket.once(smtpSecure ? "secureConnect" : "connect", () => resolve(socket));
    socket.once("timeout", () => reject(new Error("SMTP connection timeout")));
    socket.once("error", reject);
  });
}

function encodeMailHeader(value) {
  return `=?UTF-8?B?${Buffer.from(String(value || ""), "utf8").toString("base64")}?=`;
}

function dotStuff(value) {
  return String(value || "").replace(/^\./gm, "..");
}

async function sendRecoveryEmail({ to, subject, text }) {
  if (!smtpConfigured()) {
    throw new Error("이메일 발송 설정이 필요합니다.");
  }

  let socket = await createSmtpSocket();
  try {
    await smtpCommand(socket, null, [220]);
    const ehlo = await smtpCommand(socket, `EHLO ${siteHostname}`, [250]);
    if (!smtpSecure && /STARTTLS/im.test(ehlo)) {
      await smtpCommand(socket, "STARTTLS", [220]);
      socket = tls.connect({ socket, servername: smtpHost });
      await new Promise((resolve, reject) => {
        socket.once("secureConnect", resolve);
        socket.once("error", reject);
      });
      await smtpCommand(socket, `EHLO ${siteHostname}`, [250]);
    }
    if (smtpUser && smtpPass) {
      const auth = Buffer.from(`\u0000${smtpUser}\u0000${smtpPass}`, "utf8").toString("base64");
      await smtpCommand(socket, `AUTH PLAIN ${auth}`, [235]);
    }
    const fromAddress = smtpFrom.replace(/^.*<|>.*$/g, "");
    await smtpCommand(socket, `MAIL FROM:<${fromAddress}>`, [250]);
    await smtpCommand(socket, `RCPT TO:<${to}>`, [250, 251]);
    await smtpCommand(socket, "DATA", [354]);
    const message = [
      `From: ${encodeMailHeader("bbitsena")} <${fromAddress}>`,
      `To: <${to}>`,
      `Subject: ${encodeMailHeader(subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      dotStuff(text),
      ".",
      "",
    ].join("\r\n");
    socket.write(message);
    await readSmtpResponse(socket);
    await smtpCommand(socket, "QUIT", [221]);
  } finally {
    socket.destroy();
  }
}

function recoveryMailText({ code, purpose }) {
  const label = purpose === "find_id" ? "아이디 찾기" : "비밀번호 재설정";
  return [
    `bbitsena ${label} 인증 코드입니다.`,
    "",
    `인증 코드: ${code}`,
    "",
    "이 코드는 10분 동안만 사용할 수 있습니다.",
    "본인이 요청하지 않았다면 이 메일을 무시해주세요.",
  ].join("\n");
}

function sanitizeCouponInput(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .slice(0, maxLength);
}

function serializeCouponRequest(row) {
  return {
    id: row.id,
    uid: row.uid,
    couponCode: row.coupon_code,
    status: row.status,
    message: row.message || "",
    createdAt: row.created_at,
  };
}

function serializeCouponCode(row) {
  return {
    id: row.id,
    code: row.code,
    label: row.label || "",
    active: Boolean(row.active),
    status: row.status || (row.active ? "active" : "inactive"),
    disabledReason: row.disabled_reason || "",
    lastResultStatus: row.last_result_status || "",
    lastResultMessage: row.last_result_message || "",
    statusUpdatedAt: row.status_updated_at || "",
    sortOrder: Number(row.sort_order) || 0,
    createdAt: row.created_at,
  };
}

function normalizeCouponRedeemUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.endsWith("/api/coupon")) return value;
  if (/^https:\/\/coupon\.netmarble\.com\/[^/]+\/?$/i.test(value)) return "https://coupon.netmarble.com/api/coupon";
  return value;
}

function couponResultMessage(payload, statusCode) {
  if (payload?.message) return String(payload.message);
  if (payload?.errorMessage) return String(payload.errorMessage);
  const errorMap = {
    200: "쿠폰 보상이 지급되었습니다.",
    22003: "회원번호를 확인해주세요.",
    22004: "쿠폰번호를 확인해주세요.",
    24002: "유효하지 않은 쿠폰 코드입니다.",
    24003: "만료되었거나 이미 사용된 쿠폰입니다.",
    24004: "\uD574\uB2F9 \uCFE0\uD3F0\uC758 \uAD50\uD658 \uD69F\uC218\uB97C \uCD08\uACFC\uD558\uC600\uC2B5\uB2C8\uB2E4.",
    24005: "사용 대상이 아닌 쿠폰입니다.",
    24006: "\uC720\uD6A8\uAE30\uAC04\uC774 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
    24012: "아이템 지급 중 오류가 발생했습니다.",
    99999: "쿠폰 서버에서 알 수 없는 오류가 발생했습니다.",
  };
  const code = payload?.errorCode || payload?.code || statusCode;
  return errorMap[code] || `쿠폰 처리 결과 코드 ${code || statusCode}`;
}

function couponResultStatus(payload, statusCode, message = "") {
  const code = Number(payload?.errorCode || payload?.code || payload?.resultCode || statusCode || 0);
  const text = String([
    message,
    payload?.message,
    payload?.errorMessage,
    payload?.error,
    payload?.text,
  ].filter(Boolean).join(" "));

  if (code === 200 || payload?.success === true) return "sent";
  if (/\uAD50\uD658\s*\uD69F\uC218|\uD69F\uC218\s*\uCD08\uACFC|\uC0AC\uC6A9\s*\uD69F\uC218|\uC218\uB839\s*\uD69F\uC218|exchange\s*limit|limit\s*exceed|redeem\s*limit/i.test(text)) return "limit_exceeded";
  if (code === 24004) return "limit_exceeded";
  if (code === 24006) return "expired";
  if (/\uC720\uD6A8\uAE30\uAC04|\uB9CC\uB8CC|\uC885\uB8CC|expired|expiration/i.test(text)) return "expired";
  if (/\uC774\uBBF8|\uC218\uB839|\uC0AC\uC6A9\uB41C|\uC0AC\uC6A9\s*\uC644\uB8CC|already|redeemed|claimed|used/i.test(text)) return "claimed";
  if (code === 24003) return "claimed";
  if (!normalizeCouponRedeemUrl(couponRedeemUrl)) return "pending";
  return "failed";
}

async function sendCouponToGame({ uid, couponCode }) {
  const redeemUrl = normalizeCouponRedeemUrl(couponRedeemUrl);
  if (!redeemUrl) {
    return {
      status: "pending",
      message: "공식 쿠폰 API가 아직 설정되지 않아 내부 기록만 저장했습니다.",
      response: { configured: false },
    };
  }

  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "bbitsena-coupon-tool/1.0",
    Origin: "https://coupon.netmarble.com",
    Referer: `https://coupon.netmarble.com/${couponGameCode}`,
  };
  if (couponApiToken) headers.Authorization = `Bearer ${couponApiToken}`;

  const response = await fetch(redeemUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      gameCode: couponGameCode,
      couponCode,
      langCd: couponLangCd,
      pid: uid,
    }),
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : { text: await response.text().catch(() => "") };

  const message = payload.error || couponResultMessage(payload, response.status);
  if (!response.ok || payload.success === false || (payload.errorCode && Number(payload.errorCode) !== 200)) {
    return {
      status: couponResultStatus(payload, response.status, message),
      message,
      response: payload,
    };
  }

  return {
    status: couponResultStatus(payload, response.status, message),
    message,
    response: payload,
  };
}

function insertCouponRequest({ userId, uid, couponCode, result }) {
  const id = crypto.randomUUID();
  db.prepare(
    `
      INSERT INTO coupon_requests (
        id, user_id, uid, coupon_code, status, message, response_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(id, userId, uid, couponCode, result.status, result.message, JSON.stringify(result.response || {}));
  return {
    id,
    uid,
    couponCode,
    status: result.status,
    message: result.message,
    createdAt: new Date().toISOString(),
  };
}

function createAuditLog({ actorId = null, action, targetType = "", targetId = "", details = {} }) {
  if (!action) return;
  db.prepare(
    `
      INSERT INTO audit_logs (actor_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, ?, ?)
    `,
  ).run(actorId, action, targetType, String(targetId || ""), JSON.stringify(details || {}));
}

function isExpiredCouponResult(result) {
  const response = result?.response || {};
  const code = Number(response.errorCode || response.code || response.resultCode || 0);
  const message = String(result?.message || response.message || response.errorMessage || "");
  if (result?.status === "expired") return true;
  if (result?.status === "limit_exceeded") return false;
  if (code === 24006) return true;
  if (code === 24004) return false;
  if (code === 24003) return false;
  return /\uC720\uD6A8\uAE30\uAC04|\uB9CC\uB8CC|\uC885\uB8CC/.test(message);
}

function recordCouponCodeResult(couponCode, result) {
  if (!couponCode || !result) return;
  db.prepare(
    `
      UPDATE coupon_codes
      SET last_result_status = ?,
          last_result_message = ?,
          status_updated_at = datetime('now'),
          updated_at = datetime('now')
      WHERE code = ?
    `,
  ).run(result.status || "failed", result.message || "", couponCode);
}

function notifySuperAdmins({ actorId, couponCode, message }) {
  const admins = db
    .prepare("SELECT id FROM users WHERE role = 'superadmin'")
    .all();
  admins.forEach((admin) => {
    createNotification({
      recipientId: admin.id,
      actorId: admin.id === actorId ? null : actorId,
      type: "coupon_expired",
      targetType: "coupon",
      targetId: couponCode,
      message,
    });
  });
}

function deactivateExpiredCoupon(couponCode, actorId, couponResult = {}) {
  const reason = couponResult.message || "\uC720\uD6A8\uAE30\uAC04\uC774 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
  const update = db
    .prepare(
      `
        UPDATE coupon_codes
        SET active = 0,
            status = 'expired',
            disabled_reason = ?,
            last_result_status = 'expired',
            last_result_message = ?,
            status_updated_at = datetime('now'),
            updated_at = datetime('now')
        WHERE code = ? AND active = 1
      `,
    )
    .run(reason, reason, couponCode);
  if (!update.changes) return false;

  const message = `${couponCode} \uCFE0\uD3F0\uC774 \uC720\uD6A8\uAE30\uAC04 \uB9CC\uB8CC\uB85C \uCFE0\uD3F0\uBD81\uC5D0\uC11C \uC228\uAE40 \uCC98\uB9AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. DB \uAE30\uB85D\uC740 \uBCF4\uAD00\uB429\uB2C8\uB2E4.`;
  createAuditLog({
    actorId,
    action: "coupon.expired.deactivate",
    targetType: "coupon",
    targetId: couponCode,
    details: { couponCode, reason, message },
  });
  notifySuperAdmins({ actorId, couponCode, message });
  return true;
}
function saveUserCouponUid(userId, uid) {
  if (!userId || !uid) return;
  db.prepare("UPDATE users SET coupon_uid = ?, updated_at = datetime('now') WHERE id = ?").run(uid, userId);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of authRateLimits.entries()) {
    if (bucket.resetAt <= now) authRateLimits.delete(key);
  }
}, 5 * 60 * 1000).unref();

function requireLegacyAdmin(req, res, next) {
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

function requireRole(minimumRole, message = "권한이 필요합니다.") {
  return (req, res, next) => {
    const session = readSession(req);
    if (!session) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const user = findUserByUsername(session.username);
    if (!user || !hasRole(user.role, minimumRole)) {
      return res.status(403).json({ error: message });
    }

    req.session = session;
    req.user = user;
    next();
  };
}

const requireSuperAdmin = requireRole("superadmin", "최고관리자 권한이 필요합니다.");

function requirePermission(key, message = "권한이 필요합니다.") {
  return (req, res, next) => {
    const session = readSession(req);
    if (!session) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const user = findUserByUsername(session.username);
    if (!user || !hasPermission(user, key)) {
      return res.status(403).json({ error: message });
    }

    req.session = session;
    req.user = user;
    next();
  };
}

const requireGuildManager = requirePermission("canManageGuild", "족보 관리 권한이 필요합니다.");
const requireUserManager = requirePermission("canManageUsers", "사용자 관리 권한이 필요합니다.");
const requireContentManager = requirePermission("canManageContent", "콘텐츠 관리 권한이 필요합니다.");

function requireAdmin(req, res, next) {
  return requirePermission("canAccessAdminDb", "최고관리자 권한이 필요합니다.")(req, res, next);
}

function requireContentAccess(req, res, next) {
  const session = readSession(req);
  if (!session) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  const user = findUserByUsername(session.username);
  if (!user || !hasPermission(user, "canReadPosts")) {
    return res.status(403).json({ error: "게시글 열람 권한이 없습니다." });
  }

  req.session = session;
  req.user = user;
  next();
}

function maybeUploadPostMedia(req, res, next) {
  if (!req.is("multipart/form-data")) return next();
  uploadPostMedia(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "파일은 500MB 이하로 업로드해주세요." });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: "이미지는 최대 6개, 동영상은 최대 3개까지 업로드할 수 있어요." });
    }
    if (err.message === "unsupported_media_type") {
      return res.status(400).json({ error: "이미지 또는 동영상 파일만 업로드할 수 있어요." });
    }
    return next(err);
  });
}

function requireMediaUploadPermission(req, res, next) {
  if (req.is("multipart/form-data") && !hasPermission(req.user, "canUploadMedia")) {
    return res.status(403).json({ error: "미디어 업로드 권한이 없습니다." });
  }
  next();
}

function requireCsrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  if (origin && !allowedRequestOrigins.has(origin)) {
    return res.status(403).json({ error: "허용되지 않은 요청 출처입니다." });
  }
  if (!origin && referer) {
    try {
      if (!allowedRequestOrigins.has(new URL(referer).origin)) {
        return res.status(403).json({ error: "허용되지 않은 요청 출처입니다." });
      }
    } catch {
      return res.status(403).json({ error: "허용되지 않은 요청 출처입니다." });
    }
  }
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

function readGuildWarSheetsState() {
  const rows = db.prepare(
    `
      SELECT sheet_type, payload_json
      FROM guild_war_sheets
      WHERE published = 1
      ORDER BY updated_at DESC, id DESC
    `,
  ).all();
  const state = {};
  rows.forEach((row) => {
    if (state[row.sheet_type]) return;
    state[row.sheet_type] = safeJsonParse(row.payload_json, null);
  });
  return state;
}

function saveGuildWarSheetsState(state, authorId) {
  const allowedTypes = ["attack", "defense"];
  const insertSheet = db.prepare(
    `
      INSERT INTO guild_war_sheets (sheet_type, title, payload_json, author_id, published, updated_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'))
    `,
  );
  const removeSheet = db.prepare("DELETE FROM guild_war_sheets WHERE sheet_type = ?");
  const save = db.transaction(() => {
    allowedTypes.forEach((sheetType) => {
      const sheet = state?.[sheetType];
      if (!sheet || typeof sheet !== "object") return;
      const title = String(sheet.title || (sheetType === "attack" ? "공격 족보" : "방어 족보")).slice(0, 80);
      removeSheet.run(sheetType);
      insertSheet.run(sheetType, title, JSON.stringify(sheet), authorId || null);
    });
  });
  save();
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

function getImportantNoticeSettings() {
  return readSetting("importantNotice", defaultImportantNoticeSettings);
}

function normalizeImportantNoticeSettings(value = {}) {
  const imageUrls = Array.isArray(value.imageUrls)
    ? value.imageUrls
      .map((url) => normalizeSafeUrl(url, { allowRelative: true, allowImagesOnly: true }).slice(0, 500))
      .filter(Boolean)
      .slice(0, 6)
    : [];
  const legacyImageUrl = normalizeSafeUrl(value.imageUrl, { allowRelative: true, allowImagesOnly: true }).slice(0, 500);
  return {
    enabled: Boolean(value.enabled),
    title: String(value.title || defaultImportantNoticeSettings.title).trim().slice(0, 80),
    eyebrow: String(value.eyebrow || defaultImportantNoticeSettings.eyebrow).trim().slice(0, 40),
    content: String(value.content || "").trim().slice(0, 1800),
    imageUrl: imageUrls[0] || legacyImageUrl,
    imageUrls: imageUrls.length ? imageUrls : legacyImageUrl ? [legacyImageUrl] : [],
    actionLabel: String(value.actionLabel || "").trim().slice(0, 30),
    actionUrl: normalizeSafeUrl(value.actionUrl, { allowRelative: true }).slice(0, 500),
    updatedAt: new Date().toISOString(),
  };
}

function getMainHeroSettings() {
  return readSetting("mainHero", defaultMainHeroSettings);
}

function normalizeMainHeroSettings(value = {}) {
  const imageUrls = Array.isArray(value.imageUrls)
    ? value.imageUrls
      .map((url) => normalizeSafeUrl(url, { allowRelative: true, allowImagesOnly: true }).slice(0, 500))
      .filter(Boolean)
      .slice(0, 10)
    : [];
  const intervalSeconds = Math.max(3, Math.min(20, Number(value.intervalSeconds) || defaultMainHeroSettings.intervalSeconds));
  return {
    imageUrls,
    intervalSeconds,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeHexColor(value, fallback) {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : fallback;
}

function getSiteAppearanceSettings() {
  return readSetting("siteAppearance", defaultSiteAppearanceSettings);
}

function normalizeSiteAppearanceSettings(value = {}) {
  return {
    mentionColor: normalizeHexColor(value.mentionColor, defaultSiteAppearanceSettings.mentionColor),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeBoardTagSettings(value = {}) {
  const source = Array.isArray(value.tags) ? value.tags : defaultBoardTagSettings.tags;
  const seen = new Set();
  const tags = source
    .map((tag) => ({
      name: String(tag?.name || "").trim().slice(0, 30),
      color: normalizeHexColor(tag?.color, "#6ce7d2"),
    }))
    .filter((tag) => {
      if (!tag.name || seen.has(tag.name)) return false;
      seen.add(tag.name);
      return true;
    })
    .slice(0, 40);
  return {
    tags: tags.length ? tags : defaultBoardTagSettings.tags,
    updatedAt: new Date().toISOString(),
  };
}

function getBoardTagSettings() {
  return normalizeBoardTagSettings(readSetting("boardTags", defaultBoardTagSettings));
}

function getPostStatsForUser(postId, userId) {
  if (!userId) return { bookmarked: false, reported: false };
  return {
    bookmarked: Boolean(db.prepare("SELECT 1 FROM post_bookmarks WHERE post_id = ? AND user_id = ?").get(postId, userId)),
    reported: Boolean(db.prepare("SELECT 1 FROM post_reports WHERE post_id = ? AND reporter_id = ?").get(postId, userId)),
  };
}

function normalizeSafeUrl(value, { allowRelative = false, allowImagesOnly = false } = {}) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (allowRelative && raw.startsWith("/")) {
    if (raw.startsWith("//") || raw.includes("\\")) return "";
    if (allowImagesOnly && !isSafeUploadedImagePath(raw)) return "";
    return raw.slice(0, 500);
  }

  try {
    const url = new URL(raw);
    if (!["https:", "http:"].includes(url.protocol)) return "";
    if (allowImagesOnly && !/\.(jpe?g|jfif|pjpe?g|png|gif|webp|avif|bmp)$/i.test(url.pathname)) return "";
    return url.toString().slice(0, 500);
  } catch {
    return "";
  }
}

function isSafeUploadedImagePath(src = "") {
  return /^\/uploads\/[a-zA-Z0-9/_-]+\.(jpe?g|jfif|pjpe?g|png|gif|webp|avif|bmp)$/i.test(String(src || ""));
}

function isSafeUploadedVideoPath(src = "") {
  return /^\/uploads\/[a-zA-Z0-9/_-]+\.(mp4|m4v|webm|ogv|ogg|mov|mpeg|mpg|avi|mkv)$/i.test(String(src || ""));
}

function normalizeYoutubeEmbedUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    let videoId = "";
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/embed/")) videoId = url.pathname.split("/")[2] || "";
      else videoId = url.searchParams.get("v") || "";
    } else if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    }
    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return "";
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return "";
  }
}

function isSafeDisplayText(value) {
  return !/[<>\u0000-\u001f\u007f]/.test(String(value || ""));
}

function normalizeBoardName(value) {
  return String(value || "").trim();
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
    media: sanitizeStoredMedia(safeJsonParse(row.media_json, {})),
    votes: row.votes || 0,
    views: row.views || 0,
    sortOrder: row.sort_order || 0,
    status: row.status,
    createdAt: row.created_at,
    author: row.author_name || row.author_username || "익명",
    authorUsername: row.author_username || "",
    authorRole: normalizeRole(row.author_role || "user"),
  };
}

function sanitizeStoredMedia(media = {}) {
  const images = Array.isArray(media.images)
    ? media.images
      .filter((image) => {
        const src = String(image?.src || "");
        return isSafeUploadedImagePath(src) || isAllowedDataUrl(src, "image") || normalizeSafeUrl(src, { allowImagesOnly: true });
      })
      .slice(0, 6)
      .map((image) => ({
        name: String(image.name || "첨부 이미지").slice(0, 80),
        type: normalizeAllowedMime(image.type, "image"),
        src: String(image.src || "").slice(0, 500000),
      }))
    : [];
  const rawVideos = Array.isArray(media.videos) ? media.videos : media.videoFile ? [media.videoFile] : [];
  const videos = rawVideos
    .filter((video) => {
      const src = String(video?.src || "");
      return isSafeUploadedVideoPath(src) || isAllowedDataUrl(src, "video");
    })
    .slice(0, 3)
    .map((video) => ({
      name: String(video.name || "첨부 동영상").slice(0, 80),
      type: normalizeAllowedMime(video.type, "video") || "video/mp4",
      size: Number(video.size) || 0,
      src: String(video.src || "").slice(0, 500000),
    }));
  return {
    images,
    videos,
    videoFile: videos[0] || null,
    youtube: String(media.youtube || "").trim().slice(0, 240),
    youtubeEmbed: normalizeYoutubeEmbedUrl(media.youtubeEmbed || media.youtube),
    pveGuide: normalizePveGuide(media.pveGuide),
  };
}

function normalizePveAccessoryRefine(value) {
  const refine = String(value || '').trim();
  const aliases = {
    권불: '불사세공',
    불권: '불사세공',
    불부: '불사세공',
    불기: '불사세공',
    부불: '부활세공',
    부권: '부활세공',
    불부활: '부활세공',
    권기: '권능세공',
    기권: '권능세공',
    권부: '권능세공',
    권능: '권능세공',
    부활: '부활세공',
    불사: '불사세공',
    기합: '기합세공',
    철벽: '철벽세공',
    세공: '',
    없음: '-',
  };
  return aliases[refine] || refine;
}

function normalizePveGuide(value) {
  const raw = typeof value === "string" ? safeJsonParse(value, {}) : value;
  if (!raw || typeof raw !== "object") return null;
  const cleanList = (items, limit, mapper) => Array.isArray(items)
    ? items.map(mapper).filter((item) => Object.values(item).some(Boolean)).slice(0, limit)
    : [];
  return {
    mode: ["pve", "pvp"].includes(String(raw.mode || "")) ? String(raw.mode) : "pve",
    type: String(raw.type || "").trim().slice(0, 30),
    boss: String(raw.boss || "").trim().slice(0, 40),
    power: String(raw.power || "").trim().slice(0, 40),
    formation: String(raw.formation || "").trim().slice(0, 60),
    formationType: ["att", "bal", "base", "def"].includes(String(raw.formationType || "")) ? String(raw.formationType) : "",
    allyTeam: String(raw.allyTeam || "").trim().slice(0, 80),
    winPlan: String(raw.winPlan || "").trim().slice(0, 80),
    caution: String(raw.caution || "").trim().slice(0, 400),
    mainPet: String(raw.mainPet || "").trim().slice(0, 30),
    subPet: String(raw.subPet || "").trim().slice(0, 30),
    note: String(raw.note || "").trim().slice(0, 1000),
    heroes: cleanList(raw.heroes, 10, (hero) => ({
      name: String(hero?.name || "").trim().slice(0, 30),
      role: String(hero?.role || "").trim().slice(0, 40),
      accessory: String(hero?.accessory || "").trim().slice(0, 20),
      refine: normalizePveAccessoryRefine(hero?.refine).slice(0, 20),
      grade: String(hero?.grade || "").trim().slice(0, 10),
    })),
    specs: cleanList(raw.specs, 6, (spec) => ({
      label: String(spec?.label || "").trim().slice(0, 30),
      value: String(spec?.value || "").trim().slice(0, 40),
      memo: String(spec?.memo || "").trim().slice(0, 80),
    })),
  };
}

function serializeComment(row) {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_comment_id || null,
    content: row.content || "",
    votes: row.votes || 0,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: row.author_name || row.author_username || "익명",
    authorUsername: row.author_username || "",
    authorRole: normalizeRole(row.author_role || "user"),
    postTitle: row.post_title || "",
    postCategory: row.post_category || "",
  };
}

function canManagePost(user, post) {
  if (!user || !post) return false;
  if (hasPermission(user, "canManageContent")) return true;
  return post.author_id === user.id && hasPermission(user, "canEditOwnPosts");
}

function canManageNoticePosts(user) {
  const flags = roleFlags(user);
  return Boolean(flags.isSuperAdmin || flags.canManageContent || flags.canAccessAdminDb);
}

function isInternalNoticeCategory(category) {
  return String(category || "").trim() === internalNoticeCategory;
}

function serializeNotification(row) {
  return {
    id: row.id,
    type: row.type,
    targetType: row.target_type,
    targetId: row.target_id,
    postId: row.post_id || "",
    commentId: row.comment_id || null,
    message: row.message || "",
    readAt: row.read_at || "",
    createdAt: row.created_at,
    actor: row.actor_name || row.actor_username || "익명",
    postTitle: row.post_title || "",
  };
}

function withUserVoteState(post, userId) {
  if (!userId) return post;
  const extra = getPostStatsForUser(post.id, userId);
  return {
    ...post,
    voted: Boolean(db.prepare("SELECT 1 FROM post_votes WHERE post_id = ? AND user_id = ?").get(post.id, userId)),
    ...extra,
  };
}

function withUserCommentVoteState(comment, userId) {
  if (!userId) return comment;
  return {
    ...comment,
    voted: Boolean(db.prepare("SELECT 1 FROM comment_votes WHERE comment_id = ? AND user_id = ?").get(comment.id, userId)),
  };
}

function createNotification({ recipientId, actorId, type, targetType, targetId, postId, commentId, message }) {
  if (!recipientId || recipientId === actorId) return;
  const result = db.prepare(
    `
      INSERT INTO notifications (
        recipient_id, actor_id, type, target_type, target_id,
        post_id, comment_id, message
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(recipientId, actorId || null, type, targetType, String(targetId), postId || null, commentId || null, message);
  pushNotification(recipientId, result.lastInsertRowid);
}

const mentionAliases = new Map([
  ["all", "all"],
  ["everyone", "all"],
  ["전체", "all"],
  ["관리자", "admin"],
  ["운영진", "admin"],
  ["정예", "elite"],
  ["권한", "privileged"],
]);

function extractMentionTokens(...values) {
  const tokens = new Set();
  const mentionPattern = /(^|[\s([{<])@([가-힣A-Za-z0-9_-]{1,30})/g;
  for (const value of values) {
    const text = String(value || "");
    for (const match of text.matchAll(mentionPattern)) {
      tokens.add(match[2]);
    }
  }
  return [...tokens].slice(0, 20);
}

function canUseGroupMention(user) {
  const flags = roleFlags(user);
  return Boolean(flags.isAdmin || flags.canManageContent || flags.canManageUsers || flags.canAccessAdminDb);
}

function isMentionVisibleUser(user) {
  return Boolean(user?.id && hasPermission(user, "canReadPosts"));
}

function matchesMentionGroup(user, group) {
  const flags = roleFlags(user);
  if (group === "all") return isMentionVisibleUser(user);
  if (group === "admin") return Boolean(flags.isAdmin || flags.canManageGuild || flags.canManageContent || flags.canManageUsers || flags.canAccessAdminDb);
  if (group === "elite") return Boolean(flags.isVerified);
  if (group === "privileged") return Boolean(flags.isAdmin || flags.isVerified || flags.canManageGuild || flags.canManageContent || flags.canManageUsers || flags.canAccessAdminDb);
  return false;
}

function selectMentionUsersForGroup(group, actorId) {
  return db
    .prepare(
      `
        SELECT id, username, display_name, role, permissions_json
        FROM users
        WHERE id != ?
        ORDER BY datetime(created_at) ASC
        LIMIT 500
      `,
    )
    .all(actorId)
    .filter((user) => matchesMentionGroup(user, group))
    .slice(0, 100);
}

function selectMentionUsersByName(token, actorId) {
  const name = String(token || "").trim();
  if (!name) return [];
  return db
    .prepare(
      `
        SELECT id, username, display_name, role, permissions_json
        FROM users
        WHERE id != ?
          AND (
            username = ? COLLATE NOCASE
            OR display_name = ?
            OR username LIKE ? COLLATE NOCASE
            OR display_name LIKE ?
          )
        LIMIT 10
      `,
    )
    .all(actorId, name, name, `${name}%`, `${name}%`)
    .filter(isMentionVisibleUser);
}

const hangulInitials = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

function getHangulInitials(value) {
  return String(value || "")
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return char;
      return hangulInitials[Math.floor(code / 588)] || char;
    })
    .join("");
}

function matchesMentionQuery(value, query) {
  const text = String(value || "").trim().toLowerCase();
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return true;
  return text.includes(needle) || getHangulInitials(text).includes(needle);
}

function selectMentionSuggestions(query, actorId) {
  const needle = String(query || "").trim();
  return db
    .prepare(
      `
        SELECT id, username, display_name, role, permissions_json
        FROM users
        WHERE id != ?
        ORDER BY datetime(created_at) DESC
        LIMIT 500
      `,
    )
    .all(actorId)
    .filter(isMentionVisibleUser)
    .filter((user) => matchesMentionQuery(user.display_name, needle) || matchesMentionQuery(user.username, needle))
    .slice(0, 8)
    .map((user) => ({
      id: user.id,
      kind: "user",
      label: user.display_name || user.username,
      username: user.username,
      role: user.role || "user",
    }));
}

function createMentionNotifications({ actor, postId, commentId = null, targetType, sourceText }) {
  const tokens = extractMentionTokens(sourceText);
  if (!tokens.length) return;

  const recipients = new Map();
  const mentionLabels = [];
  const allowGroupMention = canUseGroupMention(actor);
  for (const token of tokens) {
    const alias = mentionAliases.get(token.toLowerCase()) || mentionAliases.get(token);
    if (alias) {
      if (!allowGroupMention) continue;
      mentionLabels.push(token);
      for (const user of selectMentionUsersForGroup(alias, actor.id)) {
        recipients.set(user.id, user);
      }
      continue;
    }
    const users = selectMentionUsersByName(token, actor.id);
    if (users.length) mentionLabels.push(token);
    for (const user of users) {
      recipients.set(user.id, user);
    }
  }

  if (!recipients.size) return;
  const actorName = actor.display_name || actor.username || "누군가";
  const place = targetType === "comment" ? "댓글" : "게시글";
  const mentionText = mentionLabels.length ? ` @${mentionLabels[0]}` : "";
  const message = `${actorName}님이 ${place}에서${mentionText} 멘션했습니다.`;

  for (const recipient of recipients.values()) {
    createNotification({
      recipientId: recipient.id,
      actorId: actor.id,
      type: "mention",
      targetType,
      targetId: commentId || postId,
      postId,
      commentId,
      message,
    });
  }
}

function getUnreadNotificationCount(userId) {
  return Number(
    db.prepare("SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = ? AND read_at IS NULL").get(userId)?.count,
  ) || 0;
}

function pushNotification(userId, notificationId) {
  const clients = notificationStreams.get(userId);
  if (!clients?.size) return;
  const row = db
    .prepare(
      `
        SELECT
          notifications.*,
          users.display_name AS actor_name,
          users.username AS actor_username,
          posts.title AS post_title
        FROM notifications
        LEFT JOIN users ON users.id = notifications.actor_id
        LEFT JOIN posts ON posts.id = notifications.post_id
        WHERE notifications.id = ?
      `,
    )
    .get(notificationId);
  const payload = JSON.stringify({
    unreadCount: getUnreadNotificationCount(userId),
    notification: row ? serializeNotification(row) : null,
  });
  for (const client of clients) {
    client.write(`event: notification\n`);
    client.write(`data: ${payload}\n\n`);
  }
}

function normalizePostMedia(media = {}) {
  const images = Array.isArray(media.images)
    ? media.images
      .filter((image) => typeof image?.src === "string" && isAllowedDataUrl(image.src, "image"))
      .slice(0, 6)
      .map((image) => ({
        name: String(image.name || "첨부 이미지").slice(0, 80),
        type: normalizeAllowedMime(image.type, "image"),
        src: image.src,
      }))
    : [];
  const videoFile = media.videoFile && typeof media.videoFile === "object" ? media.videoFile : null;
  const normalizedVideo = videoFile?.src && isAllowedDataUrl(videoFile.src, "video")
    ? {
      name: String(videoFile.name || "첨부 동영상").slice(0, 80),
      type: normalizeAllowedMime(videoFile.type, "video") || mimeFromDataUrl(videoFile.src) || "video/mp4",
      size: Number(videoFile.size) || 0,
      src: videoFile.src,
    }
    : null;

  return {
    images,
    videoFile: normalizedVideo,
    youtube: String(media.youtube || "").trim().slice(0, 240),
    youtubeEmbed: normalizeYoutubeEmbedUrl(media.youtubeEmbed || media.youtube),
    pveGuide: normalizePveGuide(media.pveGuide),
  };
}

function postMediaHasPayload(media = {}) {
  return Boolean(
    (Array.isArray(media.images) && media.images.length) ||
    (Array.isArray(media.videos) && media.videos.length) ||
    media.videoFile ||
    media.youtube ||
    media.youtubeEmbed,
  );
}

function normalizeTagsInput(value) {
  const cleanTags = (items) => items
    .flatMap((tag) => String(tag || "").split(/[,\n#]+|\s{2,}/))
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .slice(0, 4);
  if (Array.isArray(value)) return cleanTags(value);
  const text = String(value || "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return cleanTags(parsed);
  } catch {
    // Fall through to comma-separated tags.
  }
  return cleanTags(text.split(/[,\n#]+|\s{2,}/));
}

function extensionFromMime(mimeType = "") {
  const cleanType = normalizeMimeAlias(mimeType);
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/bmp": "bmp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogv",
    "video/quicktime": "mov",
    "video/x-m4v": "m4v",
    "video/mpeg": "mpg",
    "video/x-msvideo": "avi",
    "video/x-matroska": "mkv",
  };
  return map[cleanType] || "";
}

function normalizeMimeAlias(mimeType = "") {
  const cleanType = String(mimeType).split(";")[0].trim().toLowerCase();
  const aliases = {
    "image/jpg": "image/jpeg",
    "image/pjpeg": "image/jpeg",
    "image/x-png": "image/png",
    "image/x-ms-bmp": "image/bmp",
    "video/mov": "video/quicktime",
    "video/x-quicktime": "video/quicktime",
    "video/avi": "video/x-msvideo",
    "video/msvideo": "video/x-msvideo",
    "application/ogg": "video/ogg",
    "application/x-matroska": "video/x-matroska",
  };
  return aliases[cleanType] || cleanType;
}

function mimeFromExtension(filename = "") {
  const extension = path.extname(String(filename)).toLowerCase();
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".jfif": "image/jpeg",
    ".pjpeg": "image/jpeg",
    ".pjp": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".bmp": "image/bmp",
    ".dib": "image/bmp",
    ".mp4": "video/mp4",
    ".m4v": "video/x-m4v",
    ".webm": "video/webm",
    ".ogv": "video/ogg",
    ".ogg": "video/ogg",
    ".mov": "video/quicktime",
    ".qt": "video/quicktime",
    ".mpeg": "video/mpeg",
    ".mpg": "video/mpeg",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
  };
  return map[extension] || "";
}

function normalizeAllowedMime(mimeType = "", kind) {
  const cleanType = normalizeMimeAlias(mimeType);
  const allowed = kind === "image" ? allowedImageMimeTypes : allowedVideoMimeTypes;
  return allowed.has(cleanType) ? cleanType : "";
}

function mimeFromUpload(file, kind) {
  return mimeCandidatesFromUpload(file, kind)[0] || "";
}

function mimeCandidatesFromUpload(file, kind) {
  return [
    normalizeAllowedMime(file?.mimetype, kind),
    normalizeAllowedMime(mimeFromExtension(file?.originalname), kind),
  ].filter((mimeType, index, list) => mimeType && list.indexOf(mimeType) === index);
}

function mimeFromDataUrl(value = "") {
  return String(value).match(/^data:([^;,]+)[;,]/)?.[1]?.toLowerCase() || "";
}

function isAllowedDataUrl(value = "", kind) {
  const rawMimeType = mimeFromDataUrl(value);
  const mimeType = normalizeAllowedMime(rawMimeType, kind);
  const allowed = kind === "image" ? allowedImageMimeTypes : allowedVideoMimeTypes;
  return allowed.has(mimeType) && String(value).startsWith(`data:${rawMimeType};base64,`);
}

function hasMagicBytes(buffer, kind, mimeType) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  const mime = normalizeAllowedMime(mimeType, kind);
  if (!mime) return false;
  if (mime === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/gif") return buffer.subarray(0, 4).toString("ascii") === "GIF8";
  if (mime === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (mime === "image/avif") return buffer.subarray(4, 8).toString("ascii") === "ftyp" && buffer.subarray(8, 16).toString("ascii").includes("avif");
  if (mime === "image/bmp") return buffer.subarray(0, 2).toString("ascii") === "BM";
  if (mime === "video/webm") return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mime === "video/x-matroska") return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mime === "video/ogg") return buffer.subarray(0, 4).toString("ascii") === "OggS";
  if (mime === "video/mp4" || mime === "video/quicktime" || mime === "video/x-m4v") return buffer.subarray(4, 8).toString("ascii") === "ftyp";
  if (mime === "video/mpeg") return buffer.subarray(0, 3).equals(Buffer.from([0x00, 0x00, 0x01]));
  if (mime === "video/x-msvideo") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "AVI ";
  return false;
}

function assertUploadedFile(file, kind) {
  if (!file?.path) throw Object.assign(new Error("invalid_upload"), { status: 400 });
  const mimeTypes = mimeCandidatesFromUpload(file, kind);
  if (!mimeTypes.length) throw Object.assign(new Error("unsupported_upload_type"), { status: 400 });
  const header = fs.readFileSync(file.path).subarray(0, 32);
  const mimeType = mimeTypes.find((candidate) => hasMagicBytes(header, kind, candidate));
  if (!mimeType) throw Object.assign(new Error("invalid_upload_signature"), { status: 400 });
  file.detectedMimeType = mimeType;
}

function savePostVideoFile(postId, videoFile) {
  if (!videoFile?.src) return null;
  if (!String(videoFile.src).startsWith("/uploads/") && !String(videoFile.src).startsWith("data:video/")) return null;
  if (String(videoFile.src).startsWith("/uploads/")) return videoFile;

  const match = String(videoFile.src).match(/^data:(video\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const type = normalizeAllowedMime(videoFile.type || match[1], "video");
  if (!type) return null;
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > maxPostVideoSize) {
    const error = new Error("video_too_large");
    error.status = 400;
    throw error;
  }
  if (!hasMagicBytes(buffer.subarray(0, 32), "video", type)) {
    const error = new Error("invalid_video_signature");
    error.status = 400;
    throw error;
  }

  const directory = path.join(uploadRoot, "posts", postId);
  const extension = extensionFromMime(type);
  const storedName = `video.${extension}`;
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, storedName), buffer);

  return {
    name: String(videoFile.name || "첨부 동영상").slice(0, 80),
    type,
    size: buffer.length,
    src: `/uploads/posts/${postId}/${storedName}`,
  };
}

function moveUploadedFile(postId, file, index) {
  const directory = path.join(uploadRoot, "posts", postId);
  const mimeType = file.detectedMimeType || mimeFromUpload(file, file.fieldname === "images" ? "image" : "video") || file.mimetype;
  const extension = extensionFromMime(mimeType) || path.extname(file.originalname).slice(1) || "bin";
  const storedName = `${file.fieldname}-${index + 1}.${extension}`;
  const targetPath = path.join(directory, storedName);
  fs.mkdirSync(directory, { recursive: true });
  try {
    fs.renameSync(file.path, targetPath);
  } catch (err) {
    if (err.code !== "EXDEV") throw err;
    fs.copyFileSync(file.path, targetPath);
    fs.unlinkSync(file.path);
  }
  return {
    name: String(file.originalname || storedName).slice(0, 80),
    type: String(mimeType || "").slice(0, 80),
    size: file.size,
    src: `/uploads/posts/${postId}/${storedName}`,
  };
}

function cleanupUploadedFiles(files = {}) {
  Object.values(files).flat().forEach((file) => {
    if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
  });
}

function buildUploadedPostMedia(postId, body, files = {}) {
  const images = (files.images || []).map((file, index) => {
    assertUploadedFile(file, "image");
    if (file.size > maxPostImageSize) {
      const error = new Error("image_too_large");
      error.status = 400;
      throw error;
    }
    return moveUploadedFile(postId, file, index);
  });
  const videos = (files.videos || []).map((file, index) => {
    assertUploadedFile(file, "video");
    return moveUploadedFile(postId, file, index);
  });
  return {
    images,
    videoFile: videos[0] || null,
    videos,
    youtube: String(body.youtube || "").trim().slice(0, 240),
    youtubeEmbed: normalizeYoutubeEmbedUrl(body.youtubeEmbed || body.youtube),
    pveGuide: normalizePveGuide(body.pveGuide),
  };
}

function selectPostRows(where = "posts.status = 'published'", params = []) {
  return db
    .prepare(
      `
        SELECT
          posts.*,
          users.display_name AS author_name,
          users.username AS author_username,
          users.role AS author_role
        FROM posts
        LEFT JOIN users ON users.id = posts.author_id
        WHERE ${where}
        ORDER BY posts.sort_order DESC, datetime(posts.created_at) DESC
      `,
    )
    .all(...params);
}

function selectCommentRows(where = "post_comments.status = 'published'", params = []) {
  return db
    .prepare(
      `
        SELECT
          post_comments.*,
          users.display_name AS author_name,
          users.username AS author_username,
          users.role AS author_role,
          posts.title AS post_title,
          posts.category AS post_category
        FROM post_comments
        LEFT JOIN users ON users.id = post_comments.user_id
        LEFT JOIN posts ON posts.id = post_comments.post_id
        WHERE ${where}
        ORDER BY COALESCE(post_comments.parent_comment_id, post_comments.id) ASC,
          post_comments.parent_comment_id IS NOT NULL ASC,
          datetime(post_comments.created_at) ASC
      `,
    )
    .all(...params);
}

function selectNotificationRows(userId) {
  return db
    .prepare(
      `
        SELECT
          notifications.*,
          users.display_name AS actor_name,
          users.username AS actor_username,
          posts.title AS post_title
        FROM notifications
        LEFT JOIN users ON users.id = notifications.actor_id
        LEFT JOIN posts ON posts.id = notifications.post_id
        WHERE notifications.recipient_id = ?
        ORDER BY datetime(notifications.created_at) DESC
        LIMIT 30
      `,
    )
    .all(userId);
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
  if (checkRateLimit(req, res, "login", 8)) return;
  const { username, password, remember } = req.body || {};
  const user = findUserByUsername(username);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
  }

  setAuthCookie(res, user.username, Boolean(remember));
  res.json(serializeUser(user));
});

app.post("/api/recovery/find-id/request", async (req, res) => {
  if (checkRateLimit(req, res, "recovery:find-id", 5, 30 * 60 * 1000)) return;
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) return res.status(400).json({ error: "이메일 형식이 올바르지 않습니다." });

  const users = selectLocalUsersByEmail(email);
  if (!users.length) {
    return res.json({ ok: true, message: "가입된 이메일이라면 인증 코드가 발송됩니다." });
  }

  try {
    const code = createEmailVerification({ email, purpose: "find_id" });
    await sendRecoveryEmail({
      to: email,
      subject: "[bbitsena] 아이디 찾기 인증 코드",
      text: recoveryMailText({ code, purpose: "find_id" }),
    });
    res.json({ ok: true, message: "인증 코드를 이메일로 발송했습니다." });
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: "이메일 발송 설정이 필요하거나 발송에 실패했습니다." });
  }
});

app.post("/api/recovery/find-id/verify", (req, res) => {
  if (checkRateLimit(req, res, "recovery:find-id:verify", 10)) return;
  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || "").trim();
  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "이메일과 6자리 인증 코드를 확인해주세요." });
  }

  const verified = verifyEmailCode({ email, purpose: "find_id", code });
  if (!verified.ok) return res.status(400).json({ error: verified.error });
  const users = selectLocalUsersByEmail(email);
  consumeEmailVerification(verified.row.id);
  res.json({
    ok: true,
    users: users.map((user) => ({
      username: user.username,
      displayName: user.display_name || user.username,
    })),
  });
});

app.post("/api/recovery/password/request", async (req, res) => {
  if (checkRateLimit(req, res, "recovery:password", 5, 30 * 60 * 1000)) return;
  const email = normalizeEmail(req.body?.email);
  const username = String(req.body?.username || "").trim();
  if (!isValidEmail(email)) return res.status(400).json({ error: "이메일 형식이 올바르지 않습니다." });

  const user = selectPasswordResetUser({ email, username });
  if (!user) {
    return res.json({ ok: true, message: "계정 정보가 일치하면 인증 코드가 발송됩니다." });
  }

  try {
    const code = createEmailVerification({ email, username: user.username, purpose: "reset_password" });
    await sendRecoveryEmail({
      to: email,
      subject: "[bbitsena] 비밀번호 재설정 인증 코드",
      text: recoveryMailText({ code, purpose: "reset_password" }),
    });
    res.json({ ok: true, message: "인증 코드를 이메일로 발송했습니다." });
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: "이메일 발송 설정이 필요하거나 발송에 실패했습니다." });
  }
});

app.post("/api/recovery/password/verify", (req, res) => {
  if (checkRateLimit(req, res, "recovery:password:verify", 10)) return;
  const email = normalizeEmail(req.body?.email);
  const username = String(req.body?.username || "").trim();
  const code = String(req.body?.code || "").trim();
  if (!isValidEmail(email) || !username || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "아이디, 이메일, 6자리 인증 코드를 확인해주세요." });
  }

  const user = selectPasswordResetUser({ email, username });
  if (!user) return res.status(400).json({ error: "계정 정보를 확인해주세요." });
  const verified = verifyEmailCode({ email, username: user.username, purpose: "reset_password", code });
  if (!verified.ok) return res.status(400).json({ error: verified.error });

  consumeEmailVerification(verified.row.id);
  res.json({ ok: true, resetToken: issuePasswordResetToken(verified.row.id) });
});

app.post("/api/recovery/password/reset", (req, res) => {
  if (checkRateLimit(req, res, "recovery:password:reset", 10)) return;
  const resetToken = String(req.body?.resetToken || "");
  const password = String(req.body?.password || "");
  const passwordConfirm = String(req.body?.passwordConfirm || "");
  if (password.length < 8) return res.status(400).json({ error: "비밀번호는 8자 이상으로 입력해주세요." });
  if (password !== passwordConfirm) return res.status(400).json({ error: "비밀번호 확인이 일치하지 않습니다." });

  const recovery = findPasswordResetByToken(resetToken);
  if (!recovery || Date.parse(recovery.reset_token_expires_at) <= Date.now()) {
    return res.status(400).json({ error: "비밀번호 재설정 시간이 만료되었습니다. 다시 인증해주세요." });
  }

  const user = selectPasswordResetUser({ email: recovery.email, username: recovery.username });
  if (!user) return res.status(400).json({ error: "계정 정보를 확인해주세요." });

  db.prepare(
    `
      UPDATE users
      SET password_hash = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `,
  ).run(hashPassword(password), user.id);
  db.prepare(
    `
      UPDATE email_verifications
      SET reset_token_hash = NULL,
          reset_token_expires_at = NULL
      WHERE id = ?
    `,
  ).run(recovery.id);

  res.json({ ok: true, message: "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요." });
});

app.post("/api/register", (req, res) => {
  if (checkRateLimit(req, res, "register", 5, 30 * 60 * 1000)) return;
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
  if (normalizedDisplayName && (!isSafeDisplayText(normalizedDisplayName) || [...normalizedDisplayName].length > 16)) {
    return res.status(400).json({ error: "닉네임은 특수 HTML 문자 없이 16자 이하로 입력해주세요." });
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
  clearAuthCookies(res);
  res.json({ loggedIn: false, role: "guest" });
});

app.patch("/api/me/display-name", requireMember, (req, res) => {
  const displayName = String(req.body?.displayName || "").trim();
  const displayNameLength = [...displayName].length;

  if (displayNameLength < 2 || displayNameLength > 16) {
    return res.status(400).json({ error: "닉네임은 2~16자로 입력해주세요." });
  }
  if (!isSafeDisplayText(displayName)) {
    return res.status(400).json({ error: "닉네임에는 HTML 특수 문자를 사용할 수 없습니다." });
  }

  const user = updateUserDisplayName(req.user.username, displayName);
  res.json(serializeUser(user));
});

app.get("/api/mentions", requireMember, (req, res) => {
  const query = String(req.query.q || "").trim().replace(/^@/, "").slice(0, 30);
  const groupOptions = [
    { kind: "group", label: "전체", username: "모든 열람 가능 회원" },
    { kind: "group", label: "관리자", username: "관리자 그룹" },
    { kind: "group", label: "정예", username: "정예 그룹" },
    { kind: "group", label: "권한", username: "관리자/정예 그룹" },
  ].filter((item) => matchesMentionQuery(item.label, query));
  const groups = canUseGroupMention(req.user) ? groupOptions : [];
  const users = selectMentionSuggestions(query, req.user.id);
  res.json({ items: [...groups, ...users].slice(0, 10) });
});

app.get("/api/me/bookmarks", requireMember, (req, res) => {
  const bookmarkedPosts = db
    .prepare(
      `
        SELECT
          posts.*,
          users.display_name AS author_name,
          users.username AS author_username,
          users.role AS author_role,
          post_bookmarks.created_at AS bookmarked_at
        FROM post_bookmarks
        JOIN posts ON posts.id = post_bookmarks.post_id
        LEFT JOIN users ON users.id = posts.author_id
        WHERE post_bookmarks.user_id = ?
          AND posts.status = 'published'
        ORDER BY datetime(post_bookmarks.created_at) DESC
        LIMIT 12
      `,
    )
    .all(req.user.id)
    .map((row) => ({
      ...serializePost(row),
      bookmarkedAt: row.bookmarked_at,
    }));

  res.json({ bookmarkedPosts });
});

app.get("/api/me/activity", requireMember, (req, res) => {
  const user = req.user;
  const stats = db
    .prepare(
      `
        SELECT
          COUNT(*) AS postCount,
          COALESCE(SUM(comments), 0) AS commentCount,
          COALESCE(SUM(votes), 0) AS voteCount,
          COALESCE(SUM(views), 0) AS viewCount
        FROM posts
        WHERE author_id = ?
      `,
    )
    .get(user.id);
  const recentPosts = selectPostRows("posts.author_id = ?", [user.id]).slice(0, 8).map(serializePost);
  const ownCommentCount = db
    .prepare("SELECT COUNT(*) AS count FROM post_comments WHERE user_id = ? AND status = 'published'")
    .get(user.id);
  const likedPosts = db
    .prepare(
      `
        SELECT
          posts.*,
          users.display_name AS author_name,
          users.username AS author_username,
          post_votes.created_at AS voted_at
        FROM post_votes
        JOIN posts ON posts.id = post_votes.post_id
        LEFT JOIN users ON users.id = posts.author_id
        WHERE post_votes.user_id = ?
          AND posts.status = 'published'
        ORDER BY datetime(post_votes.created_at) DESC
        LIMIT 12
      `,
    )
    .all(user.id)
    .map((row) => ({
      ...serializePost(row),
      votedAt: row.voted_at,
    }));
  const bookmarkedPosts = db
    .prepare(
      `
        SELECT
          posts.*,
          users.display_name AS author_name,
          users.username AS author_username,
          post_bookmarks.created_at AS bookmarked_at
        FROM post_bookmarks
        JOIN posts ON posts.id = post_bookmarks.post_id
        LEFT JOIN users ON users.id = posts.author_id
        WHERE post_bookmarks.user_id = ?
          AND posts.status = 'published'
        ORDER BY datetime(post_bookmarks.created_at) DESC
        LIMIT 12
      `,
    )
    .all(user.id)
    .map((row) => ({
      ...serializePost(row),
      bookmarkedAt: row.bookmarked_at,
    }));
  const comments = selectCommentRows("post_comments.user_id = ? AND post_comments.status = 'published'", [user.id])
    .reverse()
    .slice(0, 12)
    .map(serializeComment);
  const notifications = selectNotificationRows(user.id).map(serializeNotification);
  const unreadNotificationCount = getUnreadNotificationCount(user.id);

  res.json({
    user: {
      username: user.username,
      displayName: user.display_name || user.username,
      email: user.email || "",
      provider: user.provider || "local",
      ...roleFlags(user),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
    stats: {
      postCount: Number(stats.postCount) || 0,
      commentCount: Number(ownCommentCount.count) || 0,
      voteCount: Number(stats.voteCount) || 0,
      viewCount: Number(stats.viewCount) || 0,
    },
    recentPosts,
    likedPosts,
    bookmarkedPosts,
    comments,
    notifications,
    unreadNotificationCount,
  });
});

app.get("/api/me/notifications", requireMember, (req, res) => {
  const notifications = selectNotificationRows(req.user.id).map(serializeNotification);
  res.json({
    unreadCount: getUnreadNotificationCount(req.user.id),
    notifications,
  });
});

app.get("/api/me/notifications/stream", requireMember, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const userId = req.user.id;
  if (!notificationStreams.has(userId)) notificationStreams.set(userId, new Set());
  notificationStreams.get(userId).add(res);

  res.write(`event: ready\n`);
  res.write(`data: ${JSON.stringify({ unreadCount: getUnreadNotificationCount(userId) })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: {}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    const clients = notificationStreams.get(userId);
    if (!clients) return;
    clients.delete(res);
    if (!clients.size) notificationStreams.delete(userId);
  });
});

app.patch("/api/me/notifications/read", requireMember, (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Number.isFinite) : [];
  if (ids.length) {
    const placeholders = ids.map(() => "?").join(", ");
    db.prepare(
      `
        UPDATE notifications
        SET read_at = COALESCE(read_at, datetime('now'))
        WHERE recipient_id = ?
          AND id IN (${placeholders})
      `,
    ).run(req.user.id, ...ids);
  } else {
    db.prepare(
      `
        UPDATE notifications
        SET read_at = COALESCE(read_at, datetime('now'))
        WHERE recipient_id = ?
      `,
    ).run(req.user.id);
  }

  res.json({ ok: true });
});

app.delete("/api/me/notifications", requireMember, (req, res) => {
  db.prepare("DELETE FROM notifications WHERE recipient_id = ?").run(req.user.id);
  res.json({ ok: true, unreadCount: 0 });
});

app.delete("/api/me/notifications/:id", requireMember, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "알림 ID가 올바르지 않습니다." });
  db.prepare("DELETE FROM notifications WHERE recipient_id = ? AND id = ?").run(req.user.id, id);
  res.json({ ok: true, unreadCount: getUnreadNotificationCount(req.user.id) });
});

app.get("/api/coupon/requests", requireMember, (req, res) => {
  const rows = db.prepare(
    `
      SELECT id, uid, coupon_code, status, message, created_at
      FROM coupon_requests
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT 10
    `,
  ).all(req.user.id);

  const codes = db.prepare(
    `
      SELECT id, code, label, active, status, disabled_reason, last_result_status, last_result_message, status_updated_at, sort_order, created_at
      FROM coupon_codes
      WHERE active = 1
      ORDER BY sort_order ASC, id ASC
    `,
  ).all();
  res.json({
    requests: rows.map(serializeCouponRequest),
    codes: codes.map(serializeCouponCode),
    couponUid: req.user.coupon_uid || "",
    configured: Boolean(normalizeCouponRedeemUrl(couponRedeemUrl)),
  });
});

app.get("/api/coupon/codes", requireMember, (req, res) => {
  const rows = db.prepare(
    `
      SELECT id, code, label, active, status, disabled_reason, last_result_status, last_result_message, status_updated_at, sort_order, created_at
      FROM coupon_codes
      WHERE active = 1
      ORDER BY sort_order ASC, id ASC
    `,
  ).all();
  res.json({ codes: rows.map(serializeCouponCode) });
});

app.post("/api/coupon/codes", requireMember, (req, res) => {
  if (checkRateLimit(req, res, `coupon:codes:${req.user.id}`, 5, couponRateWindowMs)) return;
  const rawText = String(req.body?.codes || "");
  const rows = rawText
    .split(/[\s,]+/)
    .map((line) => sanitizeCouponInput(line, 80).toUpperCase())
    .filter((code) => /^[A-Z0-9_-]{3,80}$/.test(code));
  const uniqueCodes = [...new Set(rows)].slice(0, roleFlags(req.user).canManageContent ? 100 : 20);
  if (!uniqueCodes.length) {
    return res.status(400).json({ error: "저장할 쿠폰 코드를 입력해주세요." });
  }

  const insert = db.transaction((codes) => {
    let added = 0;
    const maxOrder = Number(db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS value FROM coupon_codes").get()?.value) || 0;
    const findExisting = db.prepare("SELECT id, active FROM coupon_codes WHERE code = ?");
    const insertCode = db.prepare(
      `
        INSERT INTO coupon_codes (code, label, active, status, sort_order, created_by)
        VALUES (?, '', 1, 'active', ?, ?)
      `,
    );
    const reactivateCode = db.prepare(
      `
        UPDATE coupon_codes
        SET active = 1,
            status = 'active',
            disabled_reason = NULL,
            last_result_status = NULL,
            last_result_message = NULL,
            status_updated_at = datetime('now'),
            sort_order = ?,
            created_by = ?,
            updated_at = datetime('now')
        WHERE code = ? AND active = 0
      `,
    );
    codes.forEach((code, index) => {
      const nextOrder = maxOrder + index + 1;
      const existing = findExisting.get(code);
      if (!existing) {
        const result = insertCode.run(code, nextOrder, req.user.id);
        added += result.changes;
        return;
      }
      if (!existing.active) {
        const result = reactivateCode.run(nextOrder, req.user.id, code);
        added += result.changes;
      }
    });
    return added;
  });

  const added = insert(uniqueCodes);
  createAuditLog({
    actorId: req.user.id,
    action: "coupon.codes.add",
    targetType: "coupon",
    targetId: uniqueCodes.join(","),
    details: { added, submitted: uniqueCodes.length, codes: uniqueCodes },
  });
  res.status(201).json({ ok: true, added });
});

app.delete("/api/coupon/codes/:id", requireContentManager, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "쿠폰 ID가 올바르지 않습니다." });
  const row = db.prepare("SELECT code FROM coupon_codes WHERE id = ?").get(id);
  db.prepare(
    `
      UPDATE coupon_codes
      SET active = 0,
          status = 'inactive',
          disabled_reason = '관리자 삭제',
          status_updated_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `,
  ).run(id);
  createAuditLog({
    actorId: req.user.id,
    action: "coupon.codes.delete",
    targetType: "coupon",
    targetId: row?.code || id,
    details: { id, code: row?.code || "" },
  });
  res.json({ ok: true });
});

app.post("/api/coupon/send-all", requireMember, async (req, res) => {
  if (checkRateLimit(req, res, `coupon:bulk:${req.user.id}`, 3, couponRateWindowMs)) return;

  const uid = sanitizeCouponInput(req.body?.uid, 40);
  if (!/^[A-Z0-9_-]{3,80}$/i.test(uid)) {
    return res.status(400).json({ error: "회원번호는 영문, 숫자, _, - 조합으로 3자 이상 입력해주세요." });
  }
  saveUserCouponUid(req.user.id, uid);

  const codes = db.prepare(
    `
      SELECT code
      FROM coupon_codes
      WHERE active = 1
      ORDER BY sort_order ASC, id ASC
      LIMIT 100
    `,
  ).all().map((row) => row.code);

  if (!codes.length) {
    return res.status(400).json({ error: "저장된 쿠폰 코드가 없습니다." });
  }

  const requests = [];
  for (const couponCode of codes) {
    let result;
    try {
      result = await sendCouponToGame({ uid, couponCode });
    } catch (error) {
      result = {
        status: "failed",
        message: "쿠폰 API 연결 중 오류가 발생했습니다.",
        response: { error: error.message },
      };
    }
    recordCouponCodeResult(couponCode, result);
    if (isExpiredCouponResult(result) && deactivateExpiredCoupon(couponCode, req.user.id, result)) {
      result = {
        ...result,
        status: "expired",
        message: "\uC720\uD6A8\uAE30\uAC04\uC774 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uCFE0\uD3F0\uBD81\uC5D0\uC11C\uB294 \uC228\uAE30\uACE0 DB \uAE30\uB85D\uC740 \uBCF4\uAD00\uD569\uB2C8\uB2E4.",
      };
      recordCouponCodeResult(couponCode, result);
    }
    requests.push(insertCouponRequest({ userId: req.user.id, uid, couponCode, result }));
  }

  res.json({
    ok: true,
    sent: requests.filter((item) => item.status === "sent").length,
    claimed: requests.filter((item) => item.status === "claimed").length,
    expired: requests.filter((item) => item.status === "expired").length,
    limitExceeded: requests.filter((item) => item.status === "limit_exceeded").length,
    failed: requests.filter((item) => item.status === "failed").length,
    pending: requests.filter((item) => item.status === "pending").length,
    requests,
    configured: Boolean(normalizeCouponRedeemUrl(couponRedeemUrl)),
  });
});

app.post("/api/coupon/send", requireMember, async (req, res) => {
  if (checkRateLimit(req, res, `coupon:${req.user.id}`, 10, couponRateWindowMs)) return;

  const uid = sanitizeCouponInput(req.body?.uid, 40);
  const couponCode = sanitizeCouponInput(req.body?.couponCode, 80).toUpperCase();
  if (!/^[A-Z0-9_-]{3,80}$/i.test(uid)) {
    return res.status(400).json({ error: "UID는 영문, 숫자, _, - 조합으로 3자 이상 입력해주세요." });
  }
  if (!/^[A-Z0-9_-]{3,80}$/.test(couponCode)) {
    return res.status(400).json({ error: "쿠폰 코드는 영문, 숫자, _, - 조합으로 3자 이상 입력해주세요." });
  }

  saveUserCouponUid(req.user.id, uid);

  let result;
  try {
    result = await sendCouponToGame({ uid, couponCode });
  } catch (error) {
    result = {
      status: "failed",
      message: "쿠폰 API 연결 중 오류가 발생했습니다.",
      response: { error: error.message },
    };
  }

  recordCouponCodeResult(couponCode, result);
  if (isExpiredCouponResult(result) && deactivateExpiredCoupon(couponCode, req.user.id, result)) {
    result = {
      ...result,
      status: "expired",
      message: "\uC720\uD6A8\uAE30\uAC04\uC774 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uCFE0\uD3F0\uBD81\uC5D0\uC11C\uB294 \uC228\uAE30\uACE0 DB \uAE30\uB85D\uC740 \uBCF4\uAD00\uD569\uB2C8\uB2E4.",
    };
    recordCouponCodeResult(couponCode, result);
  }

  const request = insertCouponRequest({ userId: req.user.id, uid, couponCode, result });

  res.status(result.status === "failed" ? 502 : 200).json({
    request,
    configured: Boolean(normalizeCouponRedeemUrl(couponRedeemUrl)),
  });
});

app.get("/api/posts", requireContentAccess, (req, res) => {
  const query = String(req.query.q || "").trim().toLowerCase().slice(0, 80);
  const category = String(req.query.category || "").trim().slice(0, 30);
  let posts = selectPostRows().map((row) => withUserVoteState(serializePost(row), req.user.id));
  if (category) {
    posts = posts.filter((post) => normalizeBoardName(post.category) === normalizeBoardName(category));
  }
  if (query) {
    const tokens = query.split(/\s+/).filter(Boolean).slice(0, 6);
    posts = posts.filter((post) => {
      const haystack = [
        post.title,
        post.game,
        post.summary,
        post.body,
        post.category,
        post.author,
        post.authorUsername,
        ...(Array.isArray(post.tags) ? post.tags : []),
      ].join(" ").toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }
  res.json(posts);
});

app.post("/api/posts", requireContentAccess, requirePermission("canWritePosts", "게시글 작성 권한이 없습니다."), requireMediaUploadPermission, maybeUploadPostMedia, (req, res) => {
  const title = String(req.body?.title || "").trim();
  const category = String(req.body?.category || "").trim();
  const game = String(req.body?.game || "세븐나이츠 리버스").trim() || "세븐나이츠 리버스";
  const summary = String(req.body?.summary || "").trim();
  const body = String(req.body?.body || "").trim();
  const attachment = String(req.body?.attachment || "").trim();
  const tags = normalizeTagsInput(req.body?.tags);
  const isMultipart = Boolean(req.files);
  const media = isMultipart
    ? null
    : normalizePostMedia(req.body?.media && typeof req.body.media === "object" ? req.body.media : {});

  if (isInternalNoticeCategory(category) && !canManageNoticePosts(req.user)) {
    cleanupUploadedFiles(req.files || {});
    return res.status(403).json({ error: "\uacf5\uc9c0\uc0ac\ud56d\uc740 \uad00\ub9ac\uc790\ub9cc \uc791\uc131\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4." });
  }

  if (!title || title.length > 70) {
    return res.status(400).json({ error: "제목은 1~70자로 입력해주세요." });
  }
  if (!category) {
    return res.status(400).json({ error: "게시판을 선택해주세요." });
  }
  if (!summary || summary.length > 220) {
    return res.status(400).json({ error: "요약은 1~220자로 입력해주세요." });
  }
  if (category.length > 30 || game.length > 40 || body.length > 20000 || attachment.length > 120) {
    return res.status(400).json({ error: "입력값 길이가 허용 범위를 넘었습니다." });
  }

  const id = crypto.randomUUID();
  let postMedia;
  try {
    postMedia = isMultipart ? buildUploadedPostMedia(id, req.body || {}, req.files || {}) : media;
    if (!hasPermission(req.user, "canUploadMedia") && postMediaHasPayload(postMedia)) {
      cleanupUploadedFiles(req.files || {});
      return res.status(403).json({ error: "미디어 업로드 권한이 없습니다." });
    }
    if (!isMultipart) postMedia.videoFile = savePostVideoFile(id, postMedia.videoFile);
  } catch (err) {
    cleanupUploadedFiles(req.files || {});
    if (err.status === 400) {
      const message = err.message === "image_too_large"
        ? "이미지는 8MB 이하로 업로드해주세요."
        : err.message === "video_too_large"
          ? "동영상은 500MB 이하로 업로드해주세요."
          : "업로드 파일 형식이 올바르지 않습니다.";
      return res.status(400).json({ error: message });
    }
    throw err;
  }

  db.prepare(
    `
      INSERT INTO posts (
        id, author_id, category, game, title, summary, body,
        tags_json, attachment, media_json, votes, views, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'published')
    `,
  ).run(id, req.user.id, category, game, title, summary, body, JSON.stringify(tags), attachment, JSON.stringify(postMedia));

  createMentionNotifications({
    actor: req.user,
    postId: id,
    targetType: "post",
    sourceText: [title, summary, body, tags.join(" ")].join("\n"),
  });

  const post = selectPostRows("posts.id = ?", [id])[0];
  res.status(201).json(withUserVoteState(serializePost(post), req.user.id));
});

app.get("/api/posts/:id", requireContentAccess, (req, res) => {
  const id = String(req.params.id || "");
  db.prepare("UPDATE posts SET views = views + 1 WHERE id = ? AND status = 'published'").run(id);
  const post = selectPostRows("posts.id = ? AND posts.status = 'published'", [id])[0];
  if (!post) {
    return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  }

  const posts = selectPostRows().map((row) => withUserVoteState(serializePost(row), req.user.id));
  const index = posts.findIndex((item) => item.id === id);
  res.json({
    post: {
      ...withUserVoteState(serializePost(post), req.user.id),
      canEdit: canManagePost(req.user, post),
    },
    posts,
    voted: Boolean(db.prepare("SELECT 1 FROM post_votes WHERE post_id = ? AND user_id = ?").get(id, req.user.id)),
    prevPost: index >= 0 ? posts[index - 1] || null : null,
    nextPost: index >= 0 ? posts[index + 1] || null : null,
  });
});

app.patch("/api/posts/:id", requireContentAccess, requireMediaUploadPermission, maybeUploadPostMedia, (req, res) => {
  const id = String(req.params.id || "");
  const post = db.prepare("SELECT * FROM posts WHERE id = ? AND status = 'published'").get(id);
  if (!post) {
    return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  }
  if (!canManagePost(req.user, post)) {
    return res.status(403).json({ error: "게시글 수정 권한이 없습니다." });
  }

  const title = String(req.body?.title || "").trim();
  const category = String(req.body?.category || "").trim();
  const game = String(req.body?.game || "세븐나이츠 리버스").trim() || "세븐나이츠 리버스";
  const summary = String(req.body?.summary || "").trim();
  const body = String(req.body?.body || "").trim();
  const tags = normalizeTagsInput(req.body?.tags);
  const isMultipart = Boolean(req.files);

  if (!title || title.length > 70) {
    return res.status(400).json({ error: "제목은 1~70자로 입력해주세요." });
  }
  if (!category) {
    return res.status(400).json({ error: "게시판을 선택해주세요." });
  }
  if (!summary || summary.length > 220) {
    return res.status(400).json({ error: "요약은 1~220자로 입력해주세요." });
  }
  if (category.length > 30 || game.length > 40 || body.length > 20000) {
    return res.status(400).json({ error: "입력값 길이가 허용 범위를 넘었습니다." });
  }

  if ((isInternalNoticeCategory(category) || isInternalNoticeCategory(post.category)) && !canManageNoticePosts(req.user)) {
    cleanupUploadedFiles(req.files || {});
    return res.status(403).json({ error: "\uacf5\uc9c0\uc0ac\ud56d\uc740 \uad00\ub9ac\uc790\ub9cc \uc218\uc815\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4." });
  }

  const existingMedia = safeJsonParse(post.media_json, {});
  let media = existingMedia;
  try {
    if (isMultipart) {
      const uploadedMedia = buildUploadedPostMedia(id, req.body || {}, req.files || {});
      const existingImages = Array.isArray(existingMedia.images) ? existingMedia.images : [];
      const existingVideos = Array.isArray(existingMedia.videos)
        ? existingMedia.videos
        : existingMedia.videoFile ? [existingMedia.videoFile] : [];
      const nextYoutube = String(req.body?.youtube || "").trim();
      const nextYoutubeEmbed = String(req.body?.youtubeEmbed || "").trim();
      media = {
        ...existingMedia,
        images: [...existingImages, ...(uploadedMedia.images || [])].slice(0, 6),
        videos: [...existingVideos, ...(uploadedMedia.videos || [])].slice(0, 3),
        videoFile: [...existingVideos, ...(uploadedMedia.videos || [])][0] || null,
        youtube: nextYoutube || existingMedia.youtube || "",
        youtubeEmbed: nextYoutubeEmbed || existingMedia.youtubeEmbed || "",
      };
    } else if (req.body?.media && typeof req.body.media === "object") {
      media = normalizePostMedia(req.body.media);
      if (!hasPermission(req.user, "canUploadMedia") && postMediaHasPayload(media)) {
        return res.status(403).json({ error: "미디어 업로드 권한이 없습니다." });
      }
      media.videoFile = savePostVideoFile(id, media.videoFile);
    }
  } catch (err) {
    cleanupUploadedFiles(req.files || {});
    if (err.status === 400) {
      const message = err.message === "image_too_large"
        ? "이미지는 8MB 이하로 업로드해주세요."
        : err.message === "video_too_large"
          ? "동영상은 500MB 이하로 업로드해주세요."
          : "업로드 파일 형식이 올바르지 않습니다.";
      return res.status(400).json({ error: message });
    }
    throw err;
  }

  db.prepare(
    `
      UPDATE posts
      SET category = ?,
          game = ?,
          title = ?,
          summary = ?,
          body = ?,
          tags_json = ?,
          media_json = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `,
  ).run(category, game, title, summary, body, JSON.stringify(tags), JSON.stringify(media), id);

  const updatedPost = selectPostRows("posts.id = ?", [id])[0];
  res.json({
    post: {
      ...withUserVoteState(serializePost(updatedPost), req.user.id),
      canEdit: true,
    },
  });
});

app.delete("/api/posts/:id", requireContentAccess, (req, res) => {
  const id = String(req.params.id || "");
  const post = db.prepare("SELECT * FROM posts WHERE id = ? AND status = 'published'").get(id);
  if (!post) {
    return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  }
  if (!canManagePost(req.user, post)) {
    return res.status(403).json({ error: "게시글 삭제 권한이 없습니다." });
  }

  if (isInternalNoticeCategory(post.category) && !canManageNoticePosts(req.user)) {
    return res.status(403).json({ error: "\uacf5\uc9c0\uc0ac\ud56d\uc740 \uad00\ub9ac\uc790\ub9cc \uc0ad\uc81c\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4." });
  }

  db.prepare("UPDATE posts SET status = 'deleted', updated_at = datetime('now') WHERE id = ?").run(id);
  res.json({ ok: true });
});

app.post("/api/posts/:id/vote", requireContentAccess, (req, res) => {
  if (!hasPermission(req.user, "canVote")) {
    return res.status(403).json({ error: "추천 권한이 없습니다." });
  }

  const id = String(req.params.id || "");
  const post = db.prepare("SELECT id, author_id, title FROM posts WHERE id = ? AND status = 'published'").get(id);
  if (!post) {
    return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  }

  const toggleVote = db.transaction(() => {
    const existing = db.prepare("SELECT id FROM post_votes WHERE post_id = ? AND user_id = ?").get(id, req.user.id);
    if (existing) {
      db.prepare("DELETE FROM post_votes WHERE id = ?").run(existing.id);
      db.prepare("UPDATE posts SET votes = MAX(votes - 1, 0), updated_at = datetime('now') WHERE id = ?").run(id);
      return false;
    }

    db.prepare("INSERT INTO post_votes (post_id, user_id) VALUES (?, ?)").run(id, req.user.id);
    db.prepare("UPDATE posts SET votes = votes + 1, updated_at = datetime('now') WHERE id = ?").run(id);
    return true;
  });

  const voted = toggleVote();
  if (voted) {
    createNotification({
      recipientId: post.author_id,
      actorId: req.user.id,
      type: "post_vote",
      targetType: "post",
      targetId: id,
      postId: id,
      message: `${req.user.display_name || req.user.username}님이 내 게시글을 추천했습니다.`,
    });
  }
  const updatedPost = selectPostRows("posts.id = ?", [id])[0];
  res.json({ voted, post: withUserVoteState(serializePost(updatedPost), req.user.id) });
});

app.post("/api/posts/:id/bookmark", requireContentAccess, (req, res) => {
  const id = String(req.params.id || "");
  const post = db.prepare("SELECT id, title FROM posts WHERE id = ? AND status = 'published'").get(id);
  if (!post) {
    return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  }

  const toggleBookmark = db.transaction(() => {
    const existing = db.prepare("SELECT id FROM post_bookmarks WHERE post_id = ? AND user_id = ?").get(id, req.user.id);
    if (existing) {
      db.prepare("DELETE FROM post_bookmarks WHERE id = ?").run(existing.id);
      return false;
    }
    db.prepare("INSERT INTO post_bookmarks (post_id, user_id) VALUES (?, ?)").run(id, req.user.id);
    return true;
  });

  const bookmarked = toggleBookmark();
  res.json({ ok: true, bookmarked });
});

app.post("/api/posts/:id/report", requireContentAccess, (req, res) => {
  const id = String(req.params.id || "");
  const reason = String(req.body?.reason || "").trim().slice(0, 300);
  const post = db.prepare("SELECT id, title, author_id FROM posts WHERE id = ? AND status = 'published'").get(id);
  if (!post) {
    return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  }
  if (!reason) {
    return res.status(400).json({ error: "신고 사유를 입력해주세요." });
  }

  try {
    db.prepare(
      `
        INSERT INTO post_reports (post_id, reporter_id, reason)
        VALUES (?, ?, ?)
      `,
    ).run(id, req.user.id, reason);
    createAuditLog({
      actorId: req.user.id,
      action: "post.report",
      targetType: "post",
      targetId: id,
      details: { title: post.title, reason },
    });
  } catch (error) {
    if (String(error?.message || "").includes("UNIQUE")) {
      return res.status(409).json({ error: "이미 신고한 게시글입니다." });
    }
    throw error;
  }

  const reportCount = db.prepare("SELECT COUNT(*) AS count FROM post_reports WHERE post_id = ? AND status = 'open'").get(id)?.count || 0;
  if (reportCount >= 3) {
    db.prepare("UPDATE posts SET status = 'hidden', updated_at = datetime('now') WHERE id = ?").run(id);
    createAuditLog({
      actorId: null,
      action: "post.auto_hide",
      targetType: "post",
      targetId: id,
      details: { title: post.title, reportCount },
    });
  }

  res.json({ ok: true, reported: true, reportCount });
});

app.get("/api/posts/:id/comments", requireContentAccess, (req, res) => {
  const id = String(req.params.id || "");
  const post = db.prepare("SELECT id FROM posts WHERE id = ? AND status = 'published'").get(id);
  if (!post) {
    return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  }

  res.json(
    selectCommentRows("post_comments.post_id = ? AND post_comments.status = 'published'", [id])
      .map((row) => withUserCommentVoteState(serializeComment(row), req.user.id)),
  );
});

app.post("/api/posts/:id/comments", requireContentAccess, (req, res) => {
  if (!hasPermission(req.user, "canComment")) {
    return res.status(403).json({ error: "댓글 작성 권한이 없습니다." });
  }

  const id = String(req.params.id || "");
  const content = String(req.body?.content || "").trim();
  const parentId = req.body?.parentId ? Number(req.body.parentId) : null;
  const post = db.prepare("SELECT id, author_id, title FROM posts WHERE id = ? AND status = 'published'").get(id);
  if (!post) {
    return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  }
  if (content.length < 1 || content.length > 1000) {
    return res.status(400).json({ error: "댓글은 1~1000자로 입력해주세요." });
  }

  let parentComment = null;
  if (parentId) {
    parentComment = db.prepare("SELECT id, user_id FROM post_comments WHERE id = ? AND post_id = ? AND status = 'published'").get(parentId, id);
    if (!parentComment) {
      return res.status(400).json({ error: "답글을 달 댓글을 찾을 수 없습니다." });
    }
  }

  const createComment = db.transaction(() => {
    const result = db
      .prepare("INSERT INTO post_comments (post_id, user_id, parent_comment_id, content) VALUES (?, ?, ?, ?)")
      .run(id, req.user.id, parentId || null, content);
    db.prepare("UPDATE posts SET comments = comments + 1, updated_at = datetime('now') WHERE id = ?").run(id);
    return result.lastInsertRowid;
  });

  const commentId = createComment();
  createNotification({
    recipientId: post.author_id,
    actorId: req.user.id,
    type: parentId ? "comment_reply" : "post_comment",
    targetType: parentId ? "comment" : "post",
    targetId: parentId || id,
    postId: id,
    commentId,
    message: `${req.user.display_name || req.user.username}님이 내 게시글에 댓글을 남겼습니다.`,
  });
  if (parentComment?.user_id && parentComment.user_id !== post.author_id) {
    createNotification({
      recipientId: parentComment.user_id,
      actorId: req.user.id,
      type: "comment_reply",
      targetType: "comment",
      targetId: parentId,
      postId: id,
      commentId,
      message: `${req.user.display_name || req.user.username}님이 댓글에 답글을 남겼습니다.`,
    });
  }
  createMentionNotifications({
    actor: req.user,
    postId: id,
    commentId,
    targetType: "comment",
    sourceText: content,
  });
  const comment = selectCommentRows("post_comments.id = ?", [commentId])[0];
  const updatedPost = selectPostRows("posts.id = ?", [id])[0];
  res.status(201).json({
    comment: withUserCommentVoteState(serializeComment(comment), req.user.id),
    post: serializePost(updatedPost),
  });
});

app.post("/api/comments/:id/vote", requireContentAccess, (req, res) => {
  if (!hasPermission(req.user, "canVote")) {
    return res.status(403).json({ error: "추천 권한이 없습니다." });
  }

  const id = Number(req.params.id);
  const comment = db
    .prepare(
      `
        SELECT post_comments.*, posts.title AS post_title
        FROM post_comments
        JOIN posts ON posts.id = post_comments.post_id
        WHERE post_comments.id = ?
          AND post_comments.status = 'published'
          AND posts.status = 'published'
      `,
    )
    .get(id);
  if (!comment) {
    return res.status(404).json({ error: "댓글을 찾을 수 없습니다." });
  }

  const toggleVote = db.transaction(() => {
    const existing = db.prepare("SELECT id FROM comment_votes WHERE comment_id = ? AND user_id = ?").get(id, req.user.id);
    if (existing) {
      db.prepare("DELETE FROM comment_votes WHERE id = ?").run(existing.id);
      db.prepare("UPDATE post_comments SET votes = MAX(votes - 1, 0), updated_at = datetime('now') WHERE id = ?").run(id);
      return false;
    }

    db.prepare("INSERT INTO comment_votes (comment_id, user_id) VALUES (?, ?)").run(id, req.user.id);
    db.prepare("UPDATE post_comments SET votes = votes + 1, updated_at = datetime('now') WHERE id = ?").run(id);
    return true;
  });

  const voted = toggleVote();
  if (voted) {
    createNotification({
      recipientId: comment.user_id,
      actorId: req.user.id,
      type: "comment_vote",
      targetType: "comment",
      targetId: id,
      postId: comment.post_id,
      commentId: id,
      message: `${req.user.display_name || req.user.username}님이 내 댓글을 추천했습니다.`,
    });
  }

  const updatedComment = selectCommentRows("post_comments.id = ?", [id])[0];
  res.json({ voted, comment: withUserCommentVoteState(serializeComment(updatedComment), req.user.id) });
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
  const tables = [
    "users",
    "posts",
    "post_media",
    "post_votes",
    "post_bookmarks",
    "post_reports",
    "post_comments",
    "comment_votes",
    "notifications",
    "guild_war_sheets",
    "coupon_codes",
    "coupon_requests",
    "app_settings",
    "audit_logs",
  ];
  const counts = Object.fromEntries(
    tables.map((table) => [table, db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count]),
  );
  const recentAudit = db.prepare(
    `
      SELECT
        audit_logs.id,
        audit_logs.action,
        audit_logs.target_type,
        audit_logs.target_id,
        audit_logs.details_json,
        audit_logs.created_at,
        users.display_name AS actor_name,
        users.username AS actor_username
      FROM audit_logs
      LEFT JOIN users ON users.id = audit_logs.actor_id
      ORDER BY datetime(audit_logs.created_at) DESC
      LIMIT 12
    `,
  ).all();
  res.json({ ok: true, counts, recentAudit });
});

app.get("/api/guild-war/season", (req, res) => {
  res.json({ ok: true, settings: getGuildSeasonSettings() });
});

app.get("/api/guild-war/sheets", (req, res) => {
  res.json({ ok: true, state: readGuildWarSheetsState() });
});

app.put("/api/admin/guild-war/sheets", requireGuildManager, (req, res) => {
  const state = req.body?.state;
  if (!state || typeof state !== "object") {
    return res.status(400).json({ error: "저장할 족보 데이터가 없습니다." });
  }
  saveGuildWarSheetsState(state, req.user?.id);
  res.json({ ok: true, state: readGuildWarSheetsState() });
});

app.get("/api/important-notice", (req, res) => {
  const settings = getImportantNoticeSettings();
  res.json({ ok: true, notice: settings });
});

app.get("/api/main-hero", (req, res) => {
  res.json({ ok: true, hero: getMainHeroSettings() });
});

app.get("/api/site-appearance", (req, res) => {
  res.json({ ok: true, appearance: getSiteAppearanceSettings() });
});

app.get("/api/board-tags", (req, res) => {
  res.json({ ok: true, settings: getBoardTagSettings() });
});

app.patch("/api/admin/guild-war/season", requireGuildManager, (req, res) => {
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

app.patch("/api/admin/important-notice", requireContentManager, (req, res) => {
  const settings = normalizeImportantNoticeSettings(req.body || {});
  writeSetting("importantNotice", settings);
  res.json({ ok: true, notice: settings });
});

app.patch("/api/admin/main-hero", requireContentManager, (req, res) => {
  const settings = normalizeMainHeroSettings(req.body || {});
  writeSetting("mainHero", settings);
  res.json({ ok: true, hero: settings });
});

app.patch("/api/admin/site-appearance", requireAdmin, (req, res) => {
  const settings = normalizeSiteAppearanceSettings(req.body || {});
  writeSetting("siteAppearance", settings);
  res.json({ ok: true, appearance: settings });
});

app.patch("/api/admin/board-tags", requireAdmin, (req, res) => {
  const settings = normalizeBoardTagSettings(req.body || {});
  writeSetting("boardTags", settings);
  createAuditLog({
    actorId: req.user?.id,
    action: "board_tags.update",
    targetType: "app_settings",
    targetId: "boardTags",
    details: { count: settings.tags.length },
  });
  res.json({ ok: true, settings });
});

app.post("/api/admin/important-notice/image", requireContentManager, (req, res) => {
  uploadNoticeImage.array("images", 6)(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "이미지는 8MB 이하로 업로드해주세요." });
      }
      return res.status(400).json({ error: "이미지 파일만 업로드할 수 있습니다." });
    }
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ error: "업로드할 이미지가 없습니다." });
    }
    try {
      files.forEach((file) => assertUploadedFile(file, "image"));
    } catch {
      cleanupUploadedFiles({ images: files });
      return res.status(400).json({ error: "업로드 이미지 형식이 올바르지 않습니다." });
    }
    res.status(201).json({
      ok: true,
      imageUrls: files.map((file) => `/uploads/notices/${file.filename}`),
      fileNames: files.map((file) => file.originalname),
    });
  });
});

app.post("/api/admin/main-hero/image", requireContentManager, (req, res) => {
  uploadHeroImage.array("images", 10)(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "이미지는 25MB 이하로 업로드해주세요." });
      }
      return res.status(400).json({ error: "이미지 파일만 업로드할 수 있습니다." });
    }
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ error: "업로드할 이미지가 없습니다." });
    }
    try {
      files.forEach((file) => assertUploadedFile(file, "image"));
    } catch {
      cleanupUploadedFiles({ images: files });
      return res.status(400).json({ error: "업로드 이미지 형식이 올바르지 않습니다." });
    }
    res.status(201).json({
      ok: true,
      imageUrls: files.map((file) => `/uploads/hero/${file.filename}`),
      fileNames: files.map((file) => file.originalname),
    });
  });
});

app.get("/api/admin/dashboard", requireAdmin, (req, res) => {
  const counts = {
    users: db.prepare("SELECT COUNT(*) AS count FROM users").get().count,
    admins: db.prepare("SELECT COUNT(*) AS count FROM users WHERE role IN ('superadmin', 'admin')").get().count,
    verified: db.prepare("SELECT COUNT(*) AS count FROM users WHERE role IN ('elite', 'verified')").get().count,
    posts: db.prepare("SELECT COUNT(*) AS count FROM posts").get().count,
    publishedPosts: db.prepare("SELECT COUNT(*) AS count FROM posts WHERE status = 'published'").get().count,
    guildSheets: db.prepare("SELECT COUNT(*) AS count FROM guild_war_sheets").get().count,
  };

  const dailyRows = db
    .prepare(
      `
        WITH days(day) AS (
          SELECT date('now', '+9 hours', '-6 days')
          UNION ALL
          SELECT date(day, '+1 day') FROM days WHERE day < date('now', '+9 hours')
        )
        SELECT
          day,
          (SELECT COUNT(*) FROM users WHERE date(created_at, '+9 hours') = day) AS users,
          (SELECT COUNT(*) FROM posts WHERE date(created_at, '+9 hours') = day) AS posts
        FROM days
        ORDER BY day
      `,
    )
    .all();

  const recentUsers = db
    .prepare(
      `
        SELECT id, username, display_name, email, provider, role, permissions_json, created_at
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
    recentUsers: recentUsers.map((user) => ({ ...user, ...roleFlags(user) })),
    recentPosts: recentPosts.map(serializePost),
  });
});

app.get("/api/admin/users", requireUserManager, (req, res) => {
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
          users.permissions_json,
          users.created_at,
          COUNT(posts.id) AS post_count
        FROM users
        LEFT JOIN posts ON posts.author_id = users.id
        GROUP BY users.id
        ORDER BY datetime(users.created_at) DESC
      `,
    )
    .all();
  res.json(users.map((user) => ({ ...user, ...roleFlags(user) })));
});

app.patch("/api/admin/users/:id", requireUserManager, (req, res) => {
  const id = Number(req.params.id);
  const role = String(req.body?.role || "").trim();
  const displayName = String(req.body?.displayName || "").trim();
  const permissions = sanitizePermissions(req.body?.permissions);
  const allowedRoles = new Set(["blocked", "user", "elite", "admin", "superadmin"]);
  const targetUser = db.prepare("SELECT id, role FROM users WHERE id = ?").get(id);

  if (!allowedRoles.has(role)) {
    return res.status(400).json({ error: "권한 값이 올바르지 않습니다." });
  }
  if (!targetUser) {
    return res.status(404).json({ error: "회원을 찾을 수 없습니다." });
  }
  if (!roleFlags(req.user).isSuperAdmin && normalizeRole(targetUser.role) !== "user" && normalizeRole(targetUser.role) !== "elite") {
    return res.status(403).json({ error: "관리자 계정 변경은 최고관리자만 가능합니다." });
  }
  if (!roleFlags(req.user).isSuperAdmin && (normalizeRole(role) === "superadmin" || permissions.canAccessAdminDb || permissions.canManageUsers)) {
    return res.status(403).json({ error: "최고관리자 권한 설정은 최고관리자만 변경할 수 있습니다." });
  }
  if (normalizeRole(targetUser.role) === "superadmin" && normalizeRole(role) !== "superadmin") {
    const superadminCount = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'superadmin'").get().count;
    if (superadminCount <= 1) {
      return res.status(400).json({ error: "마지막 최고관리자는 강등할 수 없습니다." });
    }
  }
  if (displayName && [...displayName].length > 16) {
    return res.status(400).json({ error: "닉네임은 16자 이하로 입력해주세요." });
  }
  if (displayName && !isSafeDisplayText(displayName)) {
    return res.status(400).json({ error: "닉네임에는 HTML 특수 문자를 사용할 수 없습니다." });
  }

  db.prepare(
    `
      UPDATE users
      SET role = ?,
          permissions_json = ?,
          display_name = COALESCE(NULLIF(?, ''), display_name),
          updated_at = datetime('now')
      WHERE id = ?
    `,
  ).run(normalizeRole(role), JSON.stringify(permissions), displayName, id);

  const user = db.prepare("SELECT id, username, display_name, email, provider, role, permissions_json, created_at FROM users WHERE id = ?").get(id);
  if (!user) return res.status(404).json({ error: "회원을 찾을 수 없습니다." });
  res.json({ ...user, ...roleFlags(user) });
});

app.delete("/api/admin/users/:id", requireUserManager, (req, res) => {
  const id = Number(req.params.id);
  const actor = findUserByUsername(req.session.username);
  if (actor?.id === id) {
    return res.status(400).json({ error: "본인 계정은 삭제할 수 없습니다." });
  }
  const targetUser = db.prepare("SELECT id, role FROM users WHERE id = ?").get(id);
  if (!targetUser) return res.status(404).json({ error: "회원을 찾을 수 없습니다." });
  if (!roleFlags(req.user).isSuperAdmin && normalizeRole(targetUser.role) !== "user" && normalizeRole(targetUser.role) !== "elite") {
    return res.status(403).json({ error: "관리자 계정 삭제는 최고관리자만 가능합니다." });
  }
  if (normalizeRole(targetUser.role) === "superadmin") {
    const superadminCount = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'superadmin'").get().count;
    if (superadminCount <= 1) {
      return res.status(400).json({ error: "마지막 최고관리자는 삭제할 수 없습니다." });
    }
  }

  const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
  if (!result.changes) return res.status(404).json({ error: "회원을 찾을 수 없습니다." });
  res.json({ ok: true });
});

app.get("/api/admin/posts", requireContentManager, (req, res) => {
  res.json(selectPostRows("1 = 1").map(serializePost));
});

app.patch("/api/admin/posts/:id/quick", requireContentManager, (req, res) => {
  const id = String(req.params.id || "");
  const status = String(req.body?.status || "").trim();
  const allowedStatuses = new Set(["published", "hidden", "deleted"]);
  const hasStatus = Object.prototype.hasOwnProperty.call(req.body || {}, "status");
  const category = String(req.body?.category || "").trim();
  const orderAction = String(req.body?.orderAction || "").trim();
  if (hasStatus && !allowedStatuses.has(status)) {
    return res.status(400).json({ error: "상태 값이 올바르지 않습니다." });
  }
  if (category && category.length > 30) {
    return res.status(400).json({ error: "게시판 이름이 너무 깁니다." });
  }

  const updates = [];
  const params = [];
  if (hasStatus) {
    updates.push("status = ?");
    params.push(status);
  }
  if (category) {
    updates.push("category = ?");
    params.push(category);
  }
  if (orderAction === "top") {
    updates.push("sort_order = unixepoch('now')");
  } else if (orderAction === "reset") {
    updates.push("sort_order = 0");
  } else if (orderAction) {
    return res.status(400).json({ error: "정렬 명령이 올바르지 않습니다." });
  }
  if (!updates.length) {
    return res.status(400).json({ error: "변경할 내용이 없습니다." });
  }

  updates.push("updated_at = datetime('now')");
  params.push(id);
  const result = db.prepare(`UPDATE posts SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  if (!result.changes) return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  const post = selectPostRows("posts.id = ?", [id])[0];
  createAuditLog({
    actorId: req.user?.id,
    action: "post.quick_manage",
    targetType: "post",
    targetId: id,
    details: { status: hasStatus ? status : undefined, category, orderAction },
  });
  res.json(serializePost(post));
});

app.patch("/api/admin/posts/:id", requireContentManager, (req, res) => {
  const id = String(req.params.id || "");
  const status = String(req.body?.status || "").trim();
  const allowedStatuses = new Set(["published", "hidden", "deleted"]);
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ error: "상태 값이 올바르지 않습니다." });
  }

  const result = db.prepare("UPDATE posts SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  if (!result.changes) return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  const post = selectPostRows("posts.id = ?", [id])[0];
  createAuditLog({
    actorId: req.user?.id,
    action: "post.status",
    targetType: "post",
    targetId: id,
    details: { status },
  });
  res.json(serializePost(post));
});

app.delete("/api/admin/posts/:id", requireContentManager, (req, res) => {
  const id = String(req.params.id || "");
  const result = db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  if (!result.changes) return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
  res.json({ ok: true });
});

app.get("/api/site-notices", (req, res) => {
  const notices = selectPostRows("posts.status = 'published' AND posts.category = ?", [internalNoticeCategory])
    .map(serializePost);
  res.json(notices);
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
