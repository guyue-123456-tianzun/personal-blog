# AGENTS.md — 项目指南(AI/开发者接手前必读)

## 项目是什么

个人站 = **公开博客 + 私人知识库**合一体,部署在阿里云 ECS。
- 公开区:博客文章、标签、归档、RSS、评论、关于页
- 私有区(`/kb`,需登录):笔记、网页剪藏、想法速记、朋友圈式动态、日记、附件、学习路线、成长时间线
- 单管理员系统,只有一个登录用户(站长本人)
- AI 检索/问答为二期,一期只留接口桩

**用户画像**:站长不写代码。所有面向用户的沟通用中文、通俗、不堆术语;验收靠"打开浏览器点一点"。除非站长明确要求,不要让他做技术操作。

## 关键文档

- `docs/DEVELOPMENT.md` — 项目开发文档:需求清单(含验收标准)、架构、里程碑、决策记录。**做任何功能前先对照它的验收标准。**
- `docs/ARCHITECTURE.md` — 基础设施架构(服务器/部署/CI/备份),仍然有效。

## 技术栈与约定

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- 数据库 SQLite + Drizzle ORM;迁移脚本在 `drizzle/`,**改表必须走迁移,不许手改库**
- 所有内容(博客文章、笔记、日记、动态…)统一存 `notes` 主表,按 `type` 区分;公开博客 = `is_public=true` 的内容
- 全文搜索一期用 SQLite `LIKE`,二期换 FTS5/Meilisearch,搜索逻辑集中在 `src/lib/search.ts` 一处
- 认证:自实现单管理员会话(bcrypt 哈希 + HttpOnly 签名 Cookie),不要引入 Auth.js/NextAuth
- AI 预留:任何读取内容的新功能一律经过 `src/lib/content-api.ts`,不得绕过直查表(二期 RAG 在此挂向量检索)
- 隐私红线:私有内容(日记/笔记等)绝不进入公开 API、RSS、sitemap、构建产物

## 常用命令

```bash
npm run dev        # 本地开发
npm run build      # 生产构建
npm run lint       # 代码检查(CI 必须通过)
npm run test       # 单元测试(CI 必须通过)
npx drizzle-kit generate migrate   # 数据库迁移
docker compose -f deploy/docker-compose.yml up -d   # 生产部署(服务器上)
```

## 代码规范

- 中文注释与中文文档;注释解释"为什么",不复述"是什么"
- 提交信息用 conventional commits(`feat: …` / `fix: …`),中文描述
- 组件放 `src/components/`,业务逻辑不写在页面文件里
- 新增内容类型 = notes.type 新枚举 + 扩展表 + 私有区一个视图页,勿另起炉灶

## 当前进度(每完成一项就更新这里)

- [x] 规划完成(DEVELOPMENT.md v1.1,C1~C10 全部纳入一期)
- [x] M0 立项与骨架(2026-09-27:Next.js 15.5 骨架 + SQLite/Drizzle 迁移 + 站长登录 + 私有区守卫,五项登录流程验收通过,本地 git 已提交)
- [ ] M1 博客公开区
- [ ] M2 知识库地基
- [ ] M3 记录模块
- [ ] M4 服务器上线
- [ ] M5 域名+HTTPS
- [ ] M6 CI/CD
- [ ] M7 运维加固

## 工作约定

1. 进入新里程碑前先给实现方案,确认后再写码
2. 里程碑完成前先自验 DEVELOPMENT.md 里的验收标准,再请站长验收
3. 一次会话一个主题;发现方向偏差立即停下纠正
4. 重大技术决策写入 DEVELOPMENT.md 的决策记录表,不要只留在对话里
