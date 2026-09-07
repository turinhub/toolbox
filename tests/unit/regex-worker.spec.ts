import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { Worker } from "node:worker_threads";

type WorkerReply =
  | { type: "ready" }
  | {
      type: "result";
      id: number;
      matches: { start: number; end: number }[];
      limited: boolean;
    }
  | { type: "error"; id: number; message: string };

// 在线程中加载实际浏览器 Worker 源码，仅适配消息 API，避免回溯阻塞测试进程。
function startWorker() {
  return new Worker(
    `
      const { parentPort, workerData } = require("node:worker_threads");
      const { readFileSync } = require("node:fs");
      const { runInThisContext } = require("node:vm");
      globalThis.self = globalThis;
      globalThis.postMessage = message => parentPort.postMessage(message);
      globalThis.addEventListener = (type, listener) => {
        if (type === "message") parentPort.on("message", data => listener({ data }));
      };
      parentPort.on("message", data => globalThis.onmessage?.({ data }));
      runInThisContext(readFileSync(workerData, "utf8"), { filename: workerData });
    `,
    {
      eval: true,
      workerData: resolve("public/workers/regex.worker.js"),
    }
  );
}

function nextMessage(worker: Worker): Promise<WorkerReply> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Worker 未在限定时间内响应"));
    }, 3_000);
    const cleanup = () => {
      clearTimeout(timer);
      worker.off("message", onMessage);
      worker.off("error", onError);
    };
    const onMessage = (message: WorkerReply) => {
      cleanup();
      resolve(message);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    worker.once("message", onMessage);
    worker.once("error", onError);
  });
}

const cases = [
  { pattern: "^", flags: "g", text: "", ranges: [[0, 0]] },
  { pattern: "$", flags: "g", text: "abc", ranges: [[3, 3]] },
  {
    pattern: "a*",
    flags: "g",
    text: "aab",
    ranges: [
      [0, 2],
      [2, 2],
      [3, 3],
    ],
  },
  {
    pattern: "(?:)",
    flags: "gu",
    text: "😀",
    ranges: [
      [0, 0],
      [2, 2],
    ],
  },
  { pattern: "a", flags: "", text: "aba", ranges: [[0, 1]] },
  {
    pattern: "a",
    flags: "g",
    text: "aba",
    ranges: [
      [0, 1],
      [2, 3],
    ],
  },
  {
    pattern: "a",
    flags: "gy",
    text: "aaba",
    ranges: [
      [0, 1],
      [1, 2],
    ],
  },
  { pattern: "a", flags: "y", text: "ba", ranges: [] },
  { pattern: "z", flags: "g", text: "abc", ranges: [] },
  { pattern: "<b>", flags: "g", text: "<b>hello</b>&amp;", ranges: [[0, 3]] },
];

for (const { pattern, flags, text, ranges } of cases) {
  test(`实际 Worker 保持 /${pattern}/${flags} 的匹配语义，文本 ${JSON.stringify(text)}`, async () => {
    const worker = startWorker();
    try {
      expect(await nextMessage(worker)).toEqual({ type: "ready" });
      const reply = nextMessage(worker);
      worker.postMessage({
        type: "run",
        id: 17,
        input: { pattern, flags, text },
        maxMatches: 1000,
      });
      expect(await reply).toEqual({
        type: "result",
        id: 17,
        matches: ranges.map(([start, end]) => ({ start, end })),
        limited: false,
      });
    } finally {
      await worker.terminate();
    }
  });
}

test("实际 Worker 返回语法错误，下一次请求仍可正常匹配", async () => {
  const worker = startWorker();
  try {
    await nextMessage(worker);
    for (const [id, pattern, flags] of [
      [1, "[", "g"],
      [2, "a", "gg"],
    ] as const) {
      const reply = nextMessage(worker);
      worker.postMessage({
        type: "run",
        id,
        input: { pattern, flags, text: "abc" },
        maxMatches: 1000,
      });
      expect(await reply).toMatchObject({
        type: "error",
        id,
        message: expect.any(String),
      });
    }
    const reply = nextMessage(worker);
    worker.postMessage({
      type: "run",
      id: 3,
      input: { pattern: "a", flags: "g", text: "abc" },
      maxMatches: 1000,
    });
    expect(await reply).toEqual({
      type: "result",
      id: 3,
      matches: [{ start: 0, end: 1 }],
      limited: false,
    });
  } finally {
    await worker.terminate();
  }
});

test("实际 Worker 在 1000 个匹配时停止并标记上限", async () => {
  const worker = startWorker();
  try {
    await nextMessage(worker);
    const reply = nextMessage(worker);
    worker.postMessage({
      type: "run",
      id: 20,
      input: { pattern: "a", flags: "g", text: "a".repeat(2000) },
      maxMatches: 1000,
    });
    const result = await reply;
    expect(result).toMatchObject({ type: "result", id: 20, limited: true });
    if (result.type !== "result") throw new Error("缺少匹配结果");
    expect(result.matches).toHaveLength(1000);
    expect(result.matches.at(-1)).toEqual({ start: 999, end: 1000 });
  } finally {
    await worker.terminate();
  }
});

test("灾难回溯只阻塞 Worker，宿主仍能终止它并启动下一次测试", async () => {
  const worker = startWorker();
  try {
    await nextMessage(worker);
    worker.postMessage({
      type: "run",
      id: 21,
      input: { pattern: "(a+)+$", flags: "g", text: "a".repeat(50_000) + "!" },
      maxMatches: 1000,
    });
    await new Promise(resolve => setTimeout(resolve, 100));
    await worker.terminate();
  } finally {
    await worker.terminate();
  }
  const recovered = startWorker();
  try {
    expect(await nextMessage(recovered)).toEqual({ type: "ready" });
  } finally {
    await recovered.terminate();
  }
});
