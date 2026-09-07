import { expect, test } from "@playwright/test";
import {
  addJsonProperty,
  appendJsonValue,
  deleteJsonValue,
  getJsonValue,
  parseJson,
  parseJsonValue,
  updateJsonValue,
  type JsonPath,
  type JsonValue,
  type JsonValueType,
} from "@/lib/json-editor";

function freezeJson<T extends JsonValue>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freezeJson);
    Object.freeze(value);
  }
  return value;
}

test.describe("JSON editor data integrity", () => {
  test("reads, edits, appends, and removes root array items without changing the source", () => {
    const source = freezeJson([1, "remove", false, null]);

    expect(getJsonValue(source, [])).toEqual([1, "remove", false, null]);
    expect(getJsonValue(source, [2])).toBe(false);

    const edited = updateJsonValue(source, [0], 2);
    const appended = appendJsonValue(edited, [], { keep: [true] });
    const removed = deleteJsonValue(appended, [1]);

    expect(edited).toEqual([2, "remove", false, null]);
    expect(appended).toEqual([2, "remove", false, null, { keep: [true] }]);
    expect(removed).toEqual([2, false, null, { keep: [true] }]);
    expect(Array.isArray(removed)).toBe(true);
    expect(JSON.parse(JSON.stringify(removed))).toEqual(removed);
    expect(source).toEqual([1, "remove", false, null]);
  });

  test("preserves nested arrays and all untouched JSON types through successive changes", () => {
    const source = freezeJson({
      groups: [{ items: [1, { enabled: false }, "remove"] }],
      untouched: { text: "001", number: 0, flag: true, nothing: null },
    });

    expect(getJsonValue(source, ["groups", 0, "items", 1, "enabled"])).toBe(
      false
    );
    const edited = updateJsonValue(
      source,
      ["groups", 0, "items", 1, "enabled"],
      true
    );
    const appended = appendJsonValue(edited, ["groups", 0, "items"], [2, null]);
    const removed = deleteJsonValue(appended, ["groups", 0, "items", 2]);

    expect(removed).toEqual({
      groups: [{ items: [1, { enabled: true }, [2, null]] }],
      untouched: { text: "001", number: 0, flag: true, nothing: null },
    });
    expect(Array.isArray(getJsonValue(removed, ["groups"]))).toBe(true);
    expect(Array.isArray(getJsonValue(removed, ["groups", 0, "items"]))).toBe(
      true
    );
    expect(source.groups[0].items).toEqual([1, { enabled: false }, "remove"]);
    expect(getJsonValue(edited, ["groups", 0, "items"])).toEqual([
      1,
      { enabled: true },
      "remove",
    ]);
  });

  test("treats dotted, empty, and numeric object keys as literal keys", () => {
    const source = freezeJson({
      "a.b": { "": [1, "remove"] },
      a: { b: "separate" },
      "": { "0": false },
    });

    expect(getJsonValue(source, ["a.b", "", 0])).toBe(1);
    expect(getJsonValue(source, ["", "0"])).toBe(false);
    const edited = updateJsonValue(source, ["a.b", "", 0], 2);
    const appended = appendJsonValue(edited, ["a.b", ""], null);
    const removed = deleteJsonValue(appended, ["a.b", "", 1]);
    const added = addJsonProperty(removed, [""], "new.key", [true]);

    expect(added).toEqual({
      "a.b": { "": [2, null] },
      a: { b: "separate" },
      "": { "0": false, "new.key": [true] },
    });
    expect(source).toEqual({
      "a.b": { "": [1, "remove"] },
      a: { b: "separate" },
      "": { "0": false },
    });
  });

  test("adds and deletes empty object keys without confusing them with the root", () => {
    const source = freezeJson({ keep: [false] });
    const added = addJsonProperty(source, [], "", { "a.b": null });

    expect(getJsonValue(added, [""])).toEqual({ "a.b": null });
    expect(deleteJsonValue(added, [""])).toEqual({ keep: [false] });
    expect(added).toEqual({ keep: [false], "": { "a.b": null } });
    expect(source).toEqual({ keep: [false] });
  });

  test("keeps __proto__ as JSON data without changing object prototypes", () => {
    const source = freezeJson(parseJson('{"__proto__":{"keep":1}}'));
    const edited = updateJsonValue(source, ["__proto__", "keep"], 2);
    const added = addJsonProperty({}, [], "__proto__", { data: true });

    expect(getJsonValue(edited, ["__proto__", "keep"])).toBe(2);
    expect(JSON.stringify(source)).toBe('{"__proto__":{"keep":1}}');
    expect(JSON.stringify(added)).toBe('{"__proto__":{"data":true}}');
    expect(Object.getPrototypeOf(added)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(edited)).toBe(Object.prototype);
    expect(Object.prototype).not.toHaveProperty("data");
  });

  test("supports replacing a primitive or collection root", () => {
    expect(updateJsonValue(null, [], [false, null, 2])).toEqual([
      false,
      null,
      2,
    ]);
    expect(updateJsonValue([1, 2], [], "text")).toBe("text");
    expect(updateJsonValue("text", [], { value: false })).toEqual({
      value: false,
    });
  });

  test("rejects invalid paths without inventing keys or mutating the document", () => {
    const source = freezeJson({ items: [1, { active: false }], primitive: 2 });
    const invalidPaths: JsonPath[] = [
      ["missing"],
      ["missing", "child"],
      ["primitive", "child"],
      ["items", -1],
      ["items", 2],
      ["items", 0.5],
      ["items", "0"],
      [0],
      ["toString"],
      ["__proto__"],
    ];

    for (const path of invalidPaths) {
      expect(() => getJsonValue(source, path)).toThrow();
      expect(() => updateJsonValue(source, path, "changed")).toThrow();
      expect(() => deleteJsonValue(source, path)).toThrow();
    }

    expect(() => deleteJsonValue(source, [])).toThrow();
    expect(() => appendJsonValue(source, ["primitive"], 3)).toThrow();
    expect(() => addJsonProperty(source, ["items"], "extra", 3)).toThrow();
    expect(() => addJsonProperty(source, [], "primitive", 3)).toThrow();
    expect(source).toEqual({ items: [1, { active: false }], primitive: 2 });
  });
});

