import { describe, expect, it } from "vitest";

import { keywordsOf, rankNotes } from "../src/lib/retrieval";

// 知识库问答的"检索"这一半(纯逻辑,不碰模型):
// 关键词切分、打分排序、以及"没有相关就不硬凑"这条底线
type Note = { id: number; title: string; tags: string[]; content: string };

const notes: Note[] = [
  {
    id: 1,
    title: "阿里云部署笔记",
    tags: ["服务器"],
    content: "在 ECS 上装 docker,把 compose 文件传上去。",
  },
  {
    id: 2,
    title: "随手记",
    tags: ["日常"],
    content: "今天点了外卖,顺便把部署脚本改了一下。",
  },
  {
    id: 3,
    title: "读书笔记",
    tags: ["阅读"],
    content: "看了一本讲设计的书。",
  },
];

describe("keywordsOf 关键词切分", () => {
  it("中文按 2-gram 切:没有空格的句子也能切出可匹配的词", () => {
    // 中文没有空格,如果整句当一个词,"我该怎么部署"就永远匹配不上
    expect(keywordsOf("我该怎么部署")).toContain("部署");
  });

  it("英文与数字按空白/标点切,虚词丢掉", () => {
    const words = keywordsOf("阿里云、docker 与 ECS");
    expect(words).toContain("docker");
    expect(words).toContain("ecs");
    expect(words).toContain("阿里云");
    expect(words).not.toContain("与");
  });

  it("同一句里重复的词只留一个", () => {
    const words = keywordsOf("部署 部署 部署");
    expect(words.filter((word) => word === "部署")).toHaveLength(1);
  });
});

describe("rankNotes 打分选篇", () => {
  it("标题命中排在正文命中前面", () => {
    const hits = rankNotes(notes, "部署");
    expect(hits.map((n) => n.id)).toEqual([1, 2]); // 1 标题里就有"部署"
  });

  it("自然语言问句也能捞到相关笔记", () => {
    const hits = rankNotes(notes, "帮我找一下部署相关的东西");
    expect(hits.map((n) => n.id)).toContain(1);
  });

  it("标签命中也能被找出来", () => {
    const hits = rankNotes(notes, "阅读");
    expect(hits.map((n) => n.id)).toEqual([3]);
  });

  it("没有相关内容的问句返回空,不硬凑", () => {
    // 这是底线:宁可回答"知识库里没有",也不把不相关的笔记塞给模型
    expect(rankNotes(notes, "量子力学怎么入门")).toEqual([]);
    expect(rankNotes(notes, "这是怎么回事")).toEqual([]);
  });

  it("最多返回 limit 篇", () => {
    const many: Note[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `部署笔记 ${i}`,
      tags: [],
      content: "部署",
    }));
    expect(rankNotes(many, "部署", 3)).toHaveLength(3);
  });

  it("多个关键词会累加分数", () => {
    const hits = rankNotes(notes, "阿里云 docker");
    expect(hits[0].id).toBe(1); // 两个词都命中它
  });
});
