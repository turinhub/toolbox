# Agent 工作指南

请始终使用中文回复。

## 1. 沟通原则

- 如果需求存在明显歧义，先向用户确认，不要直接修改代码。
- 如果可以通过阅读仓库文件确认事实，先检查项目结构、配置和现有实现。
- 修改前先说明准备改哪些文件和原因。
- 不要覆盖或回退用户已有改动；遇到无关的工作区变更时保持原样。

## 2. 项目技术栈

- 项目使用 Next.js 16 App Router、React 19、TypeScript、Tailwind CSS 3.4 和 shadcn/ui 风格组件。
- 包管理器使用 PNPM；当前要求 Node.js 20+、PNPM 9+。
- shadcn 配置在 `components.json`，当前为 `new-york` 风格、`neutral` 基色、CSS variables、lucide 图标。
- 主配色和全局样式在 `app/globals.css`，Tailwind token 映射在 `tailwind.config.ts`。
- 通用工具函数和配置放在 `lib/*`。
- 静态资源放在 `public/*`。

## 3. 代码组织

- 优先考虑服务端实现，尤其是 `lib/*` 中的方法。
- 只有确实需要浏览器状态、事件、剪贴板、文件上传、DOM API 或三方客户端组件的组件才标注 `"use client"`。
- 适当划分模块，保持低耦合；复杂逻辑应提取为独立 component、hook 或 lib 方法。
- 优先使用 `@/**` 路径别名，避免深层相对路径。

## 4. UI 设计原则

- Turinhub Toolbox 是工具型产品，界面应安静、清晰、可重复使用；优先让输入、输出、状态和操作路径一眼可扫。
- 第一屏直接呈现可用工具或工具列表，不做营销式落地页，不使用大幅装饰性 hero、渐变背景块或纯装饰插画。
- 页面布局以 `container`、`max-w-6xl`、`grid`、`flex` 和稳定间距为主；复杂工具优先使用双栏或多区域工作台，移动端自然折叠为单列。
- 信息密度可以偏高，但必须有明确分组：标题区、控制区、输入区、输出区、结果区、帮助/说明区分清楚。
- 卡片只用于独立工具面板、列表项、结果块和弹窗内容；不要把整段页面 section 做成悬浮卡片，也不要卡片套卡片。
- 视觉风格保持中性、克制：白底/暗色底、细边框、轻阴影、语义色点缀。避免单一色相统治页面，尤其避免大面积紫蓝渐变、米色/棕色/深蓝主题。

## 5. Tailwind 与 Design Token

- 不引入新的 UI 库；优先使用现有 `components/ui/*`、Radix 基础组件、`class-variance-authority`、`tailwind-merge` 和 `cn()`。
- 不主动迁移 Tailwind v4。当前仓库继续使用 `tailwind.config.ts`、`@tailwind base/components/utilities` 和 `app/globals.css` 中的 HSL CSS variables。
- 新增颜色必须先判断是否能复用语义 token：`background`、`foreground`、`card`、`popover`、`primary`、`secondary`、`muted`、`accent`、`destructive`、`border`、`input`、`ring`、`sidebar`、`chart-*`。
- 避免在页面中散落硬编码颜色；确需表达 JSON、代码、状态或图表语义时，优先使用现有 token、`chart-*` 或同时验证亮暗色对比。
- 圆角使用现有 token：`rounded-sm`、`rounded-md`、`rounded-lg`、`rounded-xl`。工具卡片和控件默认不超过现有 `Card` 风格。
- 字体使用项目默认 sans 和 mono；代码、JSON、SQL、Token、时间戳等固定宽度内容使用 `font-mono`。
- 间距使用 Tailwind 标准尺度，常用页面节奏为 `gap-6`/`gap-8`、卡片内容 `p-4`/`p-6`、紧凑工具栏 `gap-2`/`gap-3`。
- 动效只用于状态反馈、展开收起和轻量过渡；优先写明确属性，例如 `transition-colors`、`transition-opacity`、`transition-transform`，不要使用 `transition-all`。

## 6. 组件使用规范

