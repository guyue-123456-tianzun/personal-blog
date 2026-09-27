// 写入示例文章(幂等,按 slug 覆盖更新):用于 M1 里程碑验收。
// 正式发布界面在 M2 落地;届时站长从私有区后台写文章,不再依赖本脚本。
import { and, eq } from "drizzle-orm";

import { db } from "../src/lib/db";
import { comments, noteTags, notes, tags } from "../src/db/schema";
import { addComment } from "../src/lib/comments";

const demoPosts = [
  {
    slug: "hello-world",
    title: "我的个人站上线了",
    excerpt: "从一份架构文档到第一个可见的里程碑,记录这个网站是怎么搭起来的。",
    tags: ["随笔"],
    publishedAt: "2026-09-27 12:00:00",
    cover: "/images/cover-1.svg",
    content: `## 这个站是怎么来的

先写了一份企业级风格的规划文档,把需求、架构、里程碑全部定下来,然后一个里程碑一个里程碑地推进——你现在看到的这个页面,就是 **M1 里程碑** 的成果。

## 技术栈

- **框架**:Next.js 15(App Router)+ TypeScript
- **样式**:Tailwind CSS,自动适配深色模式
- **数据库**:SQLite + Drizzle ORM,单文件零运维
- **部署**:计划部署在阿里云 ECS,全容器化

## 代码高亮长这样

\`\`\`ts
// 文章以 Markdown 存在数据库里,渲染时自动高亮
async function getPublishedPosts(): Promise<Post[]> {
  const rows = await db.select().from(notes).where(eq(notes.isPublic, 1));
  return rows.map(toListItem);
}
\`\`\`

## 接下来

1. M2:知识库地基(笔记编辑器、搜索、附件)
2. M3:更多记录模块(动态、日记、书影音……)
3. M4:部署上服务器,用 IP 就能访问

> 未完待续。
`,
  },
  {
    slug: "markdown-render-test",
    title: "Markdown 渲染要素自检",
    excerpt: "一篇包含各类 Markdown 元素的自检文章,用来验收渲染效果。",
    tags: ["测试"],
    publishedAt: "2026-09-27 13:00:00",
    cover: "/images/cover-2.svg",
    content: `## 文本元素

行内代码 \`npm run dev\`,**加粗**,*斜体*,[链接](https://github.com),~~删除线~~。

## 引用

> 这是一段引用。好的工具应该让人专注内容本身。

## 表格

| 里程碑 | 内容 | 状态 |
| --- | --- | --- |
| M0 | 项目骨架 | ✅ |
| M1 | 博客公开区 | ✅ |
| M2 | 知识库地基 | 排期中 |

## 任务列表

- [x] 登录系统
- [x] 文章列表与详情
- [ ] 评论(M2 后)

## 代码块(Python)

\`\`\`python
def fib(n: int) -> int:
    """斐波那契数列第 n 项"""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print([fib(i) for i in range(10)])
\`\`\`
`,
  },
];

async function main() {
  for (const post of demoPosts) {
    const [row] = await db
      .insert(notes)
      .values({
        type: "post",
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        cover: post.cover,
        isPublic: 1,
        publishedAt: post.publishedAt,
      })
      .onConflictDoUpdate({
        target: notes.slug,
        set: {
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          cover: post.cover,
          publishedAt: post.publishedAt,
        },
      })
      .returning();

    // 标签先清后插,保证脚本可重复执行
    await db.delete(noteTags).where(eq(noteTags.noteId, row.id));
    for (const name of post.tags) {
      const [tag] = await db
        .insert(tags)
        .values({ name })
        .onConflictDoUpdate({ target: tags.name, set: { name } })
        .returning();
      await db.insert(noteTags).values({ noteId: row.id, tagId: tag.id });
    }
  }
  console.log("✅ 示例文章已写入(2 篇)");

  // 示例评论:只在还没有评论时写入,保证脚本可重复执行
  const [existing] = await db
    .select({ id: comments.id })
    .from(comments)
    .where(and(eq(comments.postSlug, "hello-world"), eq(comments.isVisible, 1)))
    .limit(1);
  if (!existing) {
    try {
      await addComment("seed", "hello-world", { author: "路人甲", content: "支持!期待后续更新。" });
      await addComment("seed", "hello-world", { author: "路过的小明", content: "写得不错,学到了。" });
      console.log("✅ 示例评论已写入(2 条)");
    } catch {
      console.log("ℹ️ 示例评论跳过(可能触发了限流)");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 写入失败:", error);
    process.exit(1);
  });
