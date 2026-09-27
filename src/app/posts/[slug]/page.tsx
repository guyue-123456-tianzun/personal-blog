import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import CommentsSection from "@/components/CommentsSection";
import { Markdown } from "@/components/Markdown";
import { getPostBySlug } from "@/lib/content-api";
import { listComments } from "@/lib/comments";
import { fallbackCover } from "@/lib/site-config";
import { getPostViews, recordPostView } from "@/lib/site-stats";

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

  // 浏览计数:先记再取,本次访问也计入
  await recordPostView(post.slug);
  const views = await getPostViews(post.slug);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.cover || fallbackCover(post.slug)}
        alt=""
        className="mt-2 h-48 w-full rounded-2xl object-cover shadow-lg sm:h-64"
      />
      <h1 className="mt-8 text-3xl font-bold">{post.title}</h1>
      <p className="mt-2 text-sm opacity-50">
        {post.publishedAt?.slice(0, 10)} · 👁 {views} 次浏览
      </p>
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

      <CommentsSection slug={post.slug} initial={await listComments(post.slug)} />
    </main>
  );
}
