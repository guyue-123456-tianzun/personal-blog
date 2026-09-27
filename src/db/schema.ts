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
  role: text("role").notNull().default("user"), // 'admin' = 站长,'user' = 注册用户
  nickname: text("nickname"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
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
  cover: text("cover"), // 封面图 URL;空 = 用渐变占位图
  userId: integer("user_id"), // 内容归属用户;null = 站长早期的历史内容
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
  // 公开标记:1 = 访客无需登录即可访问(站点背景图/头像/公开配图用);默认 0 = 仅站长
  isPublic: integer("is_public").notNull().default(0),
  createdAt: text("created_at").notNull().default(now),
});

// 站点外观/配置项:键值对,后台"外观设置"页写入,前台即时生效
export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(now),
});

// 博客评论(公开区唯一的访客写入):软隐藏(is_visible=0)而非真删,站长可管理
export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postSlug: text("post_slug").notNull(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  isVisible: integer("is_visible").notNull().default(1),
  createdAt: text("created_at").notNull().default(now),
});

// 站点每日浏览:按天计数,支撑站点数据卡的"今日浏览"
export const siteViews = sqliteTable("site_views", {
  date: text("date").primaryKey(), // YYYY-MM-DD
  views: integer("views").notNull().default(0),
});

// 书影音记录(C1):想读/在看/看完 + 评分 + 短评
export const mediaItems = sqliteTable("media_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // book | movie | game
  title: text("title").notNull(),
  status: text("status").notNull().default("wish"), // wish | doing | done
  rating: integer("rating"), // 0~10,可空 = 未评分
  comment: text("comment"), // 短评
  coverUrl: text("cover_url"), // 可空 = 渐变占位图
  userId: integer("user_id"), // 归属用户;null = 站长历史内容
  createdAt: text("created_at").notNull().default(now),
  updatedAt: text("updated_at").notNull().default(now),
});

// 好友关系:双向确认制——A 发申请,B 同意后成为好友
export const friendships = sqliteTable("friendships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requesterId: integer("requester_id")
    .notNull()
    .references(() => users.id),
  addresseeId: integer("addressee_id")
    .notNull()
    .references(() => users.id),
  status: text("status").notNull().default("pending"), // pending | accepted
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

// 浏览计数:以 slug 为键,每次访问文章详情页 +1(个人站点,粗粒度足够)
export const postViews = sqliteTable("post_views", {
  slug: text("slug").primaryKey(),
  views: integer("views").notNull().default(0),
});

export type Note = typeof notes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type NoteVersion = typeof noteVersions.$inferSelect;
