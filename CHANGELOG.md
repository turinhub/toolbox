# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.37] - 2026-06-26

### Added

- 新增统一工具页标题栏组件，并在工具页 SEO 布局中自动渲染工具名称、分类和简短说明。
- Mermaid 渲染器新增 CodeMirror 编辑器、示例模板、SVG/PNG 导出、全屏预览和安全模式控制。

### Changed

- 统一 30+ 个工具页顶部 Header 风格，移除页面内分散的营销式标题区，改为更克制的工具台标题栏。
- 优化 API Tester 表单在加载已保存用例时的重置行为，并调整请求方法选择、Tabs 高度和移动端输入布局。
- 优化 Mermaid 渲染器的异步渲染、错误恢复、主题配置和移动端工具栏布局。
- 优化万年历、JSON 可视化编辑器等工具页的标题层级、顶部操作区和骨架屏布局。
- 整合 Agent 工作指南，仅保留 `AGENTS.md`，并补充统一工具页 Header 的 DOM、样式和响应式约定。

## [0.1.36] - 2026-06-26

### Added

- 首页和工具目录页新增更紧凑的工具索引视图，展示工具数量、分类数量、分类入口和源码入口。
- API Tester、S3 Checker、FTP Checker、OpenAI Checker、Domain Checker 支持通过 URL `tab` 参数保留当前标签页状态。
- API Tester、Docker Registry、OpenAI Checker 的已保存配置删除操作新增确认弹窗，避免误删。
- 全局布局新增跳转到主内容的可访问入口，并补充亮暗色 `theme-color` 视口配置。

### Changed

- 优化首页、工具目录、最近使用工具和多个工具页面的交互样式，减少 `transition-all`，统一 hover、focus、暗色模式和响应式表现。
- 为多处输入、图标按钮、文件操作、JSON 可视化编辑器节点和预览图片补充 label、aria 文案、输入语义、拼写检查和自动完成配置。
- 结构化数据组件改为使用稳定 `id` 注入 JSON-LD，避免重复脚本和 hydration 相关问题。
- 多个工具中的数字、日期、时间和文件大小显示改用 `Intl` 本地化格式。

### Security

- S3 Checker、FTP Checker、OpenAI Checker 等敏感连接配置表单强化密码、密钥、Token 输入字段的自动完成和复制/显示操作语义。

## [0.1.35] - 2026-06-26

### Added

- 新增 Playwright E2E 测试配置与 `test:e2e`、`test:e2e:ui`、`test:e2e:debug` 脚本。
- 新增导航、工具目录、Base64、JSON Formatter、UUID Generator 的 E2E 冒烟与核心工作流测试。
- `AGENTS.md` 增加 E2E 运行说明，包括本地 `webServer`、`PORT` 覆盖和 `PLAYWRIGHT_BASE_URL` 外部目标模式。

### Changed

- `.gitignore` 忽略 Playwright 测试产物和本地 Agent skill 安装产物，避免误提交。

## [0.1.34] - 2026-05-26

### Added

- 全站 SEO 体系重构：`lib/routes.ts` 新增 keywords、longDescription、categoryName、faq、updatedAt 字段，作为 SEO 元数据单一数据源。
- `lib/seo.ts` 大幅扩展，新增 `getSiteUrl()`、`buildAbsoluteUrl()`、`getRelatedTools()`、`buildHomeJsonLd()`、`buildToolsPageMetadata()`、`buildToolsPageJsonLd()`、`buildToolJsonLd()` 等函数，统一生成 metadata、canonical、Open Graph、Twitter Card 和 JSON-LD。
- 新增 `components/tool-page-seo.tsx` 组件，在工具页面底部渲染详细介绍、FAQ 问答和同类工具推荐。
- 所有 30+ 工具 `layout.tsx` 接入 `ToolPageSeo` 组件，统一注入结构化数据和 SEO 内容。
- `/tools` 页面从重定向改为独立工具目录页，按分类展示卡片式工具列表，含 CollectionPage 结构化数据。
- 首页增加「浏览全部在线工具」入口链接。
- 新增 `public/manifest.webmanifest`（PWA manifest）和 `public/og-image.png`（社交分享图）。
- 新增 `SEO_MONITORING.md` 发布后 SEO 检查清单。
- `AGENTS.md` 重写为结构化 Agent 工作指南，新增 SEO 与路由、代码风格等章节。

### Changed

- `buildToolMetadata()` 增加 keywords、Open Graph 图片、Twitter Card 等完整 SEO 字段。
- `app/layout.tsx` 注入首页 Organization 和 WebSite 结构化数据，添加 manifest 链接。
- `app/sitemap.ts` 改用 `buildAbsoluteUrl()` 和工具 `updatedAt` 作为 lastModified。
- `components/structured-data.tsx` 移除 `"use client"` 指令，删除内联结构化数据生成函数（已迁移到 `lib/seo.ts`）。
- `public/robots.txt` 增加 icon.svg、og-image.png、manifest.webmanifest 的 Allow 规则。
- `README.md` 新增 SEO Monitoring 章节链接。

## [0.1.33] - 2026-05-26

### Security

- S3 Checker、OpenAI Checker、FTP Checker 保存配置时不再写入 Secret Key / API Key / 密码 / 私钥 / Passphrase 等敏感字段到 localStorage。
- 加载已保存配置后需重新输入密钥或密码，并增加相应提示文案。
- OpenAI Checker 已保存配置列表不再显示部分 API Key，改为「未保存，加载后需重新输入」。
- API Tester 保存用例区域增加 localStorage 敏感数据风险提示。

### Added

