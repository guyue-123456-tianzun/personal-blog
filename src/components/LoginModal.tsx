"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 弹窗式登录:浮在当前页面之上,背景整页虚化(露出的是站长自己的壁纸),
// 没有页面切换的割裂感。中间件会把未登录的 /kb 访问重定向到 /?login=1&next=xxx,
// 本组件检测到该参数就自动弹出,登录成功后回到 next 指向的页面。
export default function LoginModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState("/kb");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 检测 ?login=1(中间件重定向带来的),弹出登录框并把地址栏清理干净
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("login") === "1") {
      const nextParam = new URLSearchParams(window.location.search).get("next");
      if (nextParam) setNext(nextParam);
      setOpen(true);
      window.history.replaceState(null, "", "/");
    }
    const onOpen = () => setOpen(true);
    window.addEventListener("open-login", onOpen);
    return () => window.removeEventListener("open-login", onOpen);
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "登录失败,请重试");
        return;
      }
      setOpen(false);
      router.refresh();
      router.push(next);
    } catch {
      setError("网络异常,请重试");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const inputClass =
    "w-full rounded-lg border border-border bg-background/60 px-3.5 py-2.5 text-sm outline-none focus:border-accent";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* 背景:整页虚化,露出站长自己的壁纸与页面内容 */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-xl"
        onClick={() => setOpen(false)}
      />

      <div className="glass relative w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <button
          onClick={() => setOpen(false)}
          aria-label="关闭"
          className="absolute right-4 top-4 text-lg opacity-40 transition-opacity hover:opacity-100"
        >
          ×
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-lg text-white shadow-lg">
            ✦
          </span>
          <h1 className="text-xl font-bold">欢迎回来</h1>
        </div>
        <p className="mt-2 text-sm opacity-60">
          进入后台,继续书写你的{siteNameHint()}。
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3.5">
          <div>
            <label className="mb-1 block text-xs opacity-70">用户名</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs opacity-70">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}

          <label className="flex cursor-pointer items-center gap-2 text-xs opacity-70">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            下次自动登录(30 天)
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-gradient-to-r from-accent to-accent-2 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "登录中…" : "登录后台"}
          </button>
        </form>
      </div>
    </div>
  );
}

function siteNameHint() {
  // 站名在 site-config 里,这里避免再引一层依赖,用固定文案
  return "个人站";
}