- 使用 shadcn/ui 组件，但不要随意改 `components/ui/*` 下的基础组件；页面级差异通过 `className`、组合组件或局部 wrapper 解决。
- 新增 shadcn/ui 组件时使用 `pnpm dlx shadcn@latest add <component>`，不要直接安装新的 UI 组件库或手写一套平行基础组件。
- 按控件语义选组件：命令用 `Button`，导航用 `Link`，二选一/开关用 `Switch` 或 `Checkbox`，模式切换用 `Tabs`，枚举选项用 `Select`，数字范围用 `Slider` 或数字输入。
- 图标优先使用 `lucide-react`；按钮内图标尺寸保持 `size-4` 或 `h-4 w-4`，页面标题图标通常 `h-5 w-5`。
- 图标按钮必须有可访问名称：传入可读文本、`aria-label`，或配合 `Tooltip`。装饰性图标设置 `aria-hidden="true"`。
- 通知组件使用 `sonner`，不要新增旧式 toast 实现。异步成功、失败、复制、下载、上传等反馈文案要具体。
- 破坏性操作使用 `destructive` 语义，并提供确认弹窗或撤销窗口；不要立即执行不可逆操作。

## 7. 页面与工具布局

- 工具页顶部使用简短标题和说明：`h1` 为工具名，说明控制在一到两行，避免把使用教程塞进第一屏。
- 核心工作区优先采用稳定结构：
  - 单输入单输出工具：桌面端可用双栏 `lg:grid-cols-2`，移动端单列。
  - 多控制项工具：控制区放在输入/输出上方，使用 `flex flex-wrap items-center gap-3`，避免横向溢出。
  - 长结果或代码结果：使用固定最小高度、`overflow-auto`、`font-mono`、`break-words` 或 `whitespace-pre-wrap`。
- 列表和卡片网格使用响应式轨道，例如 `sm:grid-cols-2 lg:grid-cols-3`；列表项内含长文本时给 flex 子项加 `min-w-0`，文本使用 `truncate`、`line-clamp-*` 或 `break-words`。
- 工具栏按钮在移动端允许换行；图标按钮保持稳定尺寸 `h-9 w-9`，文字按钮避免因 loading 或动态文案造成布局跳动。
- 空状态、错误状态、加载状态和无结果状态必须显式呈现，不渲染破碎面板。

## 8. 表单与输入

- 每个表单控件必须有关联的 `Label`、`htmlFor`、包装 label 或 `aria-label`。
- 输入框设置有意义的 `name`、合适的 `type`、`inputMode` 和 `autoComplete`；代码、Token、URL、邮箱等按语义关闭拼写检查。
- 不阻止粘贴；开发者工具类页面应默认欢迎粘贴长内容。
- 错误信息显示在字段附近，说明修复方式；提交失败时优先聚焦第一个错误字段。
- 占位符使用示例型文案，中文界面中需要省略时使用中文省略号或 `…`，例如 `粘贴 JSON 内容…`。
- 文件上传、下载、复制、清空、重置等动作必须有成功/失败反馈；复制按钮应处理剪贴板失败场景。
- 受控输入要保持每次按键成本低；大型文本编辑、格式化和实时预览必须防抖或显式触发。

## 9. 可访问性与交互

- 优先使用语义 HTML：动作是 `<button>`，导航是 `<Link>`/`<a>`，表格数据用 `<table>`，标签用 `<label>`。
- 不使用 `<div onClick>` 或 `<span onClick>` 伪装交互元素；确需自定义交互时必须补齐键盘事件、角色和焦点管理。
- 所有可交互元素必须有可见 `focus-visible` 状态；不能只写 `outline-none` 而没有替代焦点样式。
- hover、active、focus 状态要有明确视觉反馈，且焦点对比度高于普通 hover。
- 页面标题层级保持顺序：每页一个清晰 `h1`，后续按区域使用 `h2`/`h3`。
- 布局中提供可触达的主内容区域；新增全局布局时考虑 skip link。
- 弹窗、抽屉、下拉、命令面板使用现有 Radix/shadcn 组件，确保焦点陷阱、Esc 关闭和滚动锁定正常。
- 移动端点击目标建议不小于 44px；抽屉和弹窗内容设置合理滚动边界，避免背景误滚。

## 10. 文案、排版与本地化

