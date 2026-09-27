"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/kb");
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "登录失败,请重试");
    } catch {
      setError("网络异常,请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-8 shadow-sm"
      >
        <h1 className="text-2xl font-bold">站长登录</h1>
        <div className="space-y-1.5">
          <label htmlFor="username" className="block text-sm opacity-70">
            用户名
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm opacity-70">
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "登录中…" : "登录"}
        </button>
      </form>
    </main>
  );
}
