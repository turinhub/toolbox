import { randomUUID } from "crypto";
import type { FtpConfig } from "./types";

type TransferKind = "download" | "upload";

interface TransferTokenPayload {
  kind: TransferKind;
  config: FtpConfig;
  remotePath: string;
  fileName: string;
  fileSize?: number;
  expiresAt: number;
}

const TOKEN_TTL_MS = 5 * 60 * 1000;

type TransferTokenStore = Map<string, TransferTokenPayload>;

const globalStore = globalThis as typeof globalThis & {
  __ftpTransferTokenStore?: TransferTokenStore;
};

function getStore(): TransferTokenStore {
  if (!globalStore.__ftpTransferTokenStore) {
    globalStore.__ftpTransferTokenStore = new Map<
      string,
      TransferTokenPayload
    >();
  }
  return globalStore.__ftpTransferTokenStore;
}

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, payload] of getStore()) {
    if (payload.expiresAt <= now) {
      getStore().delete(token);
    }
  }
}

export function createTransferToken(
  payload: Omit<TransferTokenPayload, "expiresAt">
) {
  cleanupExpiredTokens();
  const token = randomUUID();
  getStore().set(token, {
    ...payload,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

export function consumeTransferToken(
  token: string,
  expectedKind: TransferKind
): TransferTokenPayload | null {
  cleanupExpiredTokens();
  const payload = getStore().get(token);
  if (!payload || payload.kind !== expectedKind) {
    return null;
  }
  getStore().delete(token);
  return payload;
}
