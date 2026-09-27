# 个人站(博客 + 知识库)

公开博客 + 私人知识库的合一体。规划与进度见 `docs/DEVELOPMENT.md`,项目规范见 `AGENTS.md`。

## 常用命令

```bash
npm run dev          # 本地开发(http://localhost:3000)
npm run build        # 生产构建
npm run lint         # 代码检查
npm run db:generate  # 修改 src/db/schema.ts 后生成数据库迁移
npm run db:seed -- 用户名 密码   # 创建/重置站长账号
```

数据库文件在 `data/blog.db`(不入 git,备份针对它);登录会话密钥在 `.env.local` 的 `AUTH_SECRET`。