test.describe("JSON editor value parsing", () => {
  const validValues: {
    type: JsonValueType;
    input: string;
    expected: JsonValue;
  }[] = [
    { type: "string", input: " 001 ", expected: " 001 " },
    { type: "string", input: "", expected: "" },
    { type: "number", input: "0", expected: 0 },
    { type: "number", input: "-1.25e2", expected: -125 },
    { type: "boolean", input: "false", expected: false },
    { type: "boolean", input: "true", expected: true },
    { type: "null", input: "", expected: null },
    { type: "null", input: "null", expected: null },
    {
      type: "array",
      input: '[0,false,null,"1"]',
      expected: [0, false, null, "1"],
    },
    {
      type: "object",
      input: '{"a.b":{"":[]}}',
      expected: { "a.b": { "": [] } },
    },
  ];

  for (const { type, input, expected } of validValues) {
    test(`preserves ${type} value ${JSON.stringify(input)}`, () => {
      expect(parseJsonValue(input, type)).toEqual(expected);
    });
  }

  test("rejects invalid or mismatched typed values instead of saving fallback data", () => {
    const source = freezeJson({ value: 12, enabled: false, items: [1] });
    const invalidValues: { type: JsonValueType; input: string }[] = [
      { type: "number", input: "12oops" },
      { type: "number", input: "" },
      { type: "number", input: "NaN" },
      { type: "number", input: "Infinity" },
      { type: "number", input: "1e400" },
      { type: "number", input: "01" },
      { type: "number", input: '"12"' },
      { type: "boolean", input: "yes" },
      { type: "boolean", input: "0" },
      { type: "boolean", input: '"false"' },
      { type: "array", input: "[1," },
      { type: "array", input: "{}" },
      { type: "object", input: '{"key":}' },
      { type: "object", input: "[]" },
      { type: "object", input: "null" },
      { type: "null", input: "false" },
    ];

    for (const { input, type } of invalidValues) {
      expect(() =>
        updateJsonValue(source, ["value"], parseJsonValue(input, type))
      ).toThrow();
    }

    expect(source).toEqual({ value: 12, enabled: false, items: [1] });
  });

  test("imports every JSON root type and rejects malformed or non-finite data", () => {
    const values: JsonValue[] = [
      null,
      false,
      0,
      "text",
      [],
      [1, { "a.b": false }],
      { "": [null] },
    ];
    for (const value of values) {
      expect(parseJson(JSON.stringify(value))).toEqual(value);
    }

    for (const input of [
      "",
      "undefined",
      "{",
      "[1,]",
      "1e400",
      '{"n":1e400}',
    ]) {
      expect(() => parseJson(input)).toThrow();
    }
  });
});
