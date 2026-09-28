import Link from "next/link";

import { getTagCloud } from "@/lib/content-api";

// 分类 · 标签卡(参考站左栏那块):按标签看文章,带篇数。
// 个人博客没有单独的"分类"维度,标签已经承担了这个事,所以合成一张卡,
// 不为了对齐参考图去造一个用不上的概念
export default async function TagCloudCard() {
  const tags = await getTagCloud();
  if (tags.length === 0) return null;

  const max = Math.max(...tags.map((tag) => tag.count));

  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="inline-block h-4 w-1 rounded-full bg-accent" />
        分类 · 标签
      </h3>
      <ul className="space-y-1.5 text-sm">
        {tags.slice(0, 12).map((tag) => (
          <li key={tag.name}>
            <Link
              href={`/tags/${tag.name}`}
              className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-foreground/5"
            >
              <span className="truncate opacity-80">{tag.name}</span>
              {/* 细条长度代表篇数多少,一眼看出哪类内容最多 */}
              <span className="ml-auto h-1.5 flex-1 max-w-16 overflow-hidden rounded-full bg-foreground/10">
                <span
                  className="block h-full rounded-full bg-accent/70"
                  style={{ width: `${Math.round((tag.count / max) * 100)}%` }}
                />
              </span>
              <span className="w-6 shrink-0 text-right text-xs opacity-50">
                {tag.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/archives"
        className="mt-3 inline-block text-xs text-accent hover:underline"
      >
        全部归档 →
      </Link>
    </section>
  );
}
