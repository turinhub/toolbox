# Agent 工作指南

请始终使用中文回复。

## 1. 沟通原则

- 如果需求存在明显歧义，先向用户确认，不要直接修改代码。
- 如果可以通过阅读仓库文件确认事实，先检查项目结构、配置和现有实现。
- 修改前先说明准备改哪些文件和原因。
- 不要覆盖或回退用户已有改动；遇到无关的工作区变更时保持原样。

## 2. 项目技术栈

- 项目使用 Next.js 16 App Router、TypeScript、Tailwind CSS 和 Shadcn UI。
- 包管理器使用 PNPM；当前要求 Node.js 20+、PNPM 9+。
- 主配色和全局样式在 `app/globals.css`。
- 通用工具函数和配置放在 `lib/*`。
- 静态资源放在 `public/*`。

## 3. 代码组织

- 优先考虑服务端实现，尤其是 `lib/*` 中的方法。
- 只有确实需要浏览器状态、事件或 DOM API 的组件才标注 `"use client"`。
- 适当划分模块，保持低耦合；复杂逻辑应提取为独立 component、hook 或 lib 方法。
- 优先使用 `@/**` 路径别名，避免深层相对路径。

## 4. UI 与样式

- 使用 Shadcn UI 组件，但不要修改 `components/ui/*` 下的文件。
- 新增 Shadcn UI 组件时使用命令 `pnpm dlx shadcn@latest add <component>`，不要直接安装 radix-ui 包。
- 通知组件使用 `sonner`，不要新增旧式 toast 实现。
- 图标优先使用 `lucide-react`。

## 5. SEO 与路由

- 工具路由、标题、描述、关键词、FAQ、更新时间等 SEO 数据以 `lib/routes.ts` 为单一数据源。
- 页面 metadata、canonical、Open Graph、Twitter card、JSON-LD 和 sitemap URL 统一通过 `lib/seo.ts` 生成。
- 新增工具时同步补充 `app/tools/[tool-name]/layout.tsx`，并使用 `buildToolMetadata()` 和 `ToolPageSeo`。
- 不要在页面中手写重复的结构化数据，避免和统一 SEO 数据源冲突。

## 6. 代码风格

- 优先使用中文注释和中文界面文案。
- 仅在复杂逻辑前添加必要注释，避免解释显而易见的代码。
- 不影响功能的 ESLint 警告可以保留或按需注释，但不要用大范围禁用掩盖真实问题。
- 保持格式和现有项目风格一致。

## 7. 命令与验证

- 不要主动执行 `pnpm dev`，除非用户明确要求本地启动服务。
- 项目已配置自动部署；通常不需要主动执行 `pnpm build` 或 `pnpm lint`。
- 如果用户要求完整验证，或改动涉及类型、构建、SEO 产物、路由生成等高风险区域，可以执行必要检查并在回复中说明结果。
- 推荐检查命令包括 `pnpm typecheck`、`pnpm lint`、`pnpm build`、`pnpm format:check`。
- E2E 自动化测试使用 Playwright，配置文件为 `playwright.config.ts`，测试放在 `tests/e2e/*`。
- E2E 命令包括 `pnpm test:e2e`、`pnpm test:e2e:ui`、`pnpm test:e2e:debug`；首次运行如果缺少浏览器，先执行 `pnpm exec playwright install chromium`。
- 默认情况下，Playwright 会通过 `webServer` 自动启动 `pnpm dev --hostname 127.0.0.1 --port <PORT>`，默认端口为 3000，可用 `PORT` 覆盖。
- `PLAYWRIGHT_BASE_URL` 用于指向已经运行的测试目标；设置后不会启动本地 dev server，例如可用于预览环境或线上 smoke test。
- 当前 E2E 配置固定 `workers: 1`，用于避免 Next/Turbopack 首次编译多个工具页时并行导航不稳定；不要随意改回并行，除非已经验证稳定。
- Playwright 产物 `playwright-report/`、`test-results/`、`.playwright-cli/` 不入库。
- Agent skill 安装产物 `.agents/` 和 `skills-lock.json` 只属于本地 Agent 环境，不是项目测试运行依赖，不要提交到 git。

## 8. 提交与发布

- 需要提交代码时，先确认工作区状态，避免混入无关改动。
- 自动部署由项目流程处理，不要擅自推送或发布。
- 发布 SEO 相关变更后，参考 `SEO_MONITORING.md` 完成 Search Console、百度站长和 Core Web Vitals 检查。
