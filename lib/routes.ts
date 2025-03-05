import { FileText, Lock, LucideIcon, Sparkles, Network } from "lucide-react";

export type ToolItem = {
  name: string;
  title: string;
  description: string;
  path: string;
  url: string;
};

export type ToolCategory = {
  title: string;
  description: string;
  icon: LucideIcon;
  url: string;
  tools: ToolItem[];
};

export const toolCategories: ToolCategory[] = [
  {
    title: "综合工具",
    description: "常用的文本处理和格式化工具",
    icon: FileText,
    url: "#",
    tools: [
      { 
        name: "时间戳转换", 
        title: "时间戳转换", 
        description: "获取当前时间戳、时间戳转换", 
        path: "/tools/timestamp",
        url: "/tools/timestamp" 
      },
      { 
        name: "正则表达式", 
        title: "正则表达式", 
        description: "提供常用正则表达式，并提供在线测试正则表达式", 
        path: "/tools/regex",
        url: "/tools/regex" 
      },
      { 
        name: "JSON 格式化", 
        title: "JSON 格式化", 
        description: "JSON 数据格式化与验证", 
        path: "/tools/json-formatter",
        url: "/tools/json-formatter" 
      },
      { 
        name: "SQL 格式化", 
        title: "SQL 格式化", 
        description: "SQL 语句格式化与美化", 
        path: "/tools/sql-formatter",
        url: "/tools/sql-formatter" 
      },
    ]
  },
  {
    title: "加密与编码",
    description: "各类加密、哈希和编码转换工具",
    icon: Lock,
    url: "#",
    tools: [
      { 
        name: "UUID 生成器", 
        title: "UUID 生成器", 
        description: "生成 UUID 和各种随机 ID", 
        path: "/tools/uuid",
        url: "/tools/uuid" 
      },
      { 
        name: "JWT 编解码", 
        title: "JWT 编解码", 
        description: "JWT 令牌的编码和解码", 
        path: "/tools/jwt",
        url: "/tools/jwt" 
      },
      { 
        name: "URL 编解码", 
        title: "URL 编解码", 
        description: "URL 编码和解码转换", 
        path: "/tools/url-codec",
        url: "/tools/url-codec" 
      },
      { 
        name: "Base64 编解码", 
        title: "Base64 编解码", 
        description: "Base64 编码和解码转换", 
        path: "/tools/base64",
        url: "/tools/base64" 
      }
    ]
  },
  {
    title: "API 检测",
    description: "各类 API 接口连通性与功能测试工具",
    icon: Network,
    url: "#",
    tools: [
      { 
        name: "S3 兼容接口检测", 
        title: "S3 兼容接口检测", 
        description: "验证 AWS S3 兼容接口连通性与权限检测", 
        path: "/tools/s3-checker",
        url: "/tools/s3-checker" 
      },
      { 
        name: "OpenAI 兼容接口检测", 
        title: "OpenAI 兼容接口检测", 
        description: "验证 OpenAI 兼容接口连通性与功能测试", 
        path: "/tools/openai-checker",
        url: "/tools/openai-checker" 
      }
    ]
  },
  {
    title: "人工智能",
    description: "AI 驱动的创意和生产力工具",
    icon: Sparkles,
    url: "#",
    tools: [
      { 
        name: "AI 对话", 
        title: "AI 对话", 
        description: "与先进的AI模型进行自然语言对话", 
        path: "/tools/ai-chat",
        url: "/tools/ai-chat" 
      },
      { 
        name: "AI 图像生成", 
        title: "AI 图像生成", 
        description: "使用人工智能生成各种风格的图像", 
        path: "/tools/ai-image",
        url: "/tools/ai-image" 
      }
    ]
  }
];

// 首页导航项
export const homeNavItem = {
  title: "首页",
  url: "/",
  icon: FileText,
};
