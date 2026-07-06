import { CSSProperties } from "react";

export type ThemeType = "classic" | "elegant" | "simple";
export type FontType = "sans" | "serif" | "mono";
export type FontSizeLevel = "xs" | "sm" | "md" | "lg" | "xl";
export type FigcaptionType =
  | "title"
  | "alt"
  | "title_only"
  | "alt_only"
  | "none";

export interface MarkdownConfig {
  themeType: ThemeType;
  fontType: FontType;
  fontSizeLevel: FontSizeLevel;
  primaryColor: string;
  customPrimaryColor: string;
  codeTheme: string;
  figcaptionType: FigcaptionType;
  macCodeBlock: boolean;
  codeLineNumber: boolean;
  wechatLink: boolean;
  indent: boolean;
  justify: boolean;
}

export interface Theme {
  name: string;
  styles: {
    h1?: CSSProperties;
    h2?: CSSProperties;
    h3?: CSSProperties;
    h4?: CSSProperties;
    h5?: CSSProperties;
    h6?: CSSProperties;
    p?: CSSProperties;
    blockquote?: CSSProperties;
    code?: CSSProperties;
    pre?: CSSProperties;
    ul?: CSSProperties;
    ol?: CSSProperties;
    li?: CSSProperties;
    a?: CSSProperties;
    strong?: CSSProperties;
    em?: CSSProperties;
    img?: CSSProperties;
    hr?: CSSProperties;
    table?: CSSProperties;
    th?: CSSProperties;
    td?: CSSProperties;
    container?: CSSProperties;
    figcaption?: CSSProperties;
    figure?: CSSProperties;
  };
}
