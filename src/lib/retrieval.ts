// 知识库检索:把问题变成关键词,给每篇内容打分,挑出最相关的几篇。
//
// 为什么用关键词打分而不是向量检索:个人知识库是几十篇的量级,
// 在浏览器里算完是零延迟,而且"为什么选中这篇"是能解释的。
// 等量级上来了要换向量检索,换掉的也只是这一个函数(调用方不用动)。

/** 能参与检索的最小字段集 */
export type RetrievableNote = { title: string; tags: string[]; content: string };

// 问句里的虚词:不剔掉的话,"怎么""什么"这种会把整个库都命中
const STOPWORDS = new Set([
  "的", "了", "是", "我", "你", "他", "在", "和", "与", "就", "都", "也", "还",
  "怎么", "如何", "什么", "为什么", "哪些", "哪个", "这个", "那个", "请问",
  "一下", "可以", "有没有", "是不是", "多少", "及", "或",
  "and", "the", "a", "an", "is", "are", "of", "to", "for", "how", "what", "why",
]);

const CJK = /[\u4e00-\u9fa5]/;

/** 把问句切成关键词。
 *  中文没有空格,不能只按标点切——"我该怎么部署"整句会变成一个词,永远匹配不上。
 *  所以中文段落按 2-gram 切(部署 → 得到"部署"),短词(≤6 字)再整体留一份;
 *  英文/数字按空白与标点切。虚词与单字都丢掉。 */
export function keywordsOf(question: string): string[] {
  const out: string[] = [];
  const segments = question
    .toLowerCase()
    .split(/[\s,，。.?？!！、;；:：()（）[\]【】"'`~～|/\\-]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const chars = [...segment];
    if (!CJK.test(segment)) {
      // 西文:整词就是一个关键词
      if (chars.length >= 2 && !STOPWORDS.has(segment)) out.push(segment);
      continue;
    }
    for (let i = 0; i + 1 < chars.length; i++) {
      const gram = chars[i] + chars[i + 1];
      if (!STOPWORDS.has(gram)) out.push(gram);
    }
    // 短词整体再留一份,让"阿里云"这种完整词也参与打分
    if (chars.length >= 2 && chars.length <= 6 && !STOPWORDS.has(segment)) {
      out.push(segment);
    }
  }
  return [...new Set(out)];
}

/**
 * 打分选篇:标题命中 6 分 > 标签命中 4 分 > 正文命中次数(封顶 4 分)。
 * 分数为 0 的一律不要——宁可回答"知识库里没有",也不塞不相关的内容给模型。
 */
export function rankNotes<T extends RetrievableNote>(
  notes: T[],
  question: string,
  limit = 6,
): T[] {
  const words = keywordsOf(question);
  if (words.length === 0) return [];
  return notes
    .map((note) => {
      const title = note.title.toLowerCase();
      const tags = note.tags.join(" ").toLowerCase();
      const content = note.content.toLowerCase();
      let score = 0;
      for (const word of words) {
        if (title.includes(word)) score += 6;
        if (tags.includes(word)) score += 4;
        score += Math.min(content.split(word).length - 1, 4);
      }
      return { note, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.note);
}
