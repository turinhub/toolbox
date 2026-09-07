import { expect, test } from "@playwright/test";
import {
  createRegexRunner,
  type RegexInput,
  type RegexRunState,
  type RegexWorkerLike,
  type RegexWorkerRequest,
} from "@/lib/regex/runner";

class FakeClock {
  private time = 0;
  private id = 0;
  private timers = new Map<number, { at: number; callback: () => void }>();

  setTimer = (callback: () => void, delay: number) => {
    const id = ++this.id;
    this.timers.set(id, { at: this.time + delay, callback });
    return id;
  };

  clearTimer = (handle: unknown) => {
    this.timers.delete(handle as number);
  };

  tick(milliseconds: number) {
    const end = this.time + milliseconds;
    for (;;) {
      const next = [...this.timers.entries()]
        .filter(([, timer]) => timer.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      this.time = next[1].at;
      this.timers.delete(next[0]);
      next[1].callback();
    }
    this.time = end;
  }

  get pendingCount() {
    return this.timers.size;
  }
}

class ControlledWorker implements RegexWorkerLike {
  onmessage: Worker["onmessage"] = null;
  onerror: Worker["onerror"] = null;
  terminated = false;
  sent: RegexWorkerRequest[] = [];

  postMessage(message: RegexWorkerRequest) {
    this.sent.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  emit(data: unknown) {
    this.onmessage?.call(
      this as unknown as Worker,
      new MessageEvent("message", { data })
    );
  }
}

function setup() {
  const clock = new FakeClock();
  const workers: ControlledWorker[] = [];
  const states: RegexRunState[] = [];
  const runner = createRegexRunner({
    onState: state => states.push(state),
    createWorker: () => {
      const worker = new ControlledWorker();
      workers.push(worker);
      return worker;
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
  });
  return { clock, workers, states, runner, state: () => states.at(-1)! };
}

const input: RegexInput = { pattern: "a", flags: "g", text: "abc" };

test("250ms 防抖只创建最后一次任务，等待 ready 后再发送输入快照", () => {
  const { runner, workers, clock, state } = setup();
  const changing = { ...input };
  runner.schedule(changing);
  clock.tick(249);
  expect(workers).toHaveLength(0);
  runner.schedule({ ...input, text: "aaa" });
  changing.text = "mutated";
  clock.tick(249);
  expect(workers).toHaveLength(0);
  clock.tick(1);
  expect(workers).toHaveLength(1);
  expect(state().status).toBe("loading");
  expect(workers[0].sent).toEqual([]);
  workers[0].emit({ type: "ready" });
  expect(state().status).toBe("running");
  expect(workers[0].sent).toEqual([
    {
      type: "run",
      id: state().requestId,
      input: { ...input, text: "aaa" },
      maxMatches: 1000,
    },
  ]);
  runner.dispose();
});

test("加载计时与执行计时独立，1秒执行超时终止 Worker 后可以恢复", () => {
  const { runner, workers, clock, state } = setup();
  runner.schedule(input);
  clock.tick(250 + 9_999);
  expect(state().status).toBe("loading");
  workers[0].emit({ type: "ready" });
  clock.tick(999);
  expect(state().status).toBe("running");
  clock.tick(1);
  expect(state()).toMatchObject({ status: "error", code: "timeout" });
  expect(workers[0].terminated).toBe(true);
  expect(clock.pendingCount).toBe(0);

  runner.schedule(input);
  clock.tick(250);
  workers[1].emit({ type: "ready" });
  workers[1].emit({
    type: "result",
    id: state().requestId,
    matches: [{ start: 0, end: 1 }],
    limited: false,
  });
  expect(state()).toMatchObject({
    status: "success",
    matches: [{ start: 0, end: 1 }],
    input,
  });
  expect(workers[1].terminated).toBe(true);
  expect(clock.pendingCount).toBe(0);
  runner.dispose();
});

test("10秒未就绪时报告加载超时，不执行正则", () => {
  const { runner, workers, clock, state } = setup();
  runner.schedule(input);
  clock.tick(250 + 10_000);
  expect(state()).toMatchObject({
    status: "error",
    code: "worker-load-timeout",
  });
  expect(workers[0].sent).toEqual([]);
  expect(workers[0].terminated).toBe(true);
  expect(clock.pendingCount).toBe(0);
  runner.dispose();
});

test("输入变化立即终止旧任务并清空结果，迟到响应不能覆盖当前任务", () => {
  const { runner, workers, clock, state } = setup();
  runner.schedule(input);
  clock.tick(250);
  const oldWorker = workers[0];
  oldWorker.emit({ type: "ready" });
  const oldId = state().requestId;
  const staleCallback = oldWorker.onmessage!;
  runner.schedule({ ...input, text: "xyz" });
  expect(oldWorker.terminated).toBe(true);
  expect(state()).toMatchObject({
    status: "pending",
    input: { ...input, text: "xyz" },
  });
  expect(state()).not.toHaveProperty("matches");

  staleCallback.call(
    oldWorker as unknown as Worker,
    new MessageEvent("message", {
      data: {
        type: "result",
        id: oldId,
        matches: [{ start: 0, end: 1 }],
        limited: false,
      },
    })
  );
  expect(state().status).toBe("pending");
  clock.tick(250);
  workers[1].emit({ type: "ready" });
  workers[1].emit({ type: "result", id: oldId, matches: [], limited: false });
  expect(state().status).toBe("running");
  workers[1].emit({
    type: "result",
    id: state().requestId,
    matches: [],
    limited: false,
  });
  expect(state()).toMatchObject({
    status: "success",
    matches: [],
    input: { ...input, text: "xyz" },
  });
  runner.dispose();
});

test("清空表达式取消匹配且不创建 Worker，卸载会清理全部定时器", () => {
  const { runner, workers, clock, state } = setup();
  runner.schedule(input);
  runner.schedule({ ...input, pattern: "" });
  expect(state().status).toBe("idle");
  clock.tick(20_000);
  expect(workers).toHaveLength(0);

  runner.schedule(input);
  clock.tick(250);
  runner.dispose();
  expect(workers[0].terminated).toBe(true);
  expect(clock.pendingCount).toBe(0);
  runner.schedule(input);
  clock.tick(20_000);
  expect(workers).toHaveLength(1);
});

test("无效响应和正则语法错误没有可复用的旧匹配", () => {
  const { runner, workers, clock, state } = setup();
  runner.schedule(input);
  clock.tick(250);
  workers[0].emit({ type: "ready" });
  workers[0].emit({
    type: "result",
    id: state().requestId,
    matches: [{ start: -1, end: 100 }],
    limited: false,
  });
  expect(state()).toMatchObject({ status: "error", code: "invalid-response" });
  runner.schedule({ ...input, pattern: "[" });
  clock.tick(250);
  workers[1].emit({ type: "ready" });
  workers[1].emit({
    type: "error",
    id: state().requestId,
    message: "Invalid regular expression",
  });
  expect(state()).toMatchObject({
    status: "error",
    code: "invalid-regex",
    message: "Invalid regular expression",
  });
  expect(state()).not.toHaveProperty("matches");
  expect(clock.pendingCount).toBe(0);
  runner.dispose();
});

test("Worker 创建失败可恢复，取消任务不会保留加载计时", () => {
  const clock = new FakeClock();
  const states: RegexRunState[] = [];
  const runner = createRegexRunner({
    onState: state => states.push(state),
    createWorker: () => {
      throw new Error("unavailable");
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
  });
  runner.schedule(input);
  clock.tick(250);
  expect(states.at(-1)).toMatchObject({
    status: "error",
    code: "worker-unavailable",
  });
  expect(clock.pendingCount).toBe(0);
  runner.cancel();
  expect(states.at(-1)?.status).toBe("idle");
  runner.dispose();
});
