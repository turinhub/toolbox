import { MarkdownConfig, Theme, ThemeType } from "../types";

export const PRESET_COLORS = [
  { label: "经典蓝", value: "#1e80ff" }, // 掘金蓝
  { label: "翡翠绿", value: "#00965e" }, // 微信绿
  { label: "活力橘", value: "#ff9100" },
  { label: "柠檬黄", value: "#f1c40f" },
  { label: "薰衣紫", value: "#be63f9" },
  { label: "天空蓝", value: "#3498db" },
  { label: "玫瑰金", value: "#e056fd" },
  { label: "橄榄绿", value: "#badc58" },
  { label: "石墨黑", value: "#2d3436" },
  { label: "雾霾灰", value: "#7f8c8d" },
  { label: "樱花粉", value: "#ff7979" },
];

const FONT_SIZES = {
  xs: "14px",
  sm: "15px",
  md: "16px",
  lg: "17px",
  xl: "18px",
};

const FONT_FAMILIES = {
  sans: '-apple-system-font, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  serif:
    "Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, 'PingFang SC', Cambria, Cochin, Georgia, Times, 'Times New Roman', serif",
  mono: "Menlo, Monaco, Consolas, 'Courier New', monospace",
};

const CODE_THEMES: Record<string, { backgroundColor: string; color: string }> =
  {
    "github-dark": { backgroundColor: "#282c34", color: "#abb2bf" },
    "github-light": { backgroundColor: "#f6f8fa", color: "#24292e" },
    monokai: { backgroundColor: "#272822", color: "#f8f8f2" },
    "solarized-dark": { backgroundColor: "#002b36", color: "#839496" },
  };

export const defaultConfig: MarkdownConfig = {
  themeType: "classic",
  fontType: "sans",
  fontSizeLevel: "md",
  primaryColor: "#1e80ff",
  customPrimaryColor: "",
  codeTheme: "github-dark",
  figcaptionType: "title",
  macCodeBlock: true,
  codeLineNumber: false,
  wechatLink: false,
  indent: false,
  justify: true,
};

