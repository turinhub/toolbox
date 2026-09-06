import { z } from "zod";

const STORAGE_KEY = "docker-registry-configs";
// 只持久化明确允许的字段，同时剔除旧配置中的密码。
const savedConfigsSchema = z.array(
  z.object({
    name: z.string(),
    config: z.object({ url: z.string(), username: z.string().optional() }),
  })
);

export type SavedRegistryConfig = z.infer<typeof savedConfigsSchema>[number];
type ConfigStorage = Pick<Storage, "getItem" | "setItem">;

export function readRegistryConfigs(storage: ConfigStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  const configs = savedConfigsSchema.parse(JSON.parse(raw));
  const sanitized = JSON.stringify(configs);
  if (sanitized !== raw) storage.setItem(STORAGE_KEY, sanitized);
  return configs;
}

export function writeRegistryConfigs(
  storage: ConfigStorage,
  configs: SavedRegistryConfig[]
) {
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify(savedConfigsSchema.parse(configs))
  );
}
