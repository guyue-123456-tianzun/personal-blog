"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import AskPanel, { type AtlasNote } from "@/components/atlas/AskPanel";
import BookmarkQuickForm from "@/components/atlas/BookmarkQuickForm";
import ClipForm from "@/components/kb/ClipForm";
import DiaryComposer from "@/components/kb/DiaryComposer";
import GalaxyBackground, {
  DEFAULT_GALAXY,
  type GalaxySettings,
} from "@/components/atlas/GalaxyBackground";
import KnowledgeGraph from "@/components/graph/KnowledgeGraph";
import { Markdown } from "@/components/Markdown";
import { NOTE_TYPES, noteTypeColor, noteTypeLabel } from "@/lib/content-types";
import type { GraphData } from "@/lib/graph";

type Props = {
  notes: AtlasNote[];
  graph: GraphData;
  aiEnabled: boolean;
  userName: string;
};

// 工作台里星系的默认姿态:带一点倾斜(24°),一进来就有"斜着看星盘"的立体感
const ATLAS_GALAXY: GalaxySettings = { ...DEFAULT_GALAXY, tilt: 0.42 };

// 知识库工作台:一整页的应用式界面(左 列表 / 中 图谱或阅读 / 右 属性与问答)。
// 和其它后台页的区别是它"自己即应用":三栏各自滚动、有快捷键、有状态栏,
// 不像管理页那样一条一条往下堆。
export default function AtlasWorkspace({ notes, graph, aiEnabled, userName }: Props) {
  const [mode, setMode] = useState<"graph" | "read">("graph");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  // 星系参数:大小/位置/立体倾斜/自转,星空与图谱共用同一份,是一个整体
  const [galaxy, setGalaxy] = useState<GalaxySettings>(ATLAS_GALAXY);
  const [galaxyPanelOpen, setGalaxyPanelOpen] = useState(false);
  // "新建"下拉与对应弹层:剪藏/日记/书签在弹层里直接录,笔记仍去编辑器页
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createPanel, setCreatePanel] = useState<"clip" | "diary" | "bookmark" | null>(
    null,
  );

  const noteById = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes]);
  const selected = selectedId !== null ? noteById.get(selectedId) ?? null : null;

  // 双向链接:只算"正文里写的 [[引用]]"(kind=wiki)。
  // 同标签的虚线是"内容相关",不算互相引用——否则这块会把两个概念混在一起
  const links = useMemo(() => {
    if (selectedId === null) return { backlinks: [], outgoing: [], related: [] };
    const toNotes = (ids: number[]) =>
      [...new Set(ids)]
        .map((id) => noteById.get(id))
        .filter((note): note is AtlasNote => Boolean(note));
    const wiki = graph.edges.filter((e) => e.kind === "wiki");
    return {
      backlinks: toNotes(wiki.filter((e) => e.to === selectedId).map((e) => e.from)),
      outgoing: toNotes(wiki.filter((e) => e.from === selectedId).map((e) => e.to)),
      // 同标签关联的邻居(虚线那一层),单独列出来
      related: toNotes(
        graph.edges
          .filter((e) => e.kind === "tag")
          .filter((e) => e.from === selectedId || e.to === selectedId)
          .map((e) => (e.from === selectedId ? e.to : e.from)),
      ),
    };
  }, [graph.edges, selectedId, noteById]);

  const countsByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const note of notes) map.set(note.type, (map.get(note.type) ?? 0) + 1);
    return map;
  }, [notes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (typeFilter !== "all" && note.type !== typeFilter) return false;
      if (!q) return true;
      return (
        note.title.toLowerCase().includes(q) ||
        note.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        note.content.toLowerCase().includes(q)
      );
    });
  }, [notes, query, typeFilter]);

  const openNote = useCallback((id: number) => {
    setSelectedId(id);
    setMode("read");
    setPaletteOpen(false);
    setPaletteQuery("");
  }, []);

  // ⌘K / Ctrl+K 唤起快速跳转,Esc 关掉
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setCreateMenuOpen(false);
        setCreatePanel(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const paletteHits = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    const pool = q
      ? notes.filter((note) => note.title.toLowerCase().includes(q))
      : notes;
    return pool.slice(0, 8);
  }, [notes, paletteQuery]);

  const stats = useMemo(
    () => ({
      words: notes.reduce((sum, note) => sum + note.content.length, 0),
      tags: new Set(notes.flatMap((note) => note.tags)).size,
      links: graph.edges.length,
    }),
    [notes, graph.edges.length],
  );

  return (
    <div className="relative flex flex-col lg:h-[calc(100vh-3.5rem)]">
      {/* 星系背景:跟工作台共用同一份参数,下面那个「🌌 星系」面板改的就是它 */}
      <GalaxyBackground settings={galaxy} />
      {/* ===== 顶部工具条 ===== */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2">
        <Link
          href="/kb"
          className="rounded-lg px-2 py-1 text-sm opacity-60 transition-colors hover:bg-foreground/5 hover:opacity-100"
        >
          ← 后台
        </Link>
        <span className="font-bold">知识库工作台</span>
        <span className="hidden text-xs opacity-45 sm:inline">
          {userName} 的 {notes.length} 篇内容
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPaletteOpen(true)}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs opacity-70 transition-colors hover:bg-foreground/5 hover:opacity-100"
          >
            ⌘K 快速跳转
          </button>
          <div className="flex items-center gap-0.5 rounded-full border border-border p-0.5 text-xs">
            <button
              onClick={() => setMode("graph")}
              className={`rounded-full px-3 py-1 transition-colors ${
                mode === "graph" ? "bg-accent text-white" : "opacity-60 hover:opacity-100"
              }`}
            >
              图谱
            </button>
            <button
              onClick={() => setMode("read")}
              className={`rounded-full px-3 py-1 transition-colors ${
                mode === "read" ? "bg-accent text-white" : "opacity-60 hover:opacity-100"
              }`}
            >
              阅读
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setCreateMenuOpen((v) => !v)}
              className="rounded-lg bg-accent px-2.5 py-1.5 text-xs text-white transition-opacity hover:opacity-90"
            >
              + 新建 {createMenuOpen ? "⌃" : "⌄"}
            </button>
            {createMenuOpen && (
              <>
                <button
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setCreateMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className="absolute right-0 z-50 mt-2 w-36 rounded-xl border border-border bg-card p-1.5 text-sm text-foreground shadow-lg backdrop-blur-md">
                  {[
                    { key: "note", label: "📝 笔记" },
                    { key: "clip", label: "✂️ 剪藏网页" },
                    { key: "diary", label: "📔 写日记" },
                    { key: "bookmark", label: "🔖 加书签" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setCreateMenuOpen(false);
                        if (item.key === "note") {
                          window.location.href = "/kb/notes/new";
                        } else {
                          setCreatePanel(item.key as "clip" | "diary" | "bookmark");
                        }
                      }}
                      className="block w-full rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-foreground/10"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== 三栏主体 ===== */}
      <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* 左:筛选 + 列表 */}
        <aside className="flex flex-col border-b border-border lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="p-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索标题、标签、正文…"
              className="w-full rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-accent"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              <TypeChip
                active={typeFilter === "all"}
                onClick={() => setTypeFilter("all")}
                label="全部"
                count={notes.length}
              />
              {NOTE_TYPES.filter((type) => (countsByType.get(type) ?? 0) > 0).map(
                (type) => (
                  <TypeChip
                    key={type}
                    active={typeFilter === type}
                    onClick={() => setTypeFilter(type)}
                    label={noteTypeLabel(type)}
                    count={countsByType.get(type) ?? 0}
                    color={noteTypeColor(type)}
                  />
                ),
              )}
            </div>
          </div>

          <div className="max-h-72 flex-1 overflow-y-auto px-2 pb-3 lg:max-h-none lg:min-h-0">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-xs opacity-55">没有匹配的内容。</p>
            ) : (
              filtered.map((note) => {
                const active = note.id === selectedId;
                return (
                  <button
                    key={note.id}
                    onClick={() => openNote(note.id)}
                    className={`mb-0.5 block w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                      active ? "bg-accent/15" : "hover:bg-foreground/5"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: noteTypeColor(note.type) }}
                      />
                      <span
                        className={`truncate text-sm ${active ? "font-medium text-accent" : ""}`}
                      >
                        {note.title}
                      </span>
                      {note.isPublic === 1 && (
                        <span className="shrink-0 text-[10px] opacity-45">公开</span>
                      )}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 pl-4 text-[11px] opacity-45">
                      <span>{note.updatedAt.slice(5, 10)}</span>
                      <span>{note.content.length} 字</span>
                      {note.tags[0] && <span className="truncate">#{note.tags[0]}</span>}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* 中:图谱 / 阅读 */}
        <section className="flex min-h-0 flex-col">
          {mode === "graph" ? (
            <div className="relative min-h-0 flex-1">
              <KnowledgeGraph
                data={graph}
                mode="private"
                variant="fill"
                onOpenNode={openNote}
                galaxy={galaxy}
              />

              {/* 星系控制:星星与节点共用同一份参数 */}
              <div className="absolute bottom-3 right-3">
                <button
                  onClick={() => setGalaxyPanelOpen((open) => !open)}
                  aria-expanded={galaxyPanelOpen}
                  className="glass rounded-full px-3.5 py-1.5 text-xs shadow-lg transition-colors hover:bg-foreground/5"
                >
                  🌌 星系
                </button>
                {galaxyPanelOpen && (
                  <div className="pop-in absolute bottom-10 right-0 w-64 rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">星系</p>
                      <button
                        onClick={() => setGalaxy(ATLAS_GALAXY)}
                        className="rounded-md px-1.5 py-0.5 text-xs opacity-50 transition-opacity hover:opacity-100"
                      >
                        重置
                      </button>
                    </div>
                    <GalaxySlider
                      label="大小"
                      value={galaxy.scale}
                      min={0.5}
                      max={1.8}
                      step={0.05}
                      format={(v) => `${Math.round(v * 100)}%`}
                      onChange={(v) => setGalaxy((s) => ({ ...s, scale: v }))}
                    />
                    <GalaxySlider
                      label="位置 X"
                      value={galaxy.offsetX}
                      min={-0.4}
                      max={0.4}
                      step={0.01}
                      format={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`}
                      onChange={(v) => setGalaxy((s) => ({ ...s, offsetX: v }))}
                    />
                    <GalaxySlider
                      label="位置 Y"
                      value={galaxy.offsetY}
                      min={-0.4}
                      max={0.4}
                      step={0.01}
                      format={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`}
                      onChange={(v) => setGalaxy((s) => ({ ...s, offsetY: v }))}
                    />
                    <GalaxySlider
                      label="立体倾斜"
                      value={galaxy.tilt}
                      min={0}
                      max={1.25}
                      step={0.02}
                      format={(v) => `${Math.round((v * 180) / Math.PI)}°`}
                      onChange={(v) => setGalaxy((s) => ({ ...s, tilt: v }))}
                    />
                    <GalaxySlider
                      label="自转速度"
                      value={galaxy.spinSpeed}
                      min={0}
                      max={3}
                      step={0.1}
                      format={(v) => `${v.toFixed(1)}×`}
                      onChange={(v) => setGalaxy((s) => ({ ...s, spinSpeed: v }))}
                    />
                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={galaxy.autoSpin}
                        onChange={(e) =>
                          setGalaxy((s) => ({ ...s, autoSpin: e.target.checked }))
                        }
                        className="accent-[var(--accent)]"
                      />
                      自动自转(星星与节点一起转)
                    </label>
                    <p className="mt-2 text-[10px] leading-relaxed opacity-45">
                      星星与节点共用同一份参数:大小 / 位置 / 倾斜对整个星系生效。
                      文字始终水平,不会跟着旋转。
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {selected ? (
                <article>
                  <div className="flex flex-wrap items-center gap-2 text-xs opacity-60">
                    <span
                      className="rounded-full px-2 py-0.5 text-white"
                      style={{ background: noteTypeColor(selected.type) }}
                    >
                      {noteTypeLabel(selected.type)}
                    </span>
                    <span>更新于 {selected.updatedAt.slice(0, 16)}</span>
                    <span>{selected.content.length} 字</span>
                    {selected.isPublic === 1 ? (
                      <span className="text-accent">已公开</span>
                    ) : (
                      <span>私有</span>
                    )}
                    <Link
                      href={`/kb/notes/${selected.id}`}
                      className="ml-auto text-accent hover:underline"
                    >
                      打开编辑器 →
                    </Link>
                  </div>
                  <h1 className="mt-3 text-2xl font-bold">{selected.title}</h1>
                  {selected.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selected.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border px-2 py-0.5 text-[11px] opacity-70"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-6">
                    <Markdown content={selected.content} />
                  </div>

                  {(links.backlinks.length > 0 || links.outgoing.length > 0) && (
                    <div className="mt-10 space-y-3 border-t border-border pt-5">
                      <LinkList
                        title="反向链接"
                        hint="有谁提到了这篇"
                        notes={links.backlinks}
                        onOpen={openNote}
                      />
                      <LinkList
                        title="出链"
                        hint="这篇提到了谁"
                        notes={links.outgoing}
                        onOpen={openNote}
                      />
                    </div>
                  )}
                </article>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm opacity-55">
                  从左边挑一篇开始读,或者切到「图谱」看全局。按 ⌘K 可以直接搜标题跳转。
                </div>
              )}
            </div>
          )}
        </section>

        {/* 右:属性 / 双向链接 / 问答 */}
        <aside className="space-y-3 overflow-y-auto border-t border-border p-3 lg:min-h-0 lg:border-l lg:border-t-0">
          {selected ? (
            <>
              <section className="glass rounded-2xl p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <span className="inline-block h-4 w-1 rounded-full bg-accent" />
                  属性
                </h3>
                <dl className="space-y-1.5 text-xs">
                  <Row label="类型" value={noteTypeLabel(selected.type)} />
                  <Row label="创建" value={selected.createdAt.slice(0, 10)} />
                  <Row label="更新" value={selected.updatedAt.slice(0, 16)} />
                  <Row label="字数" value={`${selected.content.length}`} />
                  <Row label="可见性" value={selected.isPublic === 1 ? "公开" : "仅自己"} />
                  <Row
                    label="引用"
                    value={`← ${links.backlinks.length} · → ${links.outgoing.length}`}
                  />
                  <Row label="同标签" value={`${links.related.length} 篇`} />
                </dl>
              </section>

              <section className="glass rounded-2xl p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <span className="inline-block h-4 w-1 rounded-full bg-accent" />
                  双向链接
                </h3>
                {links.backlinks.length === 0 &&
                links.outgoing.length === 0 &&
                links.related.length === 0 ? (
                  <p className="text-xs leading-relaxed opacity-55">
                    还没有关联。在这篇正文里写{" "}
                    <code className="rounded bg-foreground/10 px-1 py-0.5">
                      [[另一篇的标题]]
                    </code>
                    ,就会建立双向链接;给两篇打同一个标签也会自动出现在「同标签」里。
                  </p>
                ) : (
                  <div className="space-y-3">
                    <LinkList
                      title="反向链接"
                      notes={links.backlinks}
                      onOpen={openNote}
                      compact
                    />
                    <LinkList
                      title="出链"
                      notes={links.outgoing}
                      onOpen={openNote}
                      compact
                    />
                    <LinkList
                      title="同标签"
                      hint="内容相关,不是互相引用"
                      notes={links.related}
                      onOpen={openNote}
                      compact
                    />
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="glass rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <span className="inline-block h-4 w-1 rounded-full bg-accent" />
                知识库概览
              </h3>
              <div className="grid grid-cols-2 gap-2 text-center">
                <Metric value={notes.length} label="篇内容" />
                <Metric value={stats.tags} label="个标签" />
                <Metric value={stats.links} label="条链接" />
                <Metric value={stats.words} label="总字数" />
              </div>
              <p className="mt-3 text-[11px] leading-relaxed opacity-50">
                选一篇笔记,这里会显示它的属性与双向链接。
              </p>
            </section>
          )}

          <AskPanel notes={notes} aiEnabled={aiEnabled} onOpenNote={openNote} />
        </aside>
      </div>

      {/* ===== 底部状态栏 ===== */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-1.5 text-[11px] opacity-55">
        <span>
          当前筛选 {filtered.length} / {notes.length}
        </span>
        <span>{stats.links} 条连线</span>
        <span className="hidden sm:inline">点左侧条目或图谱节点进入阅读</span>
        <span className="ml-auto">⌘K 快速跳转 · Esc 关闭弹层</span>
      </div>

      {/* ===== ⌘K 快速跳转 ===== */}
      {paletteOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              autoFocus
              value={paletteQuery}
              onChange={(e) => setPaletteQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && paletteHits[0]) openNote(paletteHits[0].id);
              }}
              placeholder="输入标题,回车打开第一篇…"
              className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none"
            />
            <ul className="max-h-80 overflow-y-auto p-1.5">
              {paletteHits.length === 0 ? (
                <li className="px-3 py-2 text-xs opacity-55">没有匹配的内容</li>
              ) : (
                paletteHits.map((note) => (
                  <li key={note.id}>
                    <button
                      onClick={() => openNote(note.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-foreground/5"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: noteTypeColor(note.type) }}
                      />
                      <span className="truncate text-sm">{note.title}</span>
                      <span className="ml-auto shrink-0 text-[11px] opacity-45">
                        {noteTypeLabel(note.type)}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {/* ===== 新建弹层:剪藏 / 日记 / 书签 ===== */}
      {createPanel && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setCreatePanel(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 text-foreground shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">
                {createPanel === "clip"
                  ? "✂️ 剪藏网页"
                  : createPanel === "diary"
                    ? "📔 写日记"
                    : "🔖 加书签"}
              </h3>
              <button
                onClick={() => setCreatePanel(null)}
                aria-label="关闭"
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm opacity-60 transition-colors hover:bg-foreground/10 hover:opacity-100"
              >
                ✕
              </button>
            </div>
            {createPanel === "clip" && (
              <>
                <p className="mb-3 text-xs opacity-55">
                  粘贴网址,服务端抓标题和正文存成剪藏笔记。
                </p>
                <ClipForm />
              </>
            )}
            {createPanel === "diary" && (
              <>
                <p className="mb-3 text-xs opacity-55">日记默认仅自己可见。</p>
                <DiaryComposer />
              </>
            )}
            {createPanel === "bookmark" && (
              <>
                <p className="mb-3 text-xs opacity-55">
                  三秒存一条;整理去「书签」管理页。
                </p>
                <BookmarkQuickForm />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TypeChip({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-border opacity-70 hover:bg-foreground/5 hover:opacity-100"
      }`}
    >
      {color && (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      )}
      {label}
      <span className="opacity-55">{count}</span>
    </button>
  );
}

/** 星系面板里的一行滑杆:标签 + 数值 + range */
function GalaxySlider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mt-3 flex items-center gap-3 text-xs">
      <span className="w-14 shrink-0 opacity-65">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-[var(--accent)]"
      />
      <span className="w-11 shrink-0 text-right font-mono opacity-70">
        {format(value)}
      </span>
    </label>
  );
}

function LinkList({
  title,
  hint,
  notes,
  onOpen,
  compact = false,
}: {
  title: string;
  hint?: string;
  notes: AtlasNote[];
  onOpen: (id: number) => void;
  compact?: boolean;
}) {
  if (notes.length === 0) {
    return (
      <div>
        <p className="text-[11px] opacity-45">
          {title} · 暂无
        </p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-[11px] opacity-45">
        {title}
        {hint ? ` · ${hint}` : ""}
      </p>
      <ul className={`mt-1.5 flex flex-wrap gap-1.5 ${compact ? "" : "text-sm"}`}>
        {notes.map((note) => (
          <li key={note.id}>
            <button
              onClick={() => onOpen(note.id)}
              className="flex max-w-full items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] opacity-75 transition-opacity hover:opacity-100"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: noteTypeColor(note.type) }}
              />
              <span className="truncate">{note.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="opacity-50">{label}</dt>
      <dd className="truncate">{value}</dd>
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-foreground/5 p-2.5">
      <p className="text-lg font-bold">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-[11px] opacity-60">{label}</p>
    </div>
  );
}
