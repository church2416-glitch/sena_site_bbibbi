import Database from "better-sqlite3";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const dataDir = path.join(__dirname, "data");
const dbPath = process.env.DB_PATH || path.join(dataDir, "bbibbi.sqlite");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initDb({ adminUser, adminPassword }) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      display_name TEXT,
      provider TEXT NOT NULL DEFAULT 'local',
      provider_id TEXT,
      email TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (provider, provider_id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      author_id INTEGER,
      category TEXT NOT NULL,
      game TEXT,
      title TEXT NOT NULL,
      summary TEXT,
      body TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      attachment TEXT,
      media_json TEXT NOT NULL DEFAULT '{}',
      comments INTEGER NOT NULL DEFAULT 0,
      votes INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS post_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      url TEXT NOT NULL,
      file_name TEXT,
      mime_type TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id TEXT NOT NULL,
      user_id INTEGER,
      parent_comment_id INTEGER,
      content TEXT NOT NULL,
      votes INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_comment_id) REFERENCES post_comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS comment_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (comment_id, user_id),
      FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_id INTEGER NOT NULL,
      actor_id INTEGER,
      type TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      post_id TEXT,
      comment_id INTEGER,
      message TEXT NOT NULL,
      read_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS guild_war_sheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sheet_type TEXT NOT NULL,
      title TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      author_id INTEGER,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_posts_category_created ON posts(category, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_media_post ON post_media(post_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_post_votes_user ON post_votes(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comment_votes_user ON comment_votes(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read_at, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_guild_sheets_type ON guild_war_sheets(sheet_type, updated_at DESC);
  `);

  migrateUsersTable();
  migratePostsTable();
  migrateCommentsTable();
  ensureAdminUser(adminUser, adminPassword);
}

function migrateUsersTable() {
  const columns = db.prepare("PRAGMA table_info(users)").all().map((column) => column.name);
  const addColumn = (name, definition) => {
    if (!columns.includes(name)) db.prepare(`ALTER TABLE users ADD COLUMN ${name} ${definition}`).run();
  };

  addColumn("provider", "TEXT NOT NULL DEFAULT 'local'");
  addColumn("provider_id", "TEXT");
  addColumn("email", "TEXT");
  addColumn("avatar_url", "TEXT");
}

function migratePostsTable() {
  const columns = db.prepare("PRAGMA table_info(posts)").all().map((column) => column.name);
  const addColumn = (name, definition) => {
    if (!columns.includes(name)) db.prepare(`ALTER TABLE posts ADD COLUMN ${name} ${definition}`).run();
  };

  addColumn("attachment", "TEXT");
  addColumn("media_json", "TEXT NOT NULL DEFAULT '{}'");
  addColumn("comments", "INTEGER NOT NULL DEFAULT 0");
}

function migrateCommentsTable() {
  const columns = db.prepare("PRAGMA table_info(post_comments)").all().map((column) => column.name);
  const addColumn = (name, definition) => {
    if (!columns.includes(name)) db.prepare(`ALTER TABLE post_comments ADD COLUMN ${name} ${definition}`).run();
  };

  addColumn("votes", "INTEGER NOT NULL DEFAULT 0");
  addColumn("parent_comment_id", "INTEGER");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) return false;
  const attempt = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), attempt);
}

export function ensureAdminUser(username, password) {
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    db.prepare(
      `
        UPDATE users
        SET role = CASE WHEN role = 'superadmin' THEN role ELSE 'superadmin' END,
            updated_at = datetime('now')
        WHERE id = ?
      `,
    ).run(existing.id);
    return;
  }

  db.prepare(
    `
      INSERT INTO users (username, password_hash, role, display_name)
      VALUES (?, ?, 'superadmin', ?)
    `,
  ).run(username, hashPassword(password), username);
}

export function findUserByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}

export function updateUserDisplayName(username, displayName) {
  db.prepare(
    `
      UPDATE users
      SET display_name = ?,
          updated_at = datetime('now')
      WHERE username = ?
    `,
  ).run(displayName, username);

  return findUserByUsername(username);
}

export function createLocalUser({ username, password, displayName, email }) {
  const result = db.prepare(
    `
      INSERT INTO users (username, password_hash, role, display_name, provider, provider_id, email)
      VALUES (?, ?, 'user', ?, 'local', NULL, ?)
    `,
  ).run(username, hashPassword(password), displayName || username, email || null);

  return db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
}

export function upsertOAuthUser({ provider, providerId, username, displayName, email, avatarUrl }) {
  const existing = db.prepare("SELECT * FROM users WHERE provider = ? AND provider_id = ?").get(provider, providerId);
  if (existing) {
    db.prepare(
      `
        UPDATE users
        SET username = ?,
            role = CASE WHEN role IN ('superadmin', 'admin') THEN role ELSE role END,
            display_name = COALESCE(NULLIF(display_name, ''), ?),
            email = ?,
            avatar_url = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `,
    ).run(username, displayName, email, avatarUrl, existing.id);
    return db.prepare("SELECT * FROM users WHERE id = ?").get(existing.id);
  }

  const result = db.prepare(
    `
      INSERT INTO users (username, password_hash, role, display_name, provider, provider_id, email, avatar_url)
      VALUES (?, NULL, 'user', ?, ?, ?, ?, ?)
    `,
  ).run(username, displayName, provider, providerId, email, avatarUrl);

  return db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
}
