// @ts-check

/**
 * @typedef {import("../../lib/regex/runner").RegexMatchRange} MatchRange
 * @typedef {import("../../lib/regex/runner").RegexWorkerRequest} RunRequest
 * @typedef {import("../../lib/regex/runner").RegexWorkerResponse} WorkerResponse
 */

/** @param {WorkerResponse} response */
function respond(response) {
  self.postMessage(response);
}

self.onmessage = event => {
  /** @type {RunRequest} */
  const request = event.data;
  if (request?.type !== "run") return;

  try {
    const { pattern, flags, text } = request.input;
    const regex = new RegExp(pattern, flags);
    const maxMatches = Number.isInteger(request.maxMatches)
      ? Math.max(1, Math.min(1_000, request.maxMatches))
      : 1_000;
    /** @type {MatchRange[]} */
    const matches = [];
    let limited = false;

    if (regex.global) {
      // 原生迭代器按 u/v 语义推进零长度匹配，避免 exec 的空匹配死循环。
      for (const match of text.matchAll(regex)) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
        });
        if (matches.length >= maxMatches) {
          limited = true;
          break;
        }
      }
    } else {
      const match = regex.exec(text);
      if (match) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }

    respond({ type: "result", id: request.id, matches, limited });
  } catch (error) {
    respond({
      type: "error",
      id: request.id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

respond({ type: "ready" });
