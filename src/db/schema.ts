import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// 注意:SQLite 的 DEFAULT 子句要求函数调用必须包在括号里,裸写 datetime('now') 会报语法错误
const now = sql`(datetime('now'))`;

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default(now),
});

// 内容主表:博客文章 / 知识库笔记 / 剪藏 / 动态 / 日记…全部按 type 区分
// (设计见 docs/DEVELOPMENT.md 第 5 节;M1 先启用 post,M2/M3 逐步启用其余类型)
export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // 'post' = 公开博客文章
  slug: text("slug").notNull().unique(), // URL 标识,如 /posts/hello-world
  title: text("title").notNull(),
  excerpt: text("excerpt"), // 摘要,列表页展示,可空
  content: text("content").notNull(), // Markdown 原文
  isPublic: integer("is_public").notNull().default(0),
  pinned: integer("pinned").notNull().default(0), // 置顶文章排最前
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(now),
  updatedAt: text("updated_at").notNull().default(now),
  deletedAt: text("deleted_at"), // 非空 = 已进回收站(软删除)
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

// 文章与标签的多对多关联
export const noteTags = sqliteTable(
  "note_tags",
  {
    noteId: integer("note_id")
      .notNull()
      .references(() => notes.id),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id),
  },
  (t) => [primaryKey({ columns: [t.noteId, t.tagId] })],
);

// 附件(C6 照片墙 / B4 配图 / B6 文档都在这张表上):文件本体存磁盘 data/uploads/ 下,表里只记元信息
export const attachments = sqliteTable("attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  noteId: integer("note_id"), // 可空 = 尚未关联到任何笔记的散件
  filename: text("filename").notNull(), // 用户上传时的原始文件名
  storedPath: text("stored_path").notNull(), // 相对 data\ 目录的磁盘路径,如 uploads\2026\09\x.png
  mime: text("mime").notNull(),
  size: integer("size").notNull(), // 字节
  createdAt: text("created_at").notNull().default(now),
});

// 笔记版本历史(C7):每次保存前把旧版拍快照存进来,只保留最近 20 份
export const noteVersions = sqliteTable("note_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  noteId: integer("note_id")
    .notNull()
    .references(() => notes.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  savedAt: text("saved_at").notNull().default(now),
});

export type Note = typeof notes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type NoteVersion = typeof noteVersions.$inferSelect;
