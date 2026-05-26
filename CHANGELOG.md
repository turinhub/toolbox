# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- 将 `.cursorrules` 迁移为 `AGENT.md`，并更新项目版本描述（Next.js 14 到 16）。
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
