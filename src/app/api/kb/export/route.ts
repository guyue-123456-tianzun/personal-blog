import { NextResponse } from "next/server";

import { buildExportZip } from "@/lib/export";
import { getSessionUser } from "@/lib/session";

// C8 全量导出:下载一个 zip,里面是全部内容的 Markdown + 附件 + 清单
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const zip = await buildExportZip(user);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(new Blob([new Uint8Array(zip)]), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="blog-export-${date}.zip"`,
    },
  });
}
