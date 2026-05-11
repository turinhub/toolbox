const STORAGE_KEY = "toolbox-recent-tools";
const MAX_RECENT = 5;

export function getRecentTools(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

export function addRecentTool(path: string): void {
  try {
    const current = getRecentTools().filter(p => p !== path);
    current.unshift(path);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(current.slice(0, MAX_RECENT))
    );
  } catch {
    // localStorage 不可用时静默忽略
  }
}

export function clearRecentTools(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage 不可用时静默忽略
  }
}
