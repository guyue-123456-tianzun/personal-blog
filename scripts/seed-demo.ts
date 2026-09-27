// 写入示例文章(幂等,按 slug 覆盖更新):用于 M1 里程碑验收。
// 正式发布界面在 M2 落地;届时站长从私有区后台写文章,不再依赖本脚本。
import { and, count, eq } from "drizzle-orm";

import { db } from "../src/lib/db";
import { comments, mediaItems, noteTags, notes, tags, users } from "../src/db/schema";
import { addComment } from "../src/lib/comments";
import { createNote } from "../src/lib/notes";
import { getAdminUser, registerUser } from "../src/lib/users";

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
  {
    slug: "aliyun-deploy-notes",
    title: "阿里云部署备忘",
    excerpt: "安全组、Docker、Nginx 三件套的部署清单,照着做就不会漏。",
    tags: ["部署"],
    publishedAt: "2026-09-26 20:00:00",
    cover: "/images/cover-3.svg",
    content: `## 部署清单

- 安全组只放行 22 / 80 / 443
- Docker Compose 一键拉起应用与 Nginx
- certbot 自动续期 HTTPS 证书

\`\`\`bash
docker compose pull && docker compose up -d
\`\`\`

> 备份先行,部署随后。
`,
  },
  {
    slug: "weekly-reading-01",
    title: "本周读到的三篇好文章",
    excerpt: "关于写作、关于工具、关于长期主义,各推荐一篇。",
    tags: ["阅读"],
    publishedAt: "2026-09-25 09:00:00",
    cover: "/images/cover-4.svg",
    content: `## 本周书签

1. 《写作是一门手艺》——先完成,再完美
2. 一篇讲 SQLite 适用场景的长文,写得非常透彻
3. 长期主义:把时间当作朋友

每周固定整理一次阅读收获,积少成多。
`,
  },
  {
    slug: "my-dev-setup",
    title: "我的开发环境清单",
    excerpt: "新机器半小时到位:编辑器、终端、字体、必装工具一次配齐。",
    tags: ["工具"],
    publishedAt: "2026-09-24 21:00:00",
    cover: "/images/cover-1.svg",
    content: `## 必装清单

- VS Code + 同步插件
- Windows Terminal + PowerShell
- Git 全局配置与 SSH 密钥

\`\`\`bash
winget install Git.Git
\`\`\`

工具趁手,效率翻倍。
`,
  },
  {
    slug: "night-walk",
    title: "夜跑五公里",
    excerpt: "晚风、路灯和播客,是跑步最好的搭档。",
    tags: ["生活"],
    publishedAt: "2026-09-23 22:00:00",
    cover: "/images/cover-2.svg",
    content: `今晚沿着河边跑了五公里。

跑到第三公里的时候腿开始沉,但耳机里的歌刚好切到副歌,就又撑了下去。

**坚持这种事,从来靠的不是热血,是习惯。**
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
  const admin = await getAdminUser();
  const adminId = admin?.id ?? null;

  // 示例说说:仅在还没有说说时写入
  const [momentCount] = await db
    .select({ c: count() })
    .from(notes)
    .where(eq(notes.type, "moment"));
  if (momentCount.c === 0) {
    await createNote({
      type: "moment",
      title: "晚风很温柔",
      content: "晚饭后沿河走了五公里,晚风很温柔。",
      tags: ["生活"],
      isPublic: 1,
      publishedAt: "2026-09-27 19:00:00",
    }, adminId);
    await createNote({
      type: "moment",
      title: "换星夜壁纸",
      content: "把站点背景换成星夜了,顺便调了下虚化,舒服。",
      tags: ["折腾"],
      isPublic: 1,
      publishedAt: "2026-09-27 20:00:00",
    }, adminId);
    await createNote({
      type: "moment",
      title: "私密的一条",
      content: "这条是私密说说,只有我自己能看到。",
      tags: ["日常"],
      isPublic: 0,
      publishedAt: "2026-09-27 21:00:00",
    }, adminId);
    console.log("✅ 示例说说已写入(3 条)");
  }

  // 示例书影音:仅在为空时写入
  const [mediaCount] = await db.select({ c: count() }).from(mediaItems);
  if (mediaCount.c === 0) {
    await db.insert(mediaItems).values([
      { type: "book", title: "置身事外", status: "done", rating: 9, comment: "把中国经济讲得明明白白。" },
      { type: "book", title: "漫长的季节", status: "doing", rating: 8 },
      { type: "movie", title: "星际穿越", status: "done", rating: 10, comment: "第五遍重看,还是会哭。" },
      { type: "movie", title: "沙丘 3", status: "wish" },
      { type: "game", title: "塞尔达传说:王国之泪", status: "doing", rating: 9, comment: "呀哈哈收集强迫症慎入。" },
    ]);
    console.log("✅ 示例书影音已写入(5 条)");
  }

  // 示例注册用户:让朋友圈的"随机刷新/加好友"有内容可玩(密码 123456)
  const [existingXm] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, "xiaoming"))
    .limit(1);
  if (!existingXm) {
    try {
      const xm = await registerUser({
        username: "xiaoming",
        password: "123456",
        nickname: "路人小妹",
      });
      await createNote(
        {
          type: "moment",
          title: "第一次来",
          content: "路过看到这个站,来交个朋友!",
          tags: ["交友"],
          isPublic: 1,
          publishedAt: "2026-09-27 22:00:00",
        },
        xm.id,
      );
      console.log("✅ 示例用户 xiaoming 已注册(密码 123456)并发布了动态");
    } catch {
      console.log("ℹ️ 示例用户已存在,跳过");
    }
  }

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
