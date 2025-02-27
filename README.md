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

### 综合工具
- **时间戳转换**：获取当前时间戳、时间戳与日期互转
- **正则表达式**：提供常用正则表达式，支持在线测试
- **JSON 格式化**：JSON 数据格式化与验证
- **SQL 格式化**：SQL 语句格式化与美化

### 加密与编码
- **UUID 生成器**：生成 UUID 和各种随机 ID
- **JWT 编解码**：JWT 令牌的编码和解码
- **URL 编解码**：URL 编码和解码转换
- **Base64 编解码**：Base64 编码和解码转换

## 🔧 技术栈

- **前端框架**：Next.js 14 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS + Shadcn UI
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

5. 在浏览器中访问 http://localhost:3000

## 📝 计划功能

- [ ] AI 图像生成功能
- [ ] AI 对话功能

## 🤝 贡献指南

欢迎提交 Pull Request 或 Issue 来帮助改进这个项目！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

## 📬 联系方式

- 作者：turinhub
- 邮箱：zhangxudong@turinhub.com
- 网站：[https://toolbox.turinhub.com](https://toolbox.turinhub.com)
