import { pinyin as pinyinConvert } from "pinyin-pro";

export function getPinyin(text: string): string {
  if (!text) return "";
  const result = pinyinConvert(text, {
    toneType: "none",
    separator: "",
  });
  return typeof result === "string"
    ? result.toLowerCase()
    : String(result).toLowerCase();
}

export function getPinyinInitials(text: string): string {
  if (!text) return "";
  const arr = pinyinConvert(text, {
    toneType: "none",
    type: "array",
  }) as unknown as string[];
  return Array.isArray(arr)
    ? arr.map(s => (s && typeof s === "string" ? (s[0] ?? "") : "")).join("")
    : "";
}

// 搜索匹配函数
export function pinyinSearch(text: string, query: string): boolean {
  if (!text || !query) return false;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // 1. 原始文本匹配
  if (lowerText.includes(lowerQuery)) {
    return true;
  }

  // 2. 拼音全拼匹配
  const textPinyin = getPinyin(text);
  const queryPinyin = getPinyin(query);
  if (textPinyin.includes(queryPinyin)) {
    return true;
  }

  // 3. 拼音首字母匹配
  const textInitials = getPinyinInitials(text);
  const queryInitials = getPinyinInitials(query);
  if (textInitials.includes(queryInitials)) {
    return true;
  }

  return false;
}

// 增强的拼音搜索函数，支持多个关键词
export function advancedPinyinSearch(text: string, query: string): boolean {
  if (!text || !query) return false;

  // 分解查询词
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);

  return keywords.every(keyword => {
    // 对每个关键词都进行多种匹配
    return pinyinSearch(text, keyword);
  });
}
