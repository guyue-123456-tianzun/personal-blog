// 内容类型的唯一登记处:notes.type 的合法取值 + 各自在"全量导出"里的文件夹名。
// 新增一种内容类型时只改这一个文件:写入校验(notes.ts 的类型白名单)与导出目录结构同时跟上,
// 避免出现"能存进去但导出时文件夹名漂移"的漏登。另外按 AGENTS.md 的约定,
// 新类型还要在私有区 /kb 下有对应视图页、在 KbLinks 里挂上入口。
export const NOTE_TYPES = ["post", "note", "clip", "moment", "diary"] as const;

export type NoteType = (typeof NOTE_TYPES)[number];

// 类型 → 导出文件夹名。显式列全,不给默认值兜底,漏登记时 TS 会直接报错
const FOLDER_BY_TYPE: Record<NoteType, string> = {
  post: "posts",
  note: "notes",
  clip: "clips",
  moment: "moments",
  diary: "diaries",
};

/** 是不是合法的内容类型(写入层的白名单校验用) */
export function isNoteType(value: unknown): value is NoteType {
  return (
    typeof value === "string" && (NOTE_TYPES as readonly string[]).includes(value)
  );
}

/** 导出时的文件夹名;未登记的类型回落成类型本身,便于一眼看出遗漏 */
export function exportFolderFor(type: string): string {
  return FOLDER_BY_TYPE[type as NoteType] ?? type;
}
