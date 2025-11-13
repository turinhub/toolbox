import { NextRequest, NextResponse } from "next/server";
import { pinyin } from "pinyin-pro";

type ToneStyle = "marks" | "numbers" | "none";

function mapToneStyle(style: ToneStyle): "symbol" | "num" | "none" {
  if (style === "numbers") return "num";
  if (style === "none") return "none";
  return "symbol";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text: string = (body?.text ?? "").toString();
    const options = body?.options ?? {};

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "缺少文本" }, { status: 400 });
    }

    if (text.length > 20000) {
      return NextResponse.json({ error: "文本过长" }, { status: 413 });
    }

    const toneStyle: ToneStyle = options?.toneStyle ?? "marks";
    const separator: string = options?.separator ?? " ";
    const capitalize: boolean = Boolean(options?.capitalize);
    const heteronym: boolean = Boolean(options?.heteronym);

    if (heteronym) {
      const arr = pinyin(text, {
        toneType: mapToneStyle(toneStyle),
        type: "array",
        multiple: true,
        nonZh: "consecutive",
      }) as unknown as (string | string[])[];

      let merged = arr
        .map(item => {
          if (Array.isArray(item)) {
            return item.join("/");
          }
          return item;
        })
        .join(separator);

      if (capitalize) {
        merged = merged
          .split(separator)
          .map(s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s))
          .join(separator);
      }

      return NextResponse.json({ pinyin: merged });
    }

    const result = pinyin(text, {
      toneType: mapToneStyle(toneStyle),
      type: "string",
      separator,
      nonZh: "consecutive",
    }) as string;

    const formatted = capitalize
      ? result
          .split(separator)
          .map(s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s))
          .join(separator)
      : result;

    return NextResponse.json({ pinyin: formatted });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
