export const REGEX_DEBOUNCE_MS = 250;
export const REGEX_EXECUTION_TIMEOUT_MS = 1_000;
export const REGEX_WORKER_LOAD_TIMEOUT_MS = 10_000;
export const REGEX_MAX_MATCHES = 1_000;
export const REGEX_MATCH_PAGE_SIZE = 50;

export interface RegexInput {
  pattern: string;
  flags: string;
  text: string;
}

export interface RegexMatchRange {
  start: number;
  end: number;
}

export type RegexErrorCode =
  | "invalid-regex"
  | "timeout"
  | "worker-load-timeout"
  | "worker-error"
  | "worker-unavailable"
  | "invalid-response";

interface RegexStateBase {
  requestId: number;
  input: RegexInput;
}

export type RegexRunState = RegexStateBase &
  (
    | { status: "idle" | "pending" | "loading" | "running" }
    | {
        status: "success";
        matches: RegexMatchRange[];
        limited: boolean;
      }
    | { status: "error"; code: RegexErrorCode; message?: string }
  );

export interface RegexWorkerRequest {
  type: "run";
  id: number;
  input: RegexInput;
  maxMatches: number;
}

export type RegexWorkerResponse =
  | { type: "ready" }
  | {
      type: "result";
      id: number;
      matches: RegexMatchRange[];
      limited: boolean;
    }
  | { type: "error"; id: number; message: string };

export type RegexWorkerLike = Pick<
  Worker,
  "onmessage" | "onerror" | "postMessage" | "terminate"
>;

export interface RegexRunnerOptions {
  onState: (state: RegexRunState) => void;
  createWorker?: () => RegexWorkerLike;
  setTimer?: (callback: () => void, milliseconds: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export interface RegexRunner {
  schedule: (input: RegexInput) => void;
  cancel: () => void;
  dispose: () => void;
}

function isMatchRanges(
  value: unknown,
  textLength: number
): value is RegexMatchRange[] {
  if (!Array.isArray(value) || value.length > REGEX_MAX_MATCHES) return false;

  let previousEnd = 0;
  return value.every(range => {
    if (
      !range ||
      !Number.isInteger(range.start) ||
      !Number.isInteger(range.end) ||
      range.start < previousEnd ||
      range.end < range.start ||
      range.end > textLength
    ) {
      return false;
    }
    previousEnd = range.end;
    return true;
  });
}

// 执行与加载分别计时；主线程只负责生命周期，不编译或执行用户正则。
export function createRegexRunner(options: RegexRunnerOptions): RegexRunner {
  const createWorker =
    options.createWorker ?? (() => new Worker("/workers/regex.worker.js"));
  const setTimer =
    options.setTimer ??
    ((callback: () => void, milliseconds: number) =>
      setTimeout(callback, milliseconds));
  const clearTimer =
    options.clearTimer ??
    ((handle: unknown) =>
      clearTimeout(handle as ReturnType<typeof setTimeout>));

  let requestId = 0;
  let disposed = false;
  let currentInput: RegexInput = { pattern: "", flags: "g", text: "" };
  let worker: RegexWorkerLike | null = null;
  let debounceTimer: unknown;
  let loadTimer: unknown;
  let executionTimer: unknown;

  const stopActive = () => {
    for (const handle of [debounceTimer, loadTimer, executionTimer]) {
      if (handle !== undefined) clearTimer(handle);
    }
    debounceTimer = undefined;
    loadTimer = undefined;
    executionTimer = undefined;
    if (worker) {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
      worker = null;
    }
  };

  const start = (input: RegexInput, id: number) => {
    if (disposed || id !== requestId) return;

    options.onState({ status: "loading", requestId: id, input });
    try {
      worker = createWorker();
    } catch {
      options.onState({
        status: "error",
        requestId: id,
        input,
        code: "worker-unavailable",
      });
      return;
    }

    const activeWorker = worker;
    let ready = false;
    const isCurrent = () =>
      !disposed && id === requestId && activeWorker === worker;
    const fail = (code: RegexErrorCode, message?: string) => {
      if (!isCurrent()) return;
      stopActive();
      options.onState({ status: "error", requestId: id, input, code, message });
    };

    activeWorker.onerror = event => {
      event.preventDefault();
      fail("worker-error");
    };
    activeWorker.onmessage = event => {
      if (!isCurrent()) return;
      const data: unknown = event.data;
      if (!data || typeof data !== "object" || !("type" in data)) {
        fail("invalid-response");
        return;
      }

      if (data.type === "ready") {
        if (ready) return;
        ready = true;
        if (loadTimer !== undefined) clearTimer(loadTimer);
        loadTimer = undefined;
        options.onState({ status: "running", requestId: id, input });
        executionTimer = setTimer(
          () => fail("timeout"),
          REGEX_EXECUTION_TIMEOUT_MS
        );
        try {
          activeWorker.postMessage({
            type: "run",
            id,
            input,
            maxMatches: REGEX_MAX_MATCHES,
          } satisfies RegexWorkerRequest);
        } catch {
          fail("worker-error");
        }
        return;
      }

      if (!("id" in data) || data.id !== id) return;
      if (!ready) {
        fail("invalid-response");
        return;
      }
      if (data.type === "error" && "message" in data) {
        fail(
          "invalid-regex",
          typeof data.message === "string" ? data.message : undefined
        );
        return;
      }
      if (
        data.type === "result" &&
        "matches" in data &&
        isMatchRanges(data.matches, input.text.length) &&
        "limited" in data &&
        typeof data.limited === "boolean"
      ) {
        stopActive();
        options.onState({
          status: "success",
          requestId: id,
          input,
          matches: data.matches,
          limited: data.limited,
        });
        return;
      }
      fail("invalid-response");
    };
    loadTimer = setTimer(
      () => fail("worker-load-timeout"),
      REGEX_WORKER_LOAD_TIMEOUT_MS
    );
  };

  return {
    schedule(input) {
      if (disposed) return;
      const id = ++requestId;
      stopActive();
      currentInput = { ...input };
      const snapshot = currentInput;
      options.onState({
        status: input.pattern ? "pending" : "idle",
        requestId: id,
        input: snapshot,
      });
      if (!input.pattern) return;
      debounceTimer = setTimer(() => {
        debounceTimer = undefined;
        start(snapshot, id);
      }, REGEX_DEBOUNCE_MS);
    },
    cancel() {
      if (disposed) return;
      requestId += 1;
      stopActive();
      options.onState({ status: "idle", requestId, input: currentInput });
    },
    dispose() {
      disposed = true;
      requestId += 1;
      stopActive();
    },
  };
}