- 界面文案优先中文，语气直接、具体、面向行动；按钮写具体动作，例如 `复制结果`、`格式化 JSON`、`下载文件`。
- 标题使用简洁名词或动宾短语，不写过度营销文案。
- 错误文案说明下一步，不只写 `失败` 或 `错误`。
- 数字、日期、时间、货币使用 `Intl.NumberFormat`、`Intl.DateTimeFormat` 等本地化 API，不硬编码格式。
- 对比数据、时间戳、大小、价格、计数等使用 `tabular-nums`。
- 标题可用 `text-balance` 或 `text-pretty` 改善换行；长用户内容必须能换行或截断，不能撑破容器。
- 品牌名、代码 token、环境变量、文件名等可加 `translate="no"`，避免浏览器自动翻译破坏含义。

## 11. 暗色模式与主题

- 所有新增界面必须同时检查亮色和暗色模式，使用语义 token 保证对比度。
- 不写只适用于亮色的固定背景，例如纯 `bg-white` 配深色文字；必须有暗色替代或改用 `bg-background`、`bg-card`、`bg-muted`。
- 原生 `select`、文件输入、代码块、预览面板和 iframe 周边要特别检查暗色模式。
- 图表、状态色和代码高亮不能只靠颜色传达信息；必要时增加图标、文本或边框。

## 12. 性能与稳定性

- 避免渲染时读取布局信息，例如 `getBoundingClientRect`、`offsetWidth`、`scrollTop`；如需测量，在 effect 中批量读写。
- 超过 50 项的长列表需考虑分页、搜索、折叠、虚拟化或 `content-visibility: auto`，不要无约束渲染大数组。
- 图片必须有 `alt`；非装饰图片设置明确宽高或使用 Next/Image 防止 CLS。首屏关键图优先加载，非首屏懒加载。
- 交互状态应避免造成布局位移；loading 文案、spinner、图标和按钮宽度要稳定。
- 动画尊重 `prefers-reduced-motion`，并优先只动画 `opacity` 和 `transform`。

## 13. SEO 与路由

- 工具路由、标题、描述、关键词、FAQ、更新时间等 SEO 数据以 `lib/routes.ts` 为单一数据源。
- 页面 metadata、canonical、Open Graph、Twitter card、JSON-LD 和 sitemap URL 统一通过 `lib/seo.ts` 生成。
- 新增工具时同步补充 `app/tools/[tool-name]/layout.tsx`，并使用 `buildToolMetadata()` 和 `ToolPageSeo`。
- 不要在页面中手写重复的结构化数据，避免和统一 SEO 数据源冲突。
- 如果工具有可分享状态，优先让 URL 反映 tab、过滤、分页、展开项等状态；不要把重要状态只藏在 `useState`。

## 14. 代码风格

- 优先使用中文注释和中文界面文案。
- 仅在复杂逻辑前添加必要注释，避免解释显而易见的代码。
- 不影响功能的 ESLint 警告可以保留或按需注释，但不要用大范围禁用掩盖真实问题。
- 保持格式和现有项目风格一致。

## 15. UI 评审清单

- 是否复用了现有 `components/ui/*`、`cn()`、语义 token 和 lucide 图标，没有引入新 UI 库。
- 亮色和暗色模式是否都可读，hover/focus/disabled/loading/error 状态是否完整。
- 所有按钮、链接、输入、图标按钮、弹窗和 toast 是否满足可访问性要求。
- 长文本、空数据、错误数据、大输入、大结果是否不会撑破布局。
- 移动端是否单列可用，点击目标是否足够大，工具栏是否不会横向溢出。
- 表单是否有 label、正确 type/name/autocomplete/inputMode、内联错误和可恢复反馈。
- 动效是否避免 `transition-all`，并尊重 reduced motion。
- 文案是否具体、中文优先、错误可行动，数字和日期是否本地化。

## 16. 命令与验证

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

## 17. 提交与发布

- 需要提交代码时，先确认工作区状态，避免混入无关改动。
- 自动部署由项目流程处理，不要擅自推送或发布。
- 发布 SEO 相关变更后，参考 `SEO_MONITORING.md` 完成 Search Console、百度站长和 Core Web Vitals 检查。
