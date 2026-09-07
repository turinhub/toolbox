# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.45] - 2026-09-07

### Changed

- 首页和工具目录改为按分类展示的紧凑工具列表，支持中英文搜索、中文拼音搜索及 URL 分类与搜索状态；最近使用工具改为轻量入口。
- 优化侧栏折叠菜单、移动端导航、工具控件标签及亮暗色键盘焦点，补齐多个工具的中英文状态和操作反馈。

### Fixed

- JSON 可视化编辑器使用独立路径段处理数组及包含点号、空字符串的对象键，支持各类 JSON 根值，严格校验新增和编辑值，避免无效输入被静默替换。
- 二维码生成使用独立画布和可取消任务，输入或选项变化后清除旧结果；上传图片需完成读取和解码验证，避免过期任务覆盖当前结果。
- SQL 输入或格式选项变化后清除旧结果，取消过期文件读取，补充内联错误及复制、下载反馈，并修正 Oracle 方言标识。
- 颜色分析支持输入规范化和内联校验，修改颜色后清除旧分析结果，并完善色板复制反馈及窄屏布局。

### Security

- 正则匹配移入可终止的 Web Worker，增加防抖、执行超时和匹配数量上限，避免灾难回溯阻塞页面；高亮结果改为文本节点，避免用户输入作为 HTML 执行。

### Added

- 新增 47 项纯逻辑测试，覆盖 JSON 数据完整性、二维码图片读取与取消、正则 Worker 生命周期、匹配语义、安全高亮及静态 Worker 验证豁免。
- 补充导航、JSON 编辑、二维码、正则、SQL 和颜色工具的浏览器回归用例，并提供无需启动应用或浏览器的单元测试配置。

## [0.1.44] - 2026-09-06

### Fixed

- 修正 SEO 默认域名为 `https://toolbox.turinhub.com`，robots 的 sitemap 地址改为与 metadata、JSON-LD 和 sitemap 共用站点 URL 配置，兼容自托管域名。
- 配置读取、迁移及写入失败时提供明确提示，避免错误宣告保存成功或覆盖无法读取的旧配置。

### Security

- Docker Registry 配置不再保存密码，打开工具时清理旧配置中的密码并保留名称、地址和用户名；加载配置后清空密码并等待手动连接。

### Changed

- 精简 README 并统一文档导航，修正工具站域名，补齐运行环境、浏览器测试、人机验证及部署检查说明。
- 按现有实现完善隐私与安全文档，说明服务端处理、外部请求、浏览器存储和旧密码迁移边界；同步贡献指南、Agent 路由约定及 GitHub 模板。

### Added

- 新增 12 项 SEO 与 Registry 回归测试，覆盖双语页面、站点 URL 配置、旧密码清理及存储失败；支持指定测试目标的 SEO 域名。

## [0.1.43] - 2026-09-06

### Changed

- 升级 Next.js / eslint-config-next 至 `16.3.4`、React 至 `19.2.8`，同步更新 Radix、CodeMirror、国际化、LangChain 和测试工具等兼容版本。
- 保留 Tailwind CSS 3、Zod 3、TypeScript 5 和 ESLint 9；将 `tailwind-merge` 调整至兼容 Tailwind CSS 3 的 2.6.x，移除已由 `diff` 自带类型替代的 `@types/diff`。
- Node.js 最低版本声明调整为 `20.9.0`，与 Next.js 要求一致；固定 `@langchain/openai` 为仍支持 Node.js 20 的 `1.5.8`。
- 按升级后的 Prettier 统一现有页面格式，恢复全量格式检查通过。

### Removed

- 清理未使用的 UI 组件、旧主题和中间件、内部工具定义及直接依赖，保留现有工具功能与路由。
- 删除 GPU 计算器历史说明稿和未启用的 Cloudflare AI 环境变量示例；贡献指南改为引用 README 中的开发与检查说明。

### Fixed

- 域名检测工具兼容 SSL 证书签发者包含多个组织名称的情况，避免新版 Node.js 类型检查失败。
- Mermaid 编辑器改为客户端加载，修复暗色模式首次渲染的主题不一致，并补充 hydration 回归断言。

