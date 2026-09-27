import AppearanceForm from "@/components/kb/AppearanceForm";
import { getAppearance } from "@/lib/settings";

// 外观设置:背景图/头像/虚化/占屏高度/签名/公告,站长自助调整,即时生效
export const dynamic = "force-dynamic";

export const metadata = { title: "外观设置" };

export default async function AppearancePage() {
  const appearance = await getAppearance();

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">外观设置</h1>
      <p className="mt-1 text-sm opacity-60">
        首页长什么样,这里说了算。所有改动即时生效,不需要重新发布。
      </p>
      <div className="mt-6">
        <AppearanceForm initial={appearance} />
      </div>
    </main>
  );
}
