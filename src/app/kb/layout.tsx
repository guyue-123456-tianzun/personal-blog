import { redirect } from "next/navigation";

// 旧后台已彻底退役(2026-09-29 站长拍板):/kb 整个目录重定向到新家。
// 笔记/剪藏/书签 → /atlas 工作台;日记/习惯/记账/时间线/周报 → /life;
// 书影音 → /media;好友 → /buddies;导航页 → /nav;设置类 → /settings。
// API(/api/kb/*)不受影响,前台工作台还在调用它们。
export default function KbLayout() {
  redirect("/atlas");
}
