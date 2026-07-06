import { Theme } from "./types";

export const defaultTheme: Theme = {
  name: "默认主题",
  styles: {
    container: {
      fontFamily:
        '-apple-system-font, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      fontSize: "16px",
      lineHeight: "1.6",
      color: "#333",
    },
    h1: {
      fontSize: "22px",
      fontWeight: "bold",
      margin: "20px 0 10px",
      textAlign: "center",
      borderBottom: "2px solid #3f51b5",
      paddingBottom: "10px",
      color: "#3f51b5",
    },
    h2: {
      fontSize: "18px",
      fontWeight: "bold",
      margin: "20px 0 10px",
      paddingLeft: "10px",
      borderLeft: "4px solid #3f51b5",
      color: "#3f51b5",
    },
    h3: {
      fontSize: "16px",
      fontWeight: "bold",
      margin: "15px 0 10px",
      color: "#3f51b5",
    },
    p: {
      margin: "10px 0",
      textAlign: "justify",
    },
    blockquote: {
      margin: "15px 0",
      padding: "10px 15px",
      borderLeft: "4px solid #ddd",
      backgroundColor: "#f8f8f8",
      color: "#666",
      fontSize: "15px",
    },
    code: {
      fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
      fontSize: "14px",
      backgroundColor: "#f0f0f0",
      padding: "2px 4px",
      borderRadius: "4px",
      color: "#d14",
    },
    pre: {
      backgroundColor: "#282c34",
      padding: "15px",
      borderRadius: "5px",
      overflowX: "auto",
      color: "#abb2bf",
      fontSize: "14px",
      lineHeight: "1.5",
      margin: "15px 0",
    },
    ul: {
      margin: "10px 0",
      paddingLeft: "20px",
    },
    ol: {
      margin: "10px 0",
      paddingLeft: "20px",
    },
    li: {
      margin: "5px 0",
    },
    a: {
      color: "#3f51b5",
      textDecoration: "none",
      borderBottom: "1px dashed #3f51b5",
    },
    strong: {
      fontWeight: "bold",
      color: "#3f51b5",
    },
    img: {
      maxWidth: "100%",
      height: "auto",
      display: "block",
      margin: "20px auto",
      borderRadius: "4px",
    },
    hr: {
      border: "none",
      borderTop: "1px solid #ddd",
      margin: "20px 0",
    },
  },
};

export const darkTheme: Theme = {
  name: "暗黑主题",
  styles: {
    container: {
      fontFamily:
        '-apple-system-font, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      fontSize: "16px",
      lineHeight: "1.6",
      color: "#e0e0e0",
      backgroundColor: "#1e1e1e",
    },
    h1: {
      fontSize: "22px",
      fontWeight: "bold",
      margin: "20px 0 10px",
      textAlign: "center",
      borderBottom: "2px solid #bb86fc",
      paddingBottom: "10px",
      color: "#bb86fc",
    },
    h2: {
      fontSize: "18px",
      fontWeight: "bold",
      margin: "20px 0 10px",
      paddingLeft: "10px",
      borderLeft: "4px solid #bb86fc",
      color: "#bb86fc",
    },
    h3: {
      fontSize: "16px",
      fontWeight: "bold",
      margin: "15px 0 10px",
      color: "#bb86fc",
    },
    p: {
      margin: "10px 0",
      textAlign: "justify",
    },
    blockquote: {
      margin: "15px 0",
      padding: "10px 15px",
      borderLeft: "4px solid #555",
      backgroundColor: "#2c2c2c",
      color: "#aaa",
      fontSize: "15px",
    },
    code: {
      fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
      fontSize: "14px",
      backgroundColor: "#333",
      padding: "2px 4px",
      borderRadius: "4px",
      color: "#ff80ab",
    },
    pre: {
      backgroundColor: "#282c34",
      padding: "15px",
      borderRadius: "5px",
      overflowX: "auto",
      color: "#abb2bf",
      fontSize: "14px",
      lineHeight: "1.5",
      margin: "15px 0",
    },
    ul: {
      margin: "10px 0",
      paddingLeft: "20px",
    },
    ol: {
      margin: "10px 0",
      paddingLeft: "20px",
    },
    li: {
      margin: "5px 0",
    },
    a: {
      color: "#bb86fc",
      textDecoration: "none",
      borderBottom: "1px dashed #bb86fc",
    },
    strong: {
      fontWeight: "bold",
      color: "#bb86fc",
    },
    img: {
      maxWidth: "100%",
      height: "auto",
      display: "block",
      margin: "20px auto",
      borderRadius: "4px",
    },
    hr: {
      border: "none",
      borderTop: "1px solid #555",
      margin: "20px 0",
    },
  },
};
