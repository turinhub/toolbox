import { Bot, Code, FileText, LucideIcon, Palette, Server } from "lucide-react";
import {
  defaultLocale,
  englishLocale,
  isLocalizedToolPath,
  type AppLocale,
} from "@/i18n/config";

export type ToolItem = {
  name: string;
  title: string;
  description: string;
  path: string;
  url: string;
  keywords: string[];
  longDescription: string;
  categoryName: string;
  faq?: {
    question: string;
    answer: string;
  }[];
  updatedAt: string;
};

export type ToolCategory = {
  title: string;
  description: string;
  icon: LucideIcon;
  url: string;
  tools: ToolItem[];
};

type BaseToolItem = {
  id: string;
  path: string;
  icon?: LucideIcon;
  zh: {
    name: string;
    title: string;
    description: string;
  };
  en?: {
    name: string;
    title: string;
    description: string;
  };
};

type BaseToolCategory = {
  id: string;
  icon: LucideIcon;
  url: string;
  zh: {
    title: string;
    description: string;
  };
  en: {
    title: string;
    description: string;
  };
  tools: BaseToolItem[];
};

const SEO_UPDATED_AT = "2026-05-26";

function buildToolKeywords(
  tool: Pick<ToolItem, "title" | "name" | "description">,
  categoryName: string,
  locale: AppLocale
) {
  if (locale === englishLocale) {
    return [
      tool.title,
      tool.name,
      tool.description,
      `${tool.title} online`,
      `${tool.title} tool`,
      `free ${tool.title}`,
      "online tools",
      "free tools",
      categoryName,
      "Turinhub Toolbox",
    ];
  }

  return [
    tool.title,
    tool.name,
    tool.description,
    `${tool.title}在线`,
    `${tool.title}工具`,
    `免费${tool.title}`,
    "在线工具",
    "免费工具",
    categoryName,
    "Turinhub Toolbox",
  ];
}

function buildToolFaq(
  tool: Pick<ToolItem, "title" | "name" | "description">,
  locale: AppLocale
) {
  if (locale === englishLocale) {
    return [
      {
        question: `Is ${tool.title} free?`,
        answer: `${tool.title} is a free online tool provided by Turinhub Toolbox and can be used directly in the browser.`,
      },
      {
        question: `What is ${tool.title} useful for?`,
        answer: `${tool.description}. It is useful for quick development, debugging, content processing, and temporary data conversion tasks.`,
      },
      {
        question: `Do I need to install anything to use ${tool.title}?`,
        answer: `No installation is required. Open the ${tool.name} page and use it online from a desktop or mobile browser.`,
      },
    ];
  }

  return [
    {
      question: `${tool.title}是免费的吗？`,
      answer: `${tool.title}是 Turinhub Toolbox 提供的免费在线工具，可直接在浏览器中打开使用。`,
    },
    {
      question: `${tool.title}适合哪些场景？`,
      answer: `${tool.description}，适合日常办公、开发调试、内容处理和临时数据转换等场景。`,
    },
    {
      question: `使用${tool.title}需要安装软件吗？`,
      answer: `不需要安装额外软件。打开 ${tool.name} 页面后即可在线使用，适合在桌面和移动浏览器中快速处理任务。`,
    },
  ];
}