export function generateTheme(config: MarkdownConfig): Theme {
  const primaryColor = config.customPrimaryColor || config.primaryColor;
  const fontSize = FONT_SIZES[config.fontSizeLevel];
  const fontFamily = FONT_FAMILIES[config.fontType];
  const codeTheme = CODE_THEMES[config.codeTheme] || CODE_THEMES["github-dark"];

  const baseTheme: Theme = {
    name: "Generated Theme",
    styles: {
      container: {
        fontFamily,
        fontSize,
        lineHeight: "1.75",
        color: "#333",
        textAlign: config.justify ? "justify" : "left",
      },
      p: {
        margin: "1.5em 0",
        lineHeight: "1.75",
        letterSpacing: "0.05em",
        wordSpacing: "0.05em",
        textAlign: config.justify ? "justify" : "left",
        textIndent: config.indent ? "2em" : "0",
      },
      h1: {
        fontSize: "1.6em",
        fontWeight: "bold",
        marginTop: "1.5em",
        marginBottom: "1em",
        color: primaryColor,
      },
      h2: {
        fontSize: "1.4em",
        fontWeight: "bold",
        marginTop: "1.4em",
        marginBottom: "0.8em",
        color: primaryColor,
      },
      h3: {
        fontSize: "1.2em",
        fontWeight: "bold",
        marginTop: "1.3em",
        marginBottom: "0.6em",
        color: primaryColor,
      },
      h4: {
        fontSize: "1.1em",
        fontWeight: "bold",
        marginTop: "1.2em",
        marginBottom: "0.5em",
        color: primaryColor,
      },
      blockquote: {
        margin: "1.5em 0",
        padding: "1em",
        color: "#666",
        borderLeft: `4px solid ${primaryColor}`,
        backgroundColor: "#f8f9fa",
        borderRadius: "4px",
      },
      ul: {
        paddingLeft: "2em",
        margin: "1em 0",
      },
      ol: {
        paddingLeft: "2em",
        margin: "1em 0",
      },
      li: {
        margin: "0.5em 0",
        lineHeight: "1.75",
      },
      a: {
        color: primaryColor,
        textDecoration: "none",
        borderBottom: `1px solid ${primaryColor}`,
      },
      strong: {
        color: primaryColor,
        fontWeight: "bold",
      },
      em: {
        fontStyle: "italic",
        color: primaryColor,
      },
      img: {
        display: "block",
        maxWidth: "100%",
        margin: "1em auto",
        borderRadius: "4px",
      },
      hr: {
        border: "none",
        height: "1px",
        backgroundColor: "#ddd",
        margin: "2em 0",
      },
      code: {
        fontFamily: FONT_FAMILIES.mono,
        fontSize: "0.9em",
        padding: "0.2em 0.4em",
        borderRadius: "3px",
        backgroundColor: "#fff5f5",
        color: "#ff502c",
        margin: "0 2px",
      },
      pre: {
        fontFamily: FONT_FAMILIES.mono,
        fontSize: "14px",
        lineHeight: "1.5",
        padding: "1em",
        backgroundColor: codeTheme.backgroundColor,
        color: codeTheme.color,
        borderRadius: "8px",
        overflowX: "auto",
        margin: "1.5em 0",
      },
      table: {
        width: "100%",
        borderCollapse: "collapse",
        margin: "1em 0",
        fontSize: "0.9em",
      },
      th: {
        padding: "0.5em",
        backgroundColor: "#f8f9fa",
        border: "1px solid #ddd",
        fontWeight: "bold",
      },
      td: {
        padding: "0.5em",
        border: "1px solid #ddd",
      },
      figcaption: {
        textAlign: "center",
        color: "#999",
        fontSize: "0.8em",
        marginTop: "0.5em",
      },
      figure: {
        margin: "1.5em 0",
      },
    },
  };

  // Apply theme-specific overrides
  if (config.themeType === "classic") {
    baseTheme.styles.h1 = {
      ...baseTheme.styles.h1,
      textAlign: "center",
      borderBottom: `2px solid ${primaryColor}`,
      paddingBottom: "0.5em",
    };
    baseTheme.styles.h2 = {
      ...baseTheme.styles.h2,
      borderLeft: `5px solid ${primaryColor}`,
      paddingLeft: "0.5em",
    };
  } else if (config.themeType === "elegant") {
    baseTheme.styles.h1 = {
      ...baseTheme.styles.h1,
      textAlign: "center",
      color: primaryColor,
      borderBottom: "none",
    };
    baseTheme.styles.h2 = {
      ...baseTheme.styles.h2,
      textAlign: "center",
      borderBottom: `1px solid ${primaryColor}`,
      paddingBottom: "0.3em",
      display: "table",
      margin: "2em auto 1em",
      borderLeft: "none",
      paddingLeft: "0",
    };
    baseTheme.styles.blockquote = {
      ...baseTheme.styles.blockquote,
      borderLeft: "none",
      borderTop: `2px solid ${primaryColor}`,
      borderBottom: `2px solid ${primaryColor}`,
      backgroundColor: "transparent",
      fontStyle: "italic",
    };
  } else if (config.themeType === "simple") {
    baseTheme.styles.h1 = {
      ...baseTheme.styles.h1,
      textAlign: "left",
      borderBottom: "none",
    };
    baseTheme.styles.h2 = {
      ...baseTheme.styles.h2,
      borderLeft: "none",
      paddingLeft: "0",
    };
    baseTheme.styles.blockquote = {
      ...baseTheme.styles.blockquote,
      borderLeft: `3px solid ${primaryColor}`,
      backgroundColor: "#fff",
      color: "#666",
    };
  }

  // Handle Mac Code Block style (only background color here, dots are handled in renderer)
  if (config.macCodeBlock) {
    baseTheme.styles.pre = {
      ...baseTheme.styles.pre,
      paddingTop: "2.5em", // Space for dots
      position: "relative",
    };
  }

  return baseTheme;
}
