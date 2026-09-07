import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import type { RegexMatchRange } from "@/lib/regex/runner";

// Playwright 默认将 JSX 编译为浏览器挂载描述；此处用项目 TS 编译器加载真实 React 组件。
const filename = resolve("components/regex-highlight.tsx");
const compiled = transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: {
    jsx: JsxEmit.ReactJSX,
    module: ModuleKind.CommonJS,
    target: ScriptTarget.ES2017,
  },
  fileName: filename,
}).outputText;
const componentExports: Record<string, unknown> = {};
runInNewContext(compiled, {
  exports: componentExports,
  require: createRequire(filename),
});
const RegexHighlight =
  componentExports.RegexHighlight as typeof import("@/components/regex-highlight").RegexHighlight;

function render(text: string, matches: RegexMatchRange[]) {
  return renderToStaticMarkup(
    createElement(RegexHighlight, {
      text,
      matches,
      emptyMatchLabel: position => `空匹配，位置 ${position}`,
    })
  );
}

test("危险 HTML 与事件属性仅作为文本输出，包括匹配内部的标签", () => {
  const text =
    '<b>hello</b>&amp;<img src=x onerror="alert(1)"><svg onload="alert(2)"></svg><script>alert(3)</script>';
  for (const ranges of [[], [{ start: 0, end: 12 }], [{ start: 3, end: 8 }]]) {
    const html = render(text, ranges);
    expect(html).not.toMatch(/<(?:b|img|svg|script)(?:\s|>)/i);
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("&amp;amp;");
    const plainEscapedText = renderToStaticMarkup(
      createElement("span", null, text)
    ).replace(/<[^>]*>/g, "");
    expect(html.replace(/<[^>]*>/g, "")).toBe(plainEscapedText);
  }
});

test("UTF-16 空匹配位置不会吞掉文本，空结果也保留原文", () => {
  const text = "😀\n中文 <tag>";
  for (const ranges of [
    [],
    [
      { start: 0, end: 0 },
      { start: 2, end: 2 },
    ],
    [
      { start: 0, end: 2 },
      { start: text.length, end: text.length },
    ],
  ]) {
    const html = render(text, ranges);
    const expected = renderToStaticMarkup(
      createElement("span", null, text)
    ).replace(/<[^>]*>/g, "");
    expect(html.replace(/<[^>]*>/g, "")).toBe(expected);
    expect((html.match(/<mark\b/g) ?? []).length).toBe(ranges.length);
  }
  expect(render("", [{ start: 0, end: 0 }])).toContain("空匹配，位置 0");
});