const baseToolCategories: BaseToolCategory[] = [
  {
    id: "developer",
    zh: {
      title: "开发者工具",
      description: "各类开发、调试、格式化与编解码工具",
    },
    en: {
      title: "Developer Tools",
      description: "Formatting, debugging, encoding, and API utilities",
    },
    icon: Code,
    url: "#",
    tools: [
      {
        id: "json-formatter",
        zh: {
          name: "JSON 格式化",
          title: "JSON 格式化",
          description:
            "JSON 数据格式化与验证，支持实时渲染、语法高亮和结构化编辑",
        },
        en: {
          name: "JSON Formatter",
          title: "JSON Formatter",
          description:
            "Format and validate JSON with live rendering, syntax highlighting, and structured editing.",
        },
        path: "/tools/json-formatter",
      },
      {
        id: "json-visual-editor",
        zh: {
          name: "JSON 可视化编辑器",
          title: "JSON 可视化编辑器",
          description: "通过可视化界面编辑 JSON 数据，支持添加、删除、修改字段",
        },
        en: {
          name: "JSON Visual Editor",
          title: "JSON Visual Editor",
          description:
            "Edit JSON data through a visual tree interface with add, delete, and update operations.",
        },
        path: "/tools/json-visual-editor",
      },
      {
        id: "sql-formatter",
        zh: {
          name: "SQL 格式化",
          title: "SQL 格式化",
          description: "SQL 语句格式化与美化",
        },
        en: {
          name: "SQL Formatter",
          title: "SQL Formatter",
          description:
            "Format and beautify SQL queries with dialect, keyword case, and indentation options.",
        },
        path: "/tools/sql-formatter",
      },
      {
        id: "xml-formatter",
        zh: {
          name: "XML 格式化",
          title: "XML 格式化",
          description: "XML 数据格式化与验证",
        },
        en: {
          name: "XML Formatter",
          title: "XML Formatter",
          description:
            "Format, minify, and validate XML content in the browser.",
        },
        path: "/tools/xml-formatter",
      },
      {
        id: "jwt",
        zh: {
          name: "JWT 编解码",
          title: "JWT 编解码",
          description: "JWT 令牌的编码和解码",
        },
        en: {
          name: "JWT Encoder Decoder",
          title: "JWT Encoder Decoder",
          description:
            "Encode, decode, inspect, and optionally verify JSON Web Tokens.",
        },
        path: "/tools/jwt",
      },
      {
        id: "base64",
        zh: {
          name: "Base64 编解码",
          title: "Base64 编解码",
          description: "Base64 编码和解码转换",
        },
        en: {
          name: "Base64 Encoder Decoder",
          title: "Base64 Encoder Decoder",
          description:
            "Encode and decode Base64 strings and files in the browser.",
        },
        path: "/tools/base64",
      },
      {
        id: "url-codec",
        zh: {
          name: "URL 编解码",
          title: "URL 编解码",
          description: "URL 编码和解码转换",
        },
        en: {
          name: "URL Encoder Decoder",
          title: "URL Encoder Decoder",
          description:
            "Encode and decode URLs, URL components, and repeatedly encoded strings.",
        },
        path: "/tools/url-codec",
      },
      {
        id: "api-tester",
        zh: {
          name: "API 测试工具",
          title: "API 测试工具",
          description:
            "通用 API 测试工具，支持多种 HTTP 请求方法、自定义 Headers 和 Body",
        },
        en: {
          name: "API Tester",
          title: "API Tester",
          description:
            "Test APIs with multiple HTTP methods, custom headers, request bodies, and saved cases.",
        },
        path: "/tools/api-tester",
      },
      {
        id: "regex",
        zh: {
          name: "正则表达式",
          title: "正则表达式",
          description: "提供常用正则表达式，并提供在线测试正则表达式",
        },
        en: {
          name: "Regular Expressions",
          title: "Regular Expressions",
          description:
            "Test regular expressions online and start from common pattern presets.",
        },
        path: "/tools/regex",
      },
      {
        id: "uuid",
        zh: {
          name: "UUID 生成器",
          title: "UUID 生成器",
          description: "生成 UUID 和各种随机 ID",
        },
        en: {
          name: "UUID Generator",
          title: "UUID Generator",
          description:
            "Generate UUIDs and random IDs with multiple output formats.",
        },
        path: "/tools/uuid",
      },
    ],
  },
  {
    id: "text",
    zh: {
      title: "文本与实用",
      description: "文本处理、转换与数学计算工具",
    },
    en: {
      title: "Text and Utilities",
      description: "Text processing, conversion, and calculation tools",
    },
    icon: FileText,
    url: "#",
    tools: [
      {
        id: "text-compare",
        zh: {
          name: "文本对比",
          title: "文本对比",
          description: "查看两段文本之间的差异，以git风格展示",
        },
        path: "/tools/text-compare",
      },
      {
        id: "markdown-to-wechat",
        zh: {
          name: "Markdown 转公众号",
          title: "Markdown 转公众号",
          description: "将 Markdown 内容转换为微信公众号格式，支持自定义样式",
        },
        path: "/tools/markdown-to-wechat",
      },
      {
        id: "chinese-to-pinyin",
        zh: {
          name: "汉字转拼音",
          title: "汉字转拼音",
          description: "将汉字转换为拼音，支持多种音调格式",
        },
        path: "/tools/chinese-to-pinyin",
      },
      {
        id: "number-to-chinese",
        zh: {
          name: "数字转中文大写",
          title: "数字转中文大写",
          description: "将数字金额转换为中文大写格式",
        },
        path: "/tools/number-to-chinese",
      },
      {
        id: "timestamp",
        zh: {
          name: "时间戳",
          title: "时间戳",
          description: "获取当前时间戳、时间戳转换",
        },
        path: "/tools/timestamp",
      },
      {
        id: "time-calculator",
        zh: {
          name: "时间计算器",
          title: "时间计算器",
          description: "进行时区换算、日期计算等时间相关的操作",
        },
        path: "/tools/time-calculator",
      },
      {
        id: "math-calculator",
        zh: {
          name: "数学计算器",
          title: "数学计算器",
          description: "支持基本数学表达式计算以及常用计算机单位换算",
        },
        path: "/tools/math-calculator",
      },
      {
        id: "calendar",
        zh: {
          name: "万年历",
          title: "万年历",
          description:
            "支持农历、二十四节气、传统节日、干支纪年与每日宜忌的万年历查询",
        },
        path: "/tools/calendar",
      },
    ],
  },
  {
    id: "design",
    zh: {
      title: "图像与设计",
      description: "图像处理、图形渲染与配色工具",
    },
    en: {
      title: "Image and Design",
      description: "Image processing, rendering, and color utilities",
    },
    icon: Palette,
    url: "#",
    tools: [
      {
        id: "svg-renderer",
        zh: {
          name: "SVG 渲染器",
          title: "SVG 渲染器",
          description: "在线预览和编辑 SVG 矢量图，支持实时渲染和代码编辑",
        },
        path: "/tools/svg-renderer",
      },
      {
        id: "mermaid-renderer",
        zh: {
          name: "Mermaid 渲染器",
          title: "Mermaid 渲染器",
          description: "在线渲染 Mermaid 格式的图表",
        },
        path: "/tools/mermaid-renderer",
      },
      {
        id: "image-to-ico",
        zh: {
          name: "图片转ICO",
          title: "图片转ICO",
          description: "将PNG、JPEG等图片格式转换为ICO图标文件",
        },
        path: "/tools/image-to-ico",
      },
      {
        id: "qr-generator",
        zh: {
          name: "二维码生成器",
          title: "二维码生成器",
          description: "根据链接或文本内容生成二维码，支持多种格式和自定义设置",
        },
        path: "/tools/qr-generator",
      },
      {
        id: "color-palette",
        zh: {
          name: "配色表",
          title: "配色表",
          description: "常见配色表展示，支持在线配色检测和色彩搭配",
        },
        path: "/tools/color-palette",
      },
    ],
  },
  {
    id: "network",
    zh: {
      title: "系统与网络",
      description: "网络连通性检测与系统资源计算",
    },
    en: {
      title: "System and Network",
      description: "Network checks and system resource calculators",
    },
    icon: Server,
    url: "#",
    tools: [
      {
        id: "domain-checker",
        zh: {
          name: "域名检测",
          title: "域名检测",
          description: "检测域名的DNS记录、IP地址、域名注册信息和连通性状态",
        },
        path: "/tools/domain-checker",
      },
      {
        id: "s3-checker",
        zh: {
          name: "S3 兼容接口检测",
          title: "S3 兼容接口检测",
          description: "验证 AWS S3 兼容接口连通性与权限检测",
        },
        path: "/tools/s3-checker",
      },
      {
        id: "ftp-checker",
        zh: {
          name: "FTP 工具",
          title: "FTP 工具",
          description: "测试 FTP/FTPS/SFTP 连接，浏览和管理远程文件",
        },
        path: "/tools/ftp-checker",
      },
      {
        id: "docker-registry",
        zh: {
          name: "Docker Registry 管理",
          title: "Docker Registry 管理",
          description: "在线浏览和管理 Docker Registry 镜像仓库",
        },
        path: "/tools/docker-registry",
      },
      {
        id: "gpu-calculator",
        zh: {
          name: "GPU显存需求计算器",
          title: "GPU显存需求计算器",
          description:
            "计算大型语言模型部署所需的GPU显存，并推荐合适的显卡型号",
        },
        path: "/tools/gpu-calculator",
      },
      {
        id: "database-storage-calculator",
        zh: {
          name: "数据库存储估算",
          title: "数据库存储估算",
          description:
            "计算数据字段在MySQL、ClickHouse和PostgreSQL中的存储体积",
        },
        path: "/tools/database-storage-calculator",
      },
    ],
  },
  {
    id: "ai",
    zh: {
      title: "AI 与智能",
      description: "人工智能辅助与检测工具",
    },
    en: {
      title: "AI and Intelligence",
      description: "AI assistance and compatibility checks",
    },
    icon: Bot,
    url: "#",
    tools: [
      {
        id: "prompt-optimizer",
        zh: {
          name: "Prompt 优化",
          title: "Prompt 优化",
          description: "优化和改进 AI 提示词，提升 AI 对话效果和准确性",
        },
        path: "/tools/prompt-optimizer",
      },
      {
        id: "openai-checker",
        zh: {
          name: "OpenAI 兼容接口检测",
          title: "OpenAI 兼容接口检测",
          description: "验证 OpenAI 兼容接口连通性与功能测试",
        },
        path: "/tools/openai-checker",
      },
    ],
  },
];

