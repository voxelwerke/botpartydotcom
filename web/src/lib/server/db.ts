import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { env } from "$env/dynamic/private";

export type Post = {
  id: number;
  created_at: string;
  edited_at: string;
  text: string;
};
export type PostListItem = Post & { comment_count: number };
export type Author = {
  id: number;
  name: string;
  key: string;
  uptime: number;
  created_at: string;
};
export type Comment = {
  id: number;
  post_id: number;
  author_id: number;
  author_name: string;
  text: string;
  created_at: string;
  edited_at: string;
};

const dataDir = env.DATA_DIR ?? path.join(process.cwd(), "data");
const databasePath = env.DATABASE_PATH ?? path.join(dataDir, "blog.db");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.exec(
  "CREATE TABLE IF NOT EXISTS posts (created_at TEXT NOT NULL, edited_at TEXT NOT NULL, text TEXT NOT NULL)",
);
db.exec(
  "CREATE TABLE IF NOT EXISTS author (name TEXT NOT NULL, key TEXT NOT NULL UNIQUE, uptime INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)",
);
db.exec(
  "CREATE TABLE IF NOT EXISTS comment (post_id INTEGER NOT NULL, author_id INTEGER NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL, edited_at TEXT NOT NULL)",
);

const columns = db.prepare("PRAGMA table_info(posts)").all() as {
  name: string;
}[];
if (!columns.some((column) => column.name === "edited_at")) {
  db.exec("ALTER TABLE posts ADD COLUMN edited_at TEXT NOT NULL DEFAULT ''");
}
const authorColumns = db.prepare("PRAGMA table_info(author)").all() as {
  name: string;
}[];
if (!authorColumns.some((column) => column.name === "uptime")) {
  db.exec("ALTER TABLE author ADD COLUMN uptime INTEGER NOT NULL DEFAULT 0");
}
if (!authorColumns.some((column) => column.name === "created_at")) {
  db.exec("ALTER TABLE author ADD COLUMN created_at TEXT NOT NULL DEFAULT ''");
}
const commentColumns = db.prepare("PRAGMA table_info(comment)").all() as {
  name: string;
}[];
if (!commentColumns.some((column) => column.name === "edited_at")) {
  db.exec("ALTER TABLE comment ADD COLUMN edited_at TEXT NOT NULL DEFAULT ''");
}
const commentForeignKeys = db
  .prepare("PRAGMA foreign_key_list(comment)")
  .all() as {
  table: string;
  from: string;
  to: string;
}[];
if (commentForeignKeys.length > 0) {
  const hasEditedAt = commentColumns.some(
    (column) => column.name === "edited_at",
  );
  const rebuildCommentTable = db.transaction(() => {
    db.exec(
      "CREATE TABLE comment_new (post_id INTEGER NOT NULL, author_id INTEGER NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL, edited_at TEXT NOT NULL)",
    );
    db.exec(
      `INSERT INTO comment_new (post_id, author_id, text, created_at, edited_at)
			 SELECT post_id, author_id, text, created_at, ${hasEditedAt ? "edited_at" : "created_at"}
			 FROM comment`,
    );
    db.exec("DROP TABLE comment");
    db.exec("ALTER TABLE comment_new RENAME TO comment");
  });
  rebuildCommentTable();
}

const listStmt = db.prepare(
  `SELECT
		rowid AS id,
		created_at,
		edited_at,
		text,
		(SELECT COUNT(*) FROM comment WHERE comment.post_id = posts.rowid) AS comment_count
	FROM posts
	ORDER BY rowid DESC`,
);
const getStmt = db.prepare(
  "SELECT rowid AS id, created_at, edited_at, text FROM posts WHERE rowid = ?",
);
const createStmt = db.prepare(
  "INSERT INTO posts (created_at, edited_at, text) VALUES (?, ?, ?)",
);
const updateStmt = db.prepare(
  "UPDATE posts SET text = ?, edited_at = ? WHERE rowid = ?",
);
const deleteStmt = db.prepare("DELETE FROM posts WHERE rowid = ?");
const getAuthorByKeyStmt = db.prepare(
  "SELECT rowid AS id, name, key, uptime, created_at FROM author WHERE key = ?",
);
const createAuthorStmt = db.prepare(
  "INSERT INTO author (name, key, uptime, created_at) VALUES (?, ?, ?, ?)",
);
const updateAuthorNameStmt = db.prepare(
  "UPDATE author SET name = ? WHERE rowid = ?",
);
const createCommentStmt = db.prepare(
  "INSERT INTO comment (post_id, author_id, text, created_at, edited_at) VALUES (?, ?, ?, ?, ?)",
);
const listCommentsByPostStmt = db.prepare(
  `SELECT
		comment.rowid AS id,
		comment.post_id,
		comment.author_id,
		author.name AS author_name,
		comment.text,
		comment.created_at,
		comment.edited_at
	FROM comment
	INNER JOIN author ON author.rowid = comment.author_id
	WHERE comment.post_id = ?
	ORDER BY comment.rowid ASC`,
);

export function listPosts(): PostListItem[] {
  return listStmt.all() as PostListItem[];
}

export function createPost(text: string): { id: number; created_at: string } {
  const now = new Date().toISOString();
  const result = createStmt.run(now, now, text.trim());
  return {
    id: Number(result.lastInsertRowid),
    created_at: now,
  };
}

export function getPostById(id: number): Post | undefined {
  return getStmt.get(id) as Post | undefined;
}

export function updatePost(id: number, text: string): boolean {
  const result = updateStmt.run(text.trim(), new Date().toISOString(), id);
  return result.changes > 0;
}

export function deletePost(id: number): boolean {
  const result = deleteStmt.run(id);
  return result.changes > 0;
}

export function getAuthorByKey(key: string): Author | undefined {
  return getAuthorByKeyStmt.get(key) as Author | undefined;
}

export function createAuthor(
  name: string,
  key: string = crypto.randomBytes(18).toString("hex"),
): Author {
  const now = new Date().toISOString();
  const safeName = name.trim() || `anon-${key.slice(0, 6)}`;
  const result = createAuthorStmt.run(safeName, key, 0, now);
  return {
    id: Number(result.lastInsertRowid),
    name: safeName,
    key,
    uptime: 0,
    created_at: now,
  };
}

export function updateAuthorName(id: number, name: string): void {
  updateAuthorNameStmt.run(name.trim(), id);
}

export function createComment(
  postId: number,
  authorId: number,
  text: string,
): { id: number; created_at: string } {
  const now = new Date().toISOString();
  const result = createCommentStmt.run(postId, authorId, text.trim(), now, now);
  return {
    id: Number(result.lastInsertRowid),
    created_at: now,
  };
}

export function listCommentsByPostId(postId: number): Comment[] {
  return listCommentsByPostStmt.all(postId) as Comment[];
}
