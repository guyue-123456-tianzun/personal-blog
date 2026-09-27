export const metadata = { title: "关于" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">关于我</h1>
      <div className="prose prose-neutral mt-6 max-w-none dark:prose-invert">
        <p>你好,欢迎来到我的个人站。</p>
        <p>
          这里是我的公开博客,记录技术学习与生活思考。
          站点同时包含一个仅我自己可见的私人知识库。
        </p>
        <p className="opacity-60">
          (此页面为占位内容,正式介绍由站长提供后替换。)
        </p>
      </div>
    </main>
  );
}
