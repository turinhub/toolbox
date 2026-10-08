import {
  DomainCheckError,
  getDomainErrorCode,
  normalizeDomainInput,
} from "@/lib/domain-checker/input";
import {
  requestPublicUrl,
  type PublicRequest,
} from "@/lib/domain-checker/network";
import {
  SECURITY_HEADERS,
  type CheckResult,
  type DomainTarget,
  type HttpInfo,
} from "@/lib/domain-checker/types";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const DISPLAY_HEADERS = [
  "server",
  "content-type",
  "cache-control",
  ...SECURITY_HEADERS,
];

export async function checkHttp(
  target: DomainTarget,
  request: PublicRequest = requestPublicUrl
): Promise<CheckResult<HttpInfo>> {
  const started = Date.now();
  const deadline = started + 15000;
  const data: HttpInfo = { responseTime: 0, hops: [], headers: {} };
  const seen = new Set<string>();
  let currentUrl = target.url;
  try {
    for (let hop = 0; hop <= 5; hop++) {
      if (seen.has(currentUrl)) throw new DomainCheckError("redirectLoop");
      seen.add(currentUrl);
      let method: "HEAD" | "GET" = "HEAD";
      const remaining = () => {
        const time = deadline - Date.now();
        if (time <= 0) throw new DomainCheckError("timeout");
        return time;
      };
      let response = await request(currentUrl, {
        method,
        timeout: remaining(),
      });
      let responseTime = response.responseTime;
      if (response.status === 405 || response.status === 501) {
        method = "GET";
        response = await request(currentUrl, { method, timeout: remaining() });
        responseTime += response.responseTime;
      }
      data.hops.push({
        url: currentUrl,
        status: response.status,
        responseTime,
        method,
        location: response.headers.location,
      });
      data.httpStatus = response.status;
      data.finalUrl = currentUrl;
      data.headers = Object.fromEntries(
        DISPLAY_HEADERS.flatMap(name =>
          response.headers[name]
            ? [[name, response.headers[name].slice(0, 2048)]]
            : []
        )
      );
      if (
        !REDIRECT_STATUSES.has(response.status) ||
        !response.headers.location
      ) {
        data.responseTime = Date.now() - started;
        return { status: "success", data };
      }
      if (hop === 5) throw new DomainCheckError("tooManyRedirects");
      currentUrl = normalizeDomainInput(
        new URL(response.headers.location, currentUrl).toString()
      ).url;
    }
    throw new DomainCheckError("tooManyRedirects");
  } catch (error) {
    data.responseTime = Date.now() - started;
    return { status: "error", data, error: getDomainErrorCode(error) };
  }
}
