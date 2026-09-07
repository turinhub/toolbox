import { expect, test } from "@playwright/test";
import { readQrImageFile } from "../../lib/qr-generator";

class ControlledFileReader {
  static LOADING = 1;
  static instances: ControlledFileReader[] = [];
  readyState = 0;
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  aborted = false;

  constructor() {
    ControlledFileReader.instances.push(this);
  }

  readAsDataURL() {
    this.readyState = 1;
  }

  abort() {
    this.aborted = true;
    this.readyState = 2;
  }

  finish(source: string) {
    this.result = source;
    this.readyState = 2;
    this.onload?.();
  }
}

class ControlledImage {
  static instances: ControlledImage[] = [];
  src = "";
  naturalWidth = 24;
  naturalHeight = 24;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    ControlledImage.instances.push(this);
  }
}

const originalFileReader = Object.getOwnPropertyDescriptor(
  globalThis,
  "FileReader"
);
const originalImage = Object.getOwnPropertyDescriptor(globalThis, "Image");

test.beforeEach(() => {
  ControlledFileReader.instances = [];
  ControlledImage.instances = [];
  Object.defineProperty(globalThis, "FileReader", {
    configurable: true,
    value: ControlledFileReader,
  });
  Object.defineProperty(globalThis, "Image", {
    configurable: true,
    value: ControlledImage,
  });
});

test.afterEach(() => {
  for (const [name, descriptor] of [
    ["FileReader", originalFileReader],
    ["Image", originalImage],
  ] as const) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
});

function startRead(controller = new AbortController()) {
  return readQrImageFile(
    new File(["image bytes"], "center.png", { type: "image/png" }),
    controller.signal
  );
}

test("中心图片必须读取并解码完成后才可使用", async () => {
  const pending = startRead();
  const source = "data:image/png;base64,cG5n";
  let settled = false;
  void pending.then(() => {
    settled = true;
  });
  ControlledFileReader.instances[0].finish(source);
  await Promise.resolve();
  expect(settled).toBe(false);
  expect(ControlledImage.instances[0].src).toBe(source);
  ControlledImage.instances[0].onload?.();
  await expect(pending).resolves.toBe(source);
});

test("文件读取失败向调用方返回错误", async () => {
  const pending = startRead();
  ControlledFileReader.instances[0].onerror?.();
  await expect(pending).rejects.toThrow("could not be read");
  expect(ControlledImage.instances).toHaveLength(0);
});

test("伪装成 PNG 的无效内容在解码失败后被拒绝", async () => {
  const pending = startRead();
  ControlledFileReader.instances[0].finish(
    "data:image/png;base64,bm90LXBuZw=="
  );
  await Promise.resolve();
  ControlledImage.instances[0].onerror?.();
  await expect(pending).rejects.toThrow("could not be decoded");
});

test("取消文件读取会终止 Reader 并移除旧回调", async () => {
  const controller = new AbortController();
  const pending = startRead(controller);
  const reader = ControlledFileReader.instances[0];
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(reader.aborted).toBe(true);
  expect(reader.onload).toBeNull();
  expect(reader.onerror).toBeNull();
  reader.finish("late result");
  expect(ControlledImage.instances).toHaveLength(0);
});

test("取消图片解码会清除旧图片回调且不返回上传成功", async () => {
  const controller = new AbortController();
  const pending = startRead(controller);
  ControlledFileReader.instances[0].finish("data:image/png;base64,cG5n");
  await Promise.resolve();
  const image = ControlledImage.instances[0];
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(image.onload).toBeNull();
  expect(image.onerror).toBeNull();
  expect(image.src).toBe("");
});
