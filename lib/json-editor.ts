export type JsonValue =
  string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonPath = readonly (string | number)[];
export type JsonValueType =
  "string" | "number" | "boolean" | "null" | "object" | "array";

export const jsonPathKey = (path: JsonPath): string => JSON.stringify(path);

function readChild(container: JsonValue, key: string | number): JsonValue {
  if (Array.isArray(container)) {
    if (
      typeof key !== "number" ||
      !Number.isInteger(key) ||
      key < 0 ||
      key >= container.length ||
      !Object.prototype.hasOwnProperty.call(container, key)
    ) {
      throw new Error("Invalid array index");
    }
    return container[key];
  }

  if (
    container === null ||
    typeof container !== "object" ||
    typeof key !== "string" ||
    !Object.prototype.hasOwnProperty.call(container, key)
  ) {
    throw new Error("Invalid object path");
  }
  return container[key];
}

export function getJsonValue(root: JsonValue, path: JsonPath): JsonValue {
  return path.reduce<JsonValue>((value, key) => readChild(value, key), root);
}

export function updateJsonValue(
  root: JsonValue,
  path: JsonPath,
  value: JsonValue
): JsonValue {
  if (path.length === 0) return value;

  const [key, ...remaining] = path;
  const child = readChild(root, key);
  const updatedChild = updateJsonValue(child, remaining, value);

  if (Array.isArray(root)) {
    const updated = [...root];
    updated[key as number] = updatedChild;
    return updated;
  }

  // 计算属性名始终创建数据属性，避免 __proto__ 被当作原型设置器。
  return { ...(root as JsonObject), [key]: updatedChild };
}

export function deleteJsonValue(root: JsonValue, path: JsonPath): JsonValue {
  if (path.length === 0) throw new Error("Cannot delete the root value");

  const parentPath = path.slice(0, -1);
  const parent = getJsonValue(root, parentPath);
  const key = path[path.length - 1];
  readChild(parent, key);

  if (Array.isArray(parent)) {
    const updated = [...parent];
    updated.splice(key as number, 1);
    return updateJsonValue(root, parentPath, updated);
  }

  const updated = { ...(parent as JsonObject) };
  delete updated[key];
  return updateJsonValue(root, parentPath, updated);
}

export function appendJsonValue(
  root: JsonValue,
  path: JsonPath,
  value: JsonValue
): JsonValue {
  const target = getJsonValue(root, path);
  if (!Array.isArray(target)) throw new Error("Expected an array");
  return updateJsonValue(root, path, [...target, value]);
}

export function addJsonProperty(
  root: JsonValue,
  path: JsonPath,
  key: string,
  value: JsonValue
): JsonValue {
  const target = getJsonValue(root, path);
  if (target === null || typeof target !== "object" || Array.isArray(target)) {
    throw new Error("Expected an object");
  }
  if (Object.prototype.hasOwnProperty.call(target, key)) {
    throw new Error("The property already exists");
  }
  return updateJsonValue(root, path, { ...target, [key]: value });
}

export function parseJson(input: string): JsonValue {
  return JSON.parse(input, (_key, value: unknown) => {
    // JSON.parse 会将超出范围的数字解析为 Infinity，导出时却变成 null。
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error("Expected a finite JSON number");
    }
    return value;
  }) as JsonValue;
}

export function parseJsonValue(input: string, type: JsonValueType): JsonValue {
  if (type === "string") return input;
  if (type === "null" && !input.trim()) return null;

  const parsed = parseJson(input);
  const actualType =
    parsed === null ? "null" : Array.isArray(parsed) ? "array" : typeof parsed;
  if (actualType !== type) throw new Error(`Expected a JSON ${type}`);
  return parsed;
}