### Security

- 升级 Mermaid、DOMPurify、PostCSS、sharp 等依赖，并更新传递依赖 overrides，修复本轮依赖审计发现的安全问题。

## [0.1.42] - 2026-07-29

### Added

- 新增中英文 MCP 在线测试工具，支持公网 HTTPS Streamable HTTP 服务器发现、Tools 调用、Resources 读取、Prompts 获取和脱敏协议记录。
- 使用官方 MCP TypeScript SDK v2 自动协商现代与 2025-era 协议，并为每次页面操作创建和关闭临时客户端。

### Security

- MCP 服务端代理新增 DNS/IP/端口/重定向/Header 校验、地址固定、请求响应大小限制、超时、并发与固定窗口限流；禁止跨 Origin 重定向携带凭据，并确保私网开关不会放行回环、链路本地、元数据和保留地址。
- Turnstile 人机验证 Cookie 改为服务端签名的一小时令牌；生产环境缺少配置时 MCP API 默认拒绝服务。

## [0.1.41] - 2026-07-07

### Security

- 升级 `basic-ftp`、`diff`、`mermaid`、`postcss`、`eslint` 和 `@eslint/eslintrc` 等依赖，修复 GitHub Dependabot 报告的开放漏洞。
- 补充 `pnpm.overrides` 锁定 `form-data`、`dompurify`、`js-yaml`、`jws`、`glob`、`minimatch`、`uuid`、`@babel/*`、`@eslint/plugin-kit`、`ajv` 和 `mdast-util-to-hast` 等传递依赖的安全版本。

## [0.1.40] - 2026-07-06

### Added

- 新增中文和英文独立 PWA manifest，并按当前站点语言输出对应 metadata manifest。
- 在 `AGENTS.md` 中补充工具页多语言文案组织规范，明确简单 UI 文案走 `messages/*`，复杂结构化内容可使用工具目录内 copy 文件。

### Changed

- `next-intl` 客户端 Provider 改为接收服务端传入的当前语言消息，避免客户端入口同时携带中英文消息包。
- SQL Formatter 简单界面文案迁移到 `messages/*` 的 `sqlFormatter` 命名空间，作为工具页文案迁移样板。
- Turnstile proxy 静态资源排除规则补充 locale manifest 路径，避免 manifest 请求被验证流程重定向。
- `robots.txt` 放行新增的中文和英文 manifest 文件。

## [0.1.39] - 2026-07-06

### Added

- 完成全部工具页英文路由，新增 21 个 `/en/tools/*` 英文工具页面并保持中文 `/tools/*` 路由不变。
- 补齐英文工具目录、SEO metadata、结构化数据和 sitemap 本地化清单，使英文目录仅展示已完整英文化的工具。

### Changed

- 为时间、文本、设计渲染、网络存储、AI、计算和中文内容类工具补充英文界面文案、placeholder、toast、空状态和复制/下载/上传反馈。
- S3、FTP 和 OpenAI 检测工具的服务端测试结果、错误提示和排查说明支持按当前语言返回。
- 保留中文文化类工具的核心输出语义，同时为操作界面、示例说明和状态文案提供英文呈现。

## [0.1.38] - 2026-07-06

### Added

- 新增英文站点入口 `/en`、英文工具目录和首批英文工具页面，并接入 `next-intl`、英文消息文件和语言切换菜单。
- 新增本地化路由、文案、SEO metadata、JSON-LD、sitemap alternates 和最近使用工具的多语言路径处理。
- 新增统一应用根 Shell 和跳转主内容入口，支持中文默认路由与英文前缀路由共享布局。

### Changed

- 将中文默认页面迁移到 route group 结构，保留 `/` 与 `/tools/*` 作为中文 canonical 路由。
- 优化导航、移动端 Header、侧边栏、工具页 Header 和相关工具推荐，使链接和文案按当前语言生成。
- 优化 FTP Checker 文件浏览器的下载流程，改为先校验下载响应并展示具体错误，再通过浏览器 Blob 保存文件。

### Security

- FTP Checker 下载接口补充二进制响应和内容类型嗅探防护 Header，提升浏览器下载兼容性与安全性。

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
