import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

import { getSessionUsername } from "@/lib/session";

// 壁纸库:列出 public/wallpapers/ 下的图片/视频文件。
// 站长把 Wallpaper Engine 的 mp4 视频壁纸或任何图片丢进这个文件夹,后台即可一键选用。
export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const dir = path.join(process.cwd(), "public", "wallpapers");
  if (!fs.existsSync(dir)) {
    return NextResponse.json({ wallpapers: [] });
  }

  const files = fs
    .readdirSync(dir)
    .filter((name) => /\.(mp4|webm|png|jpe?g|webp)$/i.test(name))
    .sort();
  return NextResponse.json({
    wallpapers: files.map((name) => ({ name, url: `/wallpapers/${name}` })),
  });
}
