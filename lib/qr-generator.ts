export interface QrRenderOptions {
  content: string;
  size: number;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  centerImage: string | null;
  centerImageSize: number;
}

function abortError() {
  return new DOMException("Operation cancelled", "AbortError");
}

function checkAbort(signal: AbortSignal) {
  if (signal.aborted) throw abortError();
}

function loadImage(source: string, signal: AbortSignal) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }

    const image = new Image();
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      image.src = "";
      reject(abortError());
    };
    image.onload = () => {
      cleanup();
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        resolve(image);
      } else {
        reject(new Error("Invalid image dimensions"));
      }
    };
    image.onerror = () => {
      cleanup();
      reject(new Error("Image could not be decoded"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    image.src = source;
  });
}

export async function readQrImageFile(file: File, signal: AbortSignal) {
  const source = await new Promise<string>((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }

    const reader = new FileReader();
    const cleanup = () => {
      reader.onload = null;
      reader.onerror = null;
      signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      if (reader.readyState === FileReader.LOADING) reader.abort();
      reject(abortError());
    };
    reader.onload = () => {
      cleanup();
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Image file could not be read"));
      }
    };
    reader.onerror = () => {
      cleanup();
      reject(new Error("Image file could not be read"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });

  await loadImage(source, signal);
  checkAbort(signal);
  return source;
}

export async function renderQrCode(
  options: QrRenderOptions,
  signal: AbortSignal
) {
  checkAbort(signal);
  const QRCode = (await import("qrcode")).default;
  checkAbort(signal);

  // 每次生成使用独立 canvas，避免旧异步任务覆盖新结果。
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, options.content, {
    width: options.size,
    errorCorrectionLevel: options.errorCorrectionLevel,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  checkAbort(signal);

  if (options.centerImage) {
    const image = await loadImage(options.centerImage, signal);
    checkAbort(signal);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context is unavailable");

    const imageSize = (canvas.width * options.centerImageSize) / 100;
    const x = (canvas.width - imageSize) / 2;
    const y = (canvas.height - imageSize) / 2;
    context.fillStyle = "white";
    context.fillRect(x - 12, y - 12, imageSize + 24, imageSize + 24);
    context.drawImage(image, x, y, imageSize, imageSize);
  }

  checkAbort(signal);
  return canvas.toDataURL("image/png");
}