function buildLocalizedTool(
  tool: BaseToolItem,
  categoryName: string,
  locale: AppLocale
): ToolItem | null {
  if (
    locale === englishLocale &&
    (!tool.en || !isLocalizedToolPath(tool.path))
  ) {
    return null;
  }

  const copy = locale === englishLocale && tool.en ? tool.en : tool.zh;
  const localizedTool = {
    name: copy.name,
    title: copy.title,
    description: copy.description,
    path: tool.path,
    url: tool.path,
  };

  const longDescription =
    locale === englishLocale
      ? `${localizedTool.description} ${localizedTool.name} is a free online tool in the ${categoryName} category of Turinhub Toolbox. It focuses on quick, ad-free, browser-based workflows for common development and data tasks.`
      : `${localizedTool.description}。${localizedTool.name}是 Turinhub Toolbox ${categoryName}分类下的免费在线工具，适合需要快速完成${localizedTool.title}、数据检查、格式转换或开发调试的用户。页面强调简洁、无广告和尽量本地处理，让常用任务可以更快完成。`;

  return {
    ...localizedTool,
    keywords: buildToolKeywords(localizedTool, categoryName, locale),
    longDescription,
    categoryName,
    faq: buildToolFaq(localizedTool, locale),
    updatedAt: SEO_UPDATED_AT,
  };
}

export function getToolCategories(
  locale: AppLocale = defaultLocale
): ToolCategory[] {
  return baseToolCategories
    .map(category => {
      const categoryCopy = locale === englishLocale ? category.en : category.zh;
      const tools = category.tools
        .map(tool => buildLocalizedTool(tool, categoryCopy.title, locale))
        .filter((tool): tool is ToolItem => tool !== null);

      return {
        title: categoryCopy.title,
        description: categoryCopy.description,
        icon: category.icon,
        url: category.url,
        tools,
      };
    })
    .filter(category => locale === defaultLocale || category.tools.length > 0);
}

export const toolCategories: ToolCategory[] = getToolCategories(defaultLocale);

export function getHomeNavItem(locale: AppLocale = defaultLocale) {
  return {
    title: locale === englishLocale ? "Home" : "首页",
    url: "/",
    icon: FileText,
  };
}

export const homeNavItem = getHomeNavItem(defaultLocale);
