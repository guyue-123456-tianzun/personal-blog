export const metadata = { title: "导出" };

// C8 全量导出:说明页 + 下载按钮(直接链向 GET /api/kb/export,middleware 会先验登录)
export default function ExportPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold">导出全部内容</h1>
      <p className="mt-3 text-sm leading-6 opacity-80">
        点下面的按钮会下载一个 zip 压缩包,里面是:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-sm leading-6 opacity-80">
        <li>posts\ —— 全部博客文章,Markdown 格式</li>
        <li>notes\ —— 全部私有笔记,Markdown 格式</li>
        <li>attachments\ —— 全部附件原文件</li>
        <li>manifest.json —— 导出时间和数量清单</li>
      </ul>
      <p className="mt-3 text-sm leading-6 opacity-80">
        每篇都带标准 frontmatter(标题/标签/日期),用 Obsidian、Typora
        等任何笔记软件都能直接打开——你的数据永远不属于任何一个平台。
      </p>
      <a
        href="/api/kb/export"
        className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
      >
        下载全部内容(.zip)
      </a>
    </main>
  );
}
