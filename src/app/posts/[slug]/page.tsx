import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Markdown } from "@/components/Markdown";
import { getPostBySlug } from "@/lib/content-api";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "文章不存在" };
  return { title: post.title, description: post.excerpt ?? undefined };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <p className="mt-2 text-sm opacity-50">{post.publishedAt?.slice(0, 10)}</p>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="rounded-full border border-border px-2.5 py-0.5 text-xs opacity-70 transition-opacity hover:opacity-100"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
      <article className="mt-8">
        <Markdown content={post.content} />
      </article>
      <Link href="/" className="mt-10 inline-block text-sm text-accent hover:underline">
        ← 返回首页
      </Link>
    </main>
  );
}