- 新增 `CONTRIBUTING.md`、`PRIVACY.md`、`SECURITY.md` 项目治理文档。
- 新增 GitHub Issue 模板（Bug report / Feature request）和 PR 模板。
- 新增 GitHub Actions CI 工作流，自动执行 format:check、lint、typecheck、build。
- `package.json` 增加 homepage、repository、bugs、keywords、engines、packageManager 字段。
- ESLint 配置迁移至 flat config 直接导入，增加自定义规则和 ignores。
- 新增 `typecheck` 脚本。

### Changed

- README.md 重写为英文，增加隐私模型说明、环境变量文档和质量检查指引。
- 字体加载从 `next/font/google` 运行时导入改为 CSS font-family 声明，减少外部请求。
- 更新站点描述文案，准确反映隐私保护策略。
- `.env.example` 移除 NextAuth 配置，改为站点 URL 配置；更新 OpenAI 配置注释。
- `LICENSE` 版权信息更新为「2025-present Turinhub Toolbox」。

### Removed

- `.npmrc` 中移除 `registry=https://registry.npmmirror.com` 镜像源配置。

## [0.1.32] - 2026-05-26

### Changed

- 重构万年历工具 UI：采用 Card 卡片布局、圆角风格、响应式网格，提升视觉层次与交互体验。
- 改进日历网格：增加图例说明、优化日期单元格样式与选中态反馈。
- 改进日期详情面板：采用分区卡片式布局展示农历、干支、宜忌等信息，支持 sticky 定位。
- 改进月份导航：增加标题与响应式布局，优化年月选择器排列。
- 改进年份信息展示：采用大字排版与摘要卡片网格，突出当前选中日期。
- 优化整体页面布局：增加渐变 Hero 区域，使用响应式双栏网格（详情面板右侧吸附）。

## [0.1.31] - 2026-05-26

### Added

- 新增万年历工具，支持农历显示、二十四节气、传统节日、干支纪年与每日宜忌查询。
- 集成 `lunar-javascript` 库用于农历与节气计算。
- 新增 `lunar-javascript` 类型声明文件。

## [0.1.30] - 2026-05-11

### Added

- 增加首页「最近使用」功能，记录用户最近访问的工具并在首页展示，支持清除记录。

### Changed

- 重构 `CHANGELOG.md` 为 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) 格式。
- 升级 Next.js `16.2.4` 到 `16.2.6`。
- 升级 `eslint-config-next` `16.0.10` 到 `16.2.6`。
- 将 `.cursorrules` 迁移为 `AGENTS.md`，并更新项目版本描述（Next.js 14 到 16）。
- 配置 pnpm `onlyBuiltDependencies`，解决构建脚本审批问题。
- 配置 npm 镜像源 `npmmirror.com`，加速依赖下载。

## [0.1.29] - 2025-07-29

### Added

- 增加 Prompt 优化工具。

## [0.1.28] - 2025-07-28

### Added

- 增加 JSON Visual Editor。

## [0.1.27] - 2025-07-18

### Added

- 增加导航栏搜索。

### Removed

- 移除 AI 对话等内容。

## [0.1.26] - 2025-07-17

### Added

- 增加“配色表”工具。

## [0.1.25] - 2025-07-17

### Changed

- 优化“URL 编解码工具”，支持循环解码。

## [0.1.24] - 2025-07-14

> 注：此条目同样适用于 `0.1.23`。

### Added

- 增加数据存储计算器。
- 增加 SEO 机制。

## [0.1.22] - 2025-07-12

### Added

- 增加模型部署计算器。

## [0.1.21] - 2025-07-09

### Changed

- 优化 AI 对话界面的 Markdown 渲染。

## [0.1.20] - 2025-07-03

> 注：此条目同样适用于 `0.1.19`。

### Added

- 增加数学计算器与时间计算器。

### Changed

- 优化 AI 对话页面。

## [0.1.18] - 2025-06-25

### Added

- 增加域名检测工具。
- 增加 Prettier 工具。

## [0.1.17] - 2025-04-07

### Added

- 增加 Mermaid 渲染工具。

## [0.1.16] - 2025-04-01

### Added

- 增加文本对比工具。

### Changed

- 优化目录分组。

## [0.1.15] - 2025-03-24

### Added

- 增加数字转中文大写工具。

## [0.1.14] - 2025-03-21

### Added

- 增加 SVG 在线预览工具。
- 增加 XML 格式化工具。

## [0.1.13] - 2025-03-10

### Added

- 增加 ICO 图片转换工具。

### Changed

- 允许在 API 测试工具中保存测试用例。

## [0.1.12] - 2025-03-06

### Added

- 增加通用 API 测试工具。

## [0.1.11] - 2025-03-05

### Added

- 增加 S3 兼容接口检测工具。
- 增加 OpenAI 兼容接口检测工具。

## [0.1.10] - 2025-03-04

### Added

- 新增 AI 对话页面。

## [0.1.9] - 2025-03-03

> 注：此条目同样适用于 `0.1.6`、`0.1.7` 和 `0.1.8`。

### Added

- 新增 AI 图像生成页面。

## [0.1.5] - 2025-02-27

### Changed

- 优化 README 文件。
- 转移 Turnstile 展示页面。

### Fixed

- 修复 Toast。

## [0.1.4] - 2025-02-26

> 注：此条目同样适用于 `0.1.0`、`0.1.1`、`0.1.2` 和 `0.1.3`。

### Added

- 初始化项目。
- 补充 `LICENSE`。
- 接入 Cloudflare Turnstile。
- 补充 `.env.example`。
- 上线 `uuid`、`hash`、`base64`、`url-codec` 等 4 个页面。
- 上线 `timestamp`、`regex`、`json-formatter`、`sql-formatter` 等 4 个页面。

### Changed

- 完成移动端兼容。
