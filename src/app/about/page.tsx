import Link from "next/link";

import { getAppearance } from "@/lib/settings";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export const metadata = { title: "关于" };

// 关于页:横幅(同款背景图) + "关于我/关于博客"双段 + 联系方式,内容在 site-config.ts 维护
export default async function AboutPage() {
  const appearance = await getAppearance();

  return (
    <>
      {/* 横幅:和首页共用背景,高度收敛一些 */}
      <section className="relative flex h-64 items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={appearance.heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: `blur(${Math.round(appearance.heroBlur * 0.4)}px)`, transform: "scale(1.08)" }}
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 text-center text-white">
          <h1 className="text-3xl font-bold drop-shadow-lg">关于</h1>
          <p className="mt-2 text-sm opacity-90">关于我和这个博客</p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span className="inline-block h-5 w-1 rounded-full bg-accent" />
            关于我
          </h2>
          <div className="mt-3 space-y-3 leading-7 opacity-85">
            {siteConfig.aboutMe.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <h2 className="mt-8 flex items-center gap-2 text-lg font-bold">
            <span className="inline-block h-5 w-1 rounded-full bg-accent-2" />
            关于博客
          </h2>
          <div className="mt-3 space-y-3 leading-7 opacity-85">
            {siteConfig.aboutBlog.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <h2 className="mt-8 flex items-center gap-2 text-lg font-bold">
            <span className="inline-block h-5 w-1 rounded-full bg-accent" />
            找到我
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {siteConfig.socials.map((social) => (
              <Link
                key={social.label}
                href={social.url}
                target="_blank"
                className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-foreground/10"
              >
                {social.label}
              </Link>
            ))}
          </div>

          <p className="mt-8 border-t border-border pt-4 text-xs opacity-50">
            这里没什么特别,只是一个记录成长、思考和生活的地方。欢迎常来坐坐。
          </p>
        </div>
      </main>
    </>
  );
}
