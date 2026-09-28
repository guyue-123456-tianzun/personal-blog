"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// 照片墙·站长快捷上传:把后台的"上传附件"搬进公开照片墙——
// 选几张图直接传,公开附件会自动出现在照片墙里,不用再绕道后台。
export default function PhotoUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  async function upload(files: FileList) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setHint("请选择图片文件");
      return;
    }
    setBusy(true);
    setHint(`上传中 0/${list.length}…`);
    let done = 0;
    let failed = 0;
    for (const file of list) {
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("public", "1"); // 照片墙是公开页,上传即公开
        const res = await fetch("/api/kb/attachments", {
          method: "POST",
          body: form,
        });
        if (res.ok) done += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
      setHint(`上传中 ${done + failed}/${list.length}…`);
    }
    setBusy(false);
    setHint(
      failed === 0
        ? `已上传 ${done} 张 ✓`
        : `成功 ${done} 张,失败 ${failed} 张(文件可能太大或格式不支持)`,
    );
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-medium text-accent"
      >
        <span>📤 站长快捷上传(不用去后台)</span>
        <span>{open ? "收起 ⌃" : "展开 ⌄"}</span>
      </button>

      {open && (
        <div className="mt-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onChange={(e) => {
              if (e.target.files?.length) void upload(e.target.files);
            }}
            className="block w-full cursor-pointer rounded-xl border border-border bg-card px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-1.5 file:text-white"
          />
          {hint && <p className="mt-2 text-xs opacity-70">{hint}</p>}
        </div>
      )}
    </div>
  );
}
