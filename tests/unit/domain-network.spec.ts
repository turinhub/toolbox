import { expect, test } from "@playwright/test";
import { mock } from "node:test";
import { EventEmitter } from "node:events";
import dns from "node:dns/promises";
import https from "node:https";
import tls from "node:tls";
import type { ClientRequest, IncomingMessage } from "node:http";
import {
  DomainCheckError,
  normalizeDomainInput,
} from "@/lib/domain-checker/input";
import {
  requestPublicUrl,
  withPublicAddresses,
} from "@/lib/domain-checker/network";
import { checkSsl } from "@/lib/domain-checker/checks";

const addresses = [
  { address: "2606:4700::6812:18e8", family: 6 },
  { address: "104.18.24.232", family: 4 },
];

test.afterEach(() => mock.restoreAll());

test("HTTPS 固定地址回调异步执行，首个地址失败后无需再次 DNS 解析即可回退", async () => {
  const lookup = mock.method(dns, "lookup", async () => addresses);
  const attempted: string[] = [];
  const callbackWasAsync: boolean[] = [];
  mock.method(
    https,
    "request",
    (
      _url: string,
      options: https.RequestOptions,
      onResponse: (response: IncomingMessage) => void
    ) => {
      const req = new EventEmitter() as ClientRequest;
      req.end = (() => req) as ClientRequest["end"];
      req.destroy = ((error?: Error) => {
        if (error) process.nextTick(() => req.emit("error", error));
        return req;
      }) as ClientRequest["destroy"];
      let initialized = false;
      options.lookup!("example.com", {}, (_error, address) => {
        if (typeof address !== "string") {
          req.emit("error", new Error("固定地址 lookup 必须返回单个 IP"));
          return;
        }
        callbackWasAsync.push(initialized);
        attempted.push(address);
        if (address === addresses[0].address) {
          req.emit(
            "error",
            Object.assign(new Error("no route"), { code: "EHOSTUNREACH" })
          );
        } else {
          const response = new EventEmitter() as IncomingMessage;
          response.statusCode = 200;
          response.headers = { "content-type": "text/html" };
          response.destroy = (() => response) as IncomingMessage["destroy"];
          onResponse(response);
        }
      });
      initialized = true;
      return req;
    }
  );
  await expect(
    requestPublicUrl("https://example.com/", { method: "HEAD", timeout: 1000 })
  ).resolves.toMatchObject({ status: 200 });
  expect(callbackWasAsync).toEqual([true, true]);
  expect(attempted).toEqual(addresses.map(item => item.address));
  expect(lookup.mock.callCount()).toBe(1);
});

test("DNS 与各连接尝试共享总超时，并为后续地址保留预算", async () => {
  let now = 10000;
  mock.method(Date, "now", () => now);
  mock.method(dns, "lookup", async () => {
    now += 200;
    return addresses;
  });
  const budgets: number[] = [];
  const result = await withPublicAddresses(
    "example.com",
    1000,
    async (address, timeout) => {
      budgets.push(timeout);
      if (address.family === 6) {
        now += timeout;
        throw new DomainCheckError("timeout");
      }
      return address.address;
    }
  );
  expect(result).toBe(addresses[1].address);
  expect(budgets).toEqual([400, 400]);
});

test("HTTPS 首个连接挂起时销毁超时请求，并继续后续地址", async () => {
  mock.method(dns, "lookup", async () => addresses);
  let requests = 0;
  const cancelled: number[] = [];
  mock.method(
    https,
    "request",
    (
      _url: string,
      _options: https.RequestOptions,
      onResponse: (response: IncomingMessage) => void
    ) => {
      const index = requests++;
      const req = new EventEmitter() as ClientRequest;
      req.end = (() => {
        if (index === 1) {
          process.nextTick(() => {
            const response = new EventEmitter() as IncomingMessage;
            response.statusCode = 200;
            response.headers = {};
            response.destroy = (() => response) as IncomingMessage["destroy"];
            onResponse(response);
          });
        }
        return req;
      }) as ClientRequest["end"];
      req.destroy = ((error?: Error) => {
        cancelled.push(index);
        process.nextTick(() => req.emit("error", error));
        return req;
      }) as ClientRequest["destroy"];
      return req;
    }
  );
  await expect(
    requestPublicUrl("https://example.com/", { method: "HEAD", timeout: 200 })
  ).resolves.toMatchObject({ status: 200 });
  expect(requests).toBe(2);
  expect(cancelled).toEqual([0]);
});

test("混合公网与私网解析禁止所有连接，响应数据错误不会触发地址重试", async () => {
  const lookup = mock.method(dns, "lookup", async () => [
    ...addresses,
    { address: "127.0.0.1", family: 4 },
  ]);
  const attempt = mock.fn(async () => "unexpected");
  await expect(
    withPublicAddresses("example.com", 1000, attempt)
  ).rejects.toMatchObject({ code: "blockedAddress" });
  expect(attempt.mock.callCount()).toBe(0);
  lookup.mock.mockImplementation(async () => addresses);
  const invalid = mock.fn(async () => {
    throw new DomainCheckError("invalidResponse");
  });
  await expect(
    withPublicAddresses("example.com", 1000, invalid)
  ).rejects.toMatchObject({ code: "invalidResponse" });
  expect(invalid.mock.callCount()).toBe(1);
});

test("TLS 首个地址连接失败时回退到后续地址，并清理所有 socket", async () => {
  mock.method(dns, "lookup", async () => addresses);
  const attempted: string[] = [];
  const destroyed: string[] = [];
  mock.method(tls, "connect", (options: tls.ConnectionOptions) => {
    const host = options.host!;
    attempted.push(host);
    const socket = Object.assign(new EventEmitter(), {
      authorized: true,
      destroy: () => {
        destroyed.push(host);
      },
      getPeerCertificate: () => ({
        raw: Buffer.from("certificate"),
        subject: { CN: "example.com" },
        issuer: { O: "Test CA" },
        subjectaltname: "DNS:example.com",
        valid_from: "Jan 1 00:00:00 2020 GMT",
        valid_to: "Jan 1 00:00:00 2120 GMT",
      }),
      getProtocol: () => "TLSv1.3",
      getCipher: () => ({ name: "TLS_AES_256_GCM_SHA384" }),
    });
    process.nextTick(() =>
      socket.emit(
        host === addresses[0].address ? "error" : "secureConnect",
        new Error("no route")
      )
    );
    return socket as unknown as tls.TLSSocket;
  });
  await expect(
    checkSsl(normalizeDomainInput("example.com"))
  ).resolves.toMatchObject({
    status: "success",
    data: { valid: true, protocol: "TLSv1.3" },
  });
  expect(attempted).toEqual(addresses.map(item => item.address));
  expect(destroyed).toEqual(attempted);
});
