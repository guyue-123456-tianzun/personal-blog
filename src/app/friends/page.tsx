import { siteConfig } from "@/lib/site-config";

export const metadata = { title: "友链" };

export default function FriendsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">友链</h1>
      <p className="mt-2 text-sm opacity-60">
        常去的格子间。想交换友链?给站长留言即可。
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {siteConfig.friends.map((friend) => (
          <a
            key={friend.url}
            href={friend.url}
            target="_blank"
            className="glass block rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <p className="font-semibold">{friend.name}</p>
            <p className="mt-1 text-sm opacity-70">{friend.desc}</p>
            <p className="mt-2 truncate text-xs opacity-40">{friend.url}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
