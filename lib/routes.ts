import {
  FileText,
  LucideIcon,
  Code,
  Palette,
  Bot,
  Server,
} from "lucide-react";

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
    title: "开发者工具",
    description: "各类开发、调试、格式化与编解码工具",
    icon: Code,
    url: "#",
    tools: [
      {
        name: "JSON 格式化",
        title: "JSON 格式化",
        description:
          "JSON 数据格式化与验证，支持实时渲染、语法高亮和结构化编辑",
        path: "/tools/json-formatter",
        url: "/tools/json-formatter",
      },
      {
        name: "JSON 可视化编辑器",
        title: "JSON 可视化编辑器",
        description: "通过可视化界面编辑 JSON 数据，支持添加、删除、修改字段",
        path: "/tools/json-visual-editor",
        url: "/tools/json-visual-editor",
      },
      {
        name: "SQL 格式化",
        title: "SQL 格式化",
        description: "SQL 语句格式化与美化",
        path: "/tools/sql-formatter",
        url: "/tools/sql-formatter",
      },
      {
        name: "XML 格式化",
        title: "XML 格式化",
        description: "XML 数据格式化与验证",
        path: "/tools/xml-formatter",
        url: "/tools/xml-formatter",
      },
      {
        name: "JWT 编解码",
        title: "JWT 编解码",
        description: "JWT 令牌的编码和解码",
        path: "/tools/jwt",
        url: "/tools/jwt",
      },
      {
        name: "Base64 编解码",
        title: "Base64 编解码",
        description: "Base64 编码和解码转换",
        path: "/tools/base64",
        url: "/tools/base64",
      },
      {
        name: "URL 编解码",
        title: "URL 编解码",
        description: "URL 编码和解码转换",
        path: "/tools/url-codec",
        url: "/tools/url-codec",
      },
      {
        name: "API 测试工具",
        title: "API 测试工具",
        description:
          "通用 API 测试工具，支持多种 HTTP 请求方法、自定义 Headers 和 Body",
        path: "/tools/api-tester",
        url: "/tools/api-tester",
      },
      {
        name: "正则表达式",
        title: "正则表达式",
        description: "提供常用正则表达式，并提供在线测试正则表达式",
        path: "/tools/regex",
        url: "/tools/regex",
      },
      {
        name: "UUID 生成器",
        title: "UUID 生成器",
        description: "生成 UUID 和各种随机 ID",
        path: "/tools/uuid",
        url: "/tools/uuid",
      },
    ],
  },
  {
    title: "文本与实用",
    description: "文本处理、转换与数学计算工具",
    icon: FileText,
    url: "#",
    tools: [
      {
        name: "文本对比",
        title: "文本对比",
        description: "查看两段文本之间的差异，以git风格展示",
        path: "/tools/text-compare",
        url: "/tools/text-compare",
      },
      {
        name: "Markdown 转公众号",
        title: "Markdown 转公众号",
        description: "将 Markdown 内容转换为微信公众号格式，支持自定义样式",
        path: "/tools/markdown-to-wechat",
        url: "/tools/markdown-to-wechat",
      },
      {
        name: "汉字转拼音",
        title: "汉字转拼音",
        description: "将汉字转换为拼音，支持多种音调格式",
        path: "/tools/chinese-to-pinyin",
        url: "/tools/chinese-to-pinyin",
      },
      {
        name: "数字转中文大写",
        title: "数字转中文大写",
        description: "将数字金额转换为中文大写格式",
        path: "/tools/number-to-chinese",
        url: "/tools/number-to-chinese",
      },
      {
        name: "时间戳",
        title: "时间戳",
        description: "获取当前时间戳、时间戳转换",
        path: "/tools/timestamp",
        url: "/tools/timestamp",
      },
      {
        name: "时间计算器",
        title: "时间计算器",
        description: "进行时区换算、日期计算等时间相关的操作",
        path: "/tools/time-calculator",
        url: "/tools/time-calculator",
      },
      {
        name: "数学计算器",
        title: "数学计算器",
        description: "支持基本数学表达式计算以及常用计算机单位换算",
        path: "/tools/math-calculator",
        url: "/tools/math-calculator",
      },
    ],
  },
  {
    title: "图像与设计",
    description: "图像处理、图形渲染与配色工具",
    icon: Palette,
    url: "#",
    tools: [
      {
        name: "SVG 渲染器",
        title: "SVG 渲染器",
        description: "在线预览和编辑 SVG 矢量图，支持实时渲染和代码编辑",
        path: "/tools/svg-renderer",
        url: "/tools/svg-renderer",
      },
      {
        name: "Mermaid 渲染器",
        title: "Mermaid 渲染器",
        description: "在线渲染 Mermaid 格式的图表",
        path: "/tools/mermaid-renderer",
        url: "/tools/mermaid-renderer",
      },
      {
        name: "图片转ICO",
        title: "图片转ICO",
        description: "将PNG、JPEG等图片格式转换为ICO图标文件",
        path: "/tools/image-to-ico",
        url: "/tools/image-to-ico",
      },
      {
        name: "二维码生成器",
        title: "二维码生成器",
        description: "根据链接或文本内容生成二维码，支持多种格式和自定义设置",
        path: "/tools/qr-generator",
        url: "/tools/qr-generator",
      },
      {
        name: "配色表",
        title: "配色表",
        description: "常见配色表展示，支持在线配色检测和色彩搭配",
        path: "/tools/color-palette",
        url: "/tools/color-palette",
      },
    ],
  },
  {
    title: "系统与网络",
    description: "网络连通性检测与系统资源计算",
    icon: Server,
    url: "#",
    tools: [
      {
        name: "域名检测",
        title: "域名检测",
        description: "检测域名的DNS记录、IP地址、域名注册信息和连通性状态",
        path: "/tools/domain-checker",
        url: "/tools/domain-checker",
      },
      {
        name: "S3 兼容接口检测",
        title: "S3 兼容接口检测",
        description: "验证 AWS S3 兼容接口连通性与权限检测",
        path: "/tools/s3-checker",
        url: "/tools/s3-checker",
      },
      {
        name: "Docker Registry 管理",
        title: "Docker Registry 管理",
        description: "在线浏览和管理 Docker Registry 镜像仓库",
        path: "/tools/docker-registry",
        url: "/tools/docker-registry",
      },
      {
        name: "GPU显存需求计算器",
        title: "GPU显存需求计算器",
        description: "计算大型语言模型部署所需的GPU显存，并推荐合适的显卡型号",
        path: "/tools/gpu-calculator",
        url: "/tools/gpu-calculator",
      },
      {
        name: "数据库存储估算",
        title: "数据库存储估算",
        description: "计算数据字段在MySQL、ClickHouse和PostgreSQL中的存储体积",
        path: "/tools/database-storage-calculator",
        url: "/tools/database-storage-calculator",
      },
    ],
  },
  {
    title: "AI 与智能",
    description: "人工智能辅助与检测工具",
    icon: Bot,
    url: "#",
    tools: [
      {
        name: "Prompt 优化",
        title: "Prompt 优化",
        description: "优化和改进 AI 提示词，提升 AI 对话效果和准确性",
        path: "/tools/prompt-optimizer",
        url: "/tools/prompt-optimizer",
      },
      {
        name: "OpenAI 兼容接口检测",
        title: "OpenAI 兼容接口检测",
        description: "验证 OpenAI 兼容接口连通性与功能测试",
        path: "/tools/openai-checker",
        url: "/tools/openai-checker",
      },
    ],
  },
];

// 首页导航项
export const homeNavItem = {
  title: "首页",
  url: "/",
  icon: FileText,
};
