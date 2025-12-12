# Turinhub Toolbox

<div align="center">
  <img src="public/icon.svg" alt="Turinhub Toolbox Logo" width="120" />
  <h3>免费、无广告、无数据存储的在线工具箱</h3>
</div>

## 📖 项目介绍

Turinhub Toolbox 是一个汇集常用网页工具的在线平台，基于 Vercel 和 Cloudflare 提供免费、无广告、无数据存储的常用在线工具箱。项目采用现代化的技术栈，提供流畅的用户体验和美观的界面设计。

- 🔒 **安全可靠**：所有工具均在浏览器本地运行，不会上传您的数据
- 🚀 **快速响应**：基于 Next.js 构建，提供极速的加载体验
- 📱 **响应式设计**：完美支持桌面和移动设备
- 🌙 **深色模式**：支持明暗主题切换，保护您的眼睛
- 🛡️ **Cloudflare 防护**：集成 Turnstile 保护，防止滥用

## 🧰 功能列表

### 🛠️ 开发者工具

- **JSON 工具**
  - **JSON 格式化**：JSON 数据格式化与验证
  - **JSON 可视化编辑器**：以树形结构查看和编辑 JSON
- **代码格式化**
  - **SQL 格式化**：SQL 语句格式化与美化
  - **XML 格式化**：XML 数据格式化与美化
- **编解码**
  - **JWT 编解码**：JWT 令牌的编码和解码
  - **Base64 编解码**：Base64 编码和解码转换
  - **URL 编解码**：URL 编码和解码转换
- **其他**
  - **API 测试器**：在线 API 接口测试工具
  - **正则表达式**：提供常用正则表达式，支持在线测试
  - **UUID 生成器**：生成 UUID 和各种随机 ID

### 🎨 图像与设计

- **SVG 渲染器**：在线预览和渲染 SVG 图形
- **Mermaid 渲染器**：在线渲染 Mermaid 流程图和图表
- **图片转 ICO**：将图片转换为 ICO 图标格式
- **二维码生成器**：快速生成二维码
- **色板/取色器**：颜色选择与调色板工具

### 🤖 AI 与智能

- **Prompt 优化器**：优化 AI 提示词，提升生成质量
- **OpenAI 检测器**：检测 OpenAI API 连接状态与可用性

### 🔧 系统与网络

- **域名检测器**：检测域名状态和相关信息
- **S3 检测器**：检测 AWS S3 存储桶连接状态
- **Docker Registry 管理**：在线浏览和管理 Docker Registry 镜像仓库
- **GPU 计算器**：估算深度学习模型所需的 GPU 显存
- **数据库存储计算器**：估算数据库存储空间需求

### � 文本与实用工具

- **文本工具**
  - **文本对比**：文本差异对比和高亮显示
  - **汉字转拼音**：将中文字符转换为拼音
  - **数字转中文**：阿拉伯数字转换为中文大写数字
- **计算与时间**
  - **时间戳转换**：获取当前时间戳、时间戳与日期互转
  - **时间计算器**：日期间隔与时间推算
  - **数学计算器**：在线数学计算工具

## �🔧 技术栈

- **前端框架**：Next.js 16 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS + Shadcn UI
- **图标库**：Lucide React
- **包管理**：PNPM
- **部署**：Vercel
- **安全防护**：Cloudflare Turnstile

## 🚀 本地开发

### 前置要求

- Node.js 18+
- pnpm

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/turinhub/toolbox.git
cd toolbox
```

2. 安装依赖

```bash
pnpm install
```

3. 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local 文件，填入必要的环境变量
```

4. 启动开发服务器

```bash
pnpm dev
```

## 📄 开源协议

MIT License
