# npm 依赖升级评估（2026-09-22）

检查全部 72 个直接依赖（含 devDependencies 与 npm 别名），核对 npm 官方 registry 的 latest、engines、peerDependencies，并审计完整锁文件依赖树。仅使用稳定版本。PNPM 固定 10.18.3，Node 声明维持 >=20.9.0；本机验证环境为 Node 22.23.2，不代表已经实测 Node 20。

## 逐包结果

| 包                            | 原声明        | 本次声明      | 最新稳定版 | 评估                                                                                                             |
| ----------------------------- | ------------- | ------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| @aws-sdk/client-s3            | ^3.1127.0     | ^3.1137.0     | 3.1137.0   | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |
| @babel/runtime                | ^7.29.7       | ^7.29.7       | 8.0.5      | 保留 Babel 7，与 @babel/core 7 及现有全局 override 配套；Babel 8 需整体迁移。                                    |
| @codemirror/lang-markdown     | ^6.5.2        | ^6.5.2        | 6.5.2      | 已是最新稳定版。                                                                                                 |
| @hookform/resolvers           | ^4.1.3        | ^5.9.1        | 5.9.1      | 升级：v5.9.1 声明支持 Zod ^3.25 和 react-hook-form ^7.55，当前表单无输入/输出转换。                              |
| @langchain/core               | ^1.2.9        | ^1.2.12       | 1.2.12     | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |
| @langchain/openai             | 1.5.8         | 1.5.8         | 1.5.13     | 保留：1.5.9 起要求 Node >=22，项目仍声明 >=20.9。                                                                |
| @modelcontextprotocol/client  | 2.0.0         | 2.0.0         | 2.0.0      | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-accordion     | ^1.2.20       | ^1.2.20       | 1.2.20     | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-alert-dialog  | ^1.1.23       | ^1.1.23       | 1.1.23     | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-checkbox      | ^1.3.11       | ^1.3.11       | 1.3.11     | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-collapsible   | ^1.1.20       | ^1.1.20       | 1.1.20     | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-dialog        | ^1.1.23       | ^1.1.23       | 1.1.23     | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-dropdown-menu | ^2.1.24       | ^2.1.24       | 2.1.24     | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-label         | ^2.1.15       | ^2.1.15       | 2.1.15     | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-popover       | ^1.1.23       | ^1.1.23       | 1.1.23     | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-scroll-area   | ^1.2.18       | ^1.2.18       | 1.2.18     | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-select        | ^2.3.7        | ^2.3.7        | 2.3.7      | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-separator     | ^1.1.15       | ^1.1.15       | 1.1.15     | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-slider        | ^1.4.7        | ^1.4.7        | 1.4.7      | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-slot          | ^1.3.3        | ^1.3.3        | 1.3.3      | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-switch        | ^1.3.7        | ^1.3.7        | 1.3.7      | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-tabs          | ^1.1.21       | ^1.1.21       | 1.1.21     | 已是最新稳定版。                                                                                                 |
| @radix-ui/react-tooltip       | ^1.2.16       | ^1.2.16       | 1.2.16     | 已是最新稳定版。                                                                                                 |
| @types/jsonwebtoken           | ^9.0.10       | ^9.0.10       | 9.0.10     | 已是最新稳定版。                                                                                                 |
| @types/qrcode                 | ^1.5.6        | ^1.5.6        | 1.5.6      | 已是最新稳定版。                                                                                                 |
| @uiw/react-codemirror         | ^4.25.11      | ^4.25.11      | 4.25.11    | 已是最新稳定版。                                                                                                 |
| @vvo/tzdb                     | ^6.198.0      | ^6.198.0      | 6.198.0    | 已是最新稳定版。                                                                                                 |
| basic-ftp                     | ^5.3.1        | ^6.2.1        | 6.2.1      | 升级：v6 默认拒绝独立传输主机，提高 FTP bounce 防护；现有构造器和方法调用保持兼容。这类特殊 FTP 部署需另行适配。 |
| class-variance-authority      | ^0.7.1        | ^0.7.1        | 0.7.1      | 已是最新稳定版。                                                                                                 |
| clsx                          | ^2.1.1        | ^2.1.1        | 2.1.1      | 已是最新稳定版。                                                                                                 |
| date-fns                      | ^4.4.0        | ^4.4.0        | 4.4.0      | 已是最新稳定版。                                                                                                 |
| date-fns-tz                   | ^3.2.0        | ^3.2.0        | 3.2.0      | 已是最新稳定版。                                                                                                 |
| diff                          | ^8.0.4        | ^9.0.0        | 9.0.0      | 升级：当前仅使用 diffChars/diffWords/diffLines，v9 的 patch API 和 ES5 变更不涉及现有调用。                      |
| jsonwebtoken                  | ^9.0.3        | ^9.0.3        | 9.0.3      | 已是最新稳定版。                                                                                                 |
| lucide-react                  | ^0.476.0      | ^0.476.0      | 1.47.0     | 保留：0.x 到 1.x 跨越较多图标与导出变更，广泛用于工具页；需专门进行图标及视觉回归，本次不强推。                  |
| lunar-javascript              | ^1.7.7        | ^1.7.7        | 1.7.7      | 已是最新稳定版。                                                                                                 |
| mermaid                       | ^11.17.2      | ^11.17.2      | 12.0.0     | 保留：12 要求 Node >=22.12。                                                                                     |
| next                          | 16.3.4        | 16.3.5        | 16.3.5     | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |
| next-intl                     | ^4.14.2       | ^4.14.6       | 4.14.6     | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |
| next-themes                   | ^0.4.6        | ^0.4.6        | 0.4.6      | 已是最新稳定版。                                                                                                 |
| next-turnstile                | ^1.0.7        | ^1.0.7        | 1.0.7      | 已是最新稳定版。                                                                                                 |
| openai                        | ^4.104.0      | ^4.104.0      | 7.21.0     | 保留：7 要求 Node >=22；业务使用 LangChain，独立 SDK 的清理另行处理。                                            |
| pinyin-pro                    | ^3.29.3       | ^3.29.4       | 3.29.4     | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |
| qrcode                        | ^1.5.4        | ^1.5.4        | 1.5.4      | 已是最新稳定版。                                                                                                 |
| react                         | ^19.2.8       | ^19.3.0       | 19.3.0     | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |
| react-day-picker              | ^9.14.0       | ^9.14.0       | 10.0.1     | 保留：v10 删除旧 classNames/组件槽位，本地 Calendar 使用 table 样式键，需要迁移及视觉回归。                      |
| react-dom                     | ^19.2.8       | ^19.3.0       | 19.3.0     | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |
| react-hook-form               | ^7.87.0       | ^7.88.0       | 7.88.0     | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |
| react-markdown                | ^10.1.0       | ^10.1.0       | 10.1.0     | 已是最新稳定版。                                                                                                 |
| rehype-unwrap-images          | ^1.0.0        | ^1.0.0        | 1.0.0      | 已是最新稳定版。                                                                                                 |
| remark-gfm                    | ^4.0.1        | ^4.0.1        | 4.0.1      | 已是最新稳定版。                                                                                                 |
| sonner                        | ^2.0.8        | ^2.0.8        | 2.0.8      | 已是最新稳定版。                                                                                                 |
| sql-formatter                 | ^15.8.2       | ^15.8.2       | 15.8.2     | 已是最新稳定版。                                                                                                 |
| ssh2-sftp-client              | ^12.1.1       | ^12.1.1       | 12.1.1     | 已是最新稳定版。                                                                                                 |
| tailwind-merge                | ^2.6.0        | ^2.6.1        | 3.7.0      | 保留 2.x，与 Tailwind 3 配套；仅将声明下限对齐已锁定的 2.6.1。                                                   |
| tailwindcss-animate           | ^1.0.7        | ^1.0.7        | 1.0.7      | 已是最新稳定版。                                                                                                 |
| undici                        | 6.28.1        | 6.28.1        | 8.10.2     | 保留：8 要求 Node >=22.19；MCP 网络安全代码依赖 Agent/fetch。                                                    |
| vkbeautify                    | ^0.99.3       | ^0.99.3       | 0.99.3     | 已是最新稳定版。                                                                                                 |
| zod                           | ^3.25.76      | ^3.25.76      | 4.6.5      | 保留：业务表单和 API 使用 v3，v4 的错误结构、默认值及对象处理需要专项回归；独立测试别名 zod4 升级。              |
| @modelcontextprotocol/server  | 2.0.0         | 2.0.0         | 2.0.0      | 已是最新稳定版。                                                                                                 |
| @playwright/test              | ^1.63.0       | ^1.63.0       | 1.63.0     | 已是最新稳定版。                                                                                                 |
| @types/node                   | ^20.19.43     | ^20.19.43     | 26.6.2     | 保留 Node 20 类型基线，避免引入运行时不存在的 API。                                                              |
| @types/react                  | ^19.2.18      | ^19.3.0       | 19.3.0     | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |
| @types/react-dom              | ^19.2.7       | ^19.3.0       | 19.3.0     | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |
| @types/ssh2-sftp-client       | ^9.0.6        | ^9.0.6        | 9.0.6      | 已是最新稳定版。                                                                                                 |
| eslint                        | ^9.39.5       | ^9.39.5       | 10.11.0    | 保留：10 要求 Node ^20.19 / ^22.13 / >=24，高于声明的最低版本；9 已停止支持，应与运行时升级一起处理。            |
| eslint-config-next            | 16.3.4        | 16.3.5        | 16.3.5     | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |
| postcss                       | ^8.5.28       | ^8.5.28       | 8.5.28     | 已是最新稳定版。                                                                                                 |
| prettier                      | ^3.9.6        | ^3.9.8        | 3.9.8      | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |
| tailwindcss                   | ^3.4.19       | ^3.4.19       | 4.3.3      | 保留：AGENTS.md 明确要求 Tailwind 3，不主动迁移 v4。                                                             |
| typescript                    | ^5.9.3        | ^5.9.3        | 7.0.2      | 保留：5 到 7 跨两个主版本，需核对编译选项及 ESLint TypeScript 解析器支持范围，单独迁移。                         |
| zod4                          | npm:zod@4.5.4 | npm:zod@4.6.5 | 4.6.5      | 升级：同主版本更新，安装后执行类型、构建和逻辑回归。                                                             |

## overrides 与安全

升级 @codemirror/state 6.7.4 → 6.7.5、DOMPurify 3.4.14 → 3.4.15、yaml 2.9.0 → 2.9.1。新增 baseline-browser-mapping@>=2.0.0 <2.11.0 → 2.11.25，仅覆盖漏洞区间。其余 overrides 保留已有安全修复下限，不把传递依赖强行替换为不兼容的大版本。

升级前官方 audit 报告 1 项中危：GHSA-w5vr-8v7q-w6rv，路径 next → baseline-browser-mapping 2.10.21。默认 npmmirror 缺少 audit endpoint，审计已改用 npm 官方源，未修改用户全局 registry。

## 参考来源

- [npm 官方 registry](https://registry.npmjs.org/)：全部包的版本、引擎和 peer 信息。
- [Tailwind Merge v3 迁移说明](https://github.com/dcastil/tailwind-merge/blob/main/docs/changelog/v2-to-v3-migration.md)
- [DayPicker v10 迁移说明](https://daypicker.dev/upgrading)
- [basic-ftp v6 变更](https://github.com/patrickjuchli/basic-ftp/releases/tag/v6.0.0)
- [diff 发布记录](https://github.com/kpdecker/jsdiff/blob/master/release-notes.md)
- [baseline-browser-mapping 安全公告](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv)

## 验证结果与边界

- 共检查 72 个直接依赖；调整 17 个依赖声明，其中 16 个实际升级，tailwind-merge 仅提高声明下限（锁文件原已为 2.6.1）。
- `corepack pnpm install --frozen-lockfile`：通过，无 peer dependency 冲突提示。
- `corepack pnpm typecheck`：通过。
- `corepack pnpm lint`：通过，0 错误、64 条警告，未对业务代码自动修复。
- `corepack pnpm exec playwright test --config playwright.unit.config.ts`：47/47 通过，不启动开发服务器。
- `corepack pnpm build`：通过，包含中英文页面、API 路由和 SEO 静态产物生成。
- 补充运行检查：Zod 3 + resolver 5 的有效/无效 URL 校验通过；diff 9 三种比较函数均可重建原始中文输入；basic-ftp 6 构造器及超时参数检查通过。
- `corepack pnpm audit --registry=https://registry.npmjs.org --json`：943 个依赖条目，0 漏洞。
- 未执行浏览器 E2E、真实 FTP/S3/OpenAI 外部连接及 Node 20 环境测试；构造器检查不代表实际 FTP 传输验收。
- 安装仍提示 ESLint 9 停止支持，以及三个传递依赖 deprecated：@ungap/structured-clone、glob、node-domexception；deprecated 与安全漏洞分别评估。
- 用户原有文本对比页面改动保留。0.1.46 提交仅包含依赖与发布文档，未推送或部署。

## 提交前复核

- 版本：0.1.46。
- 对比原锁文件，新增包条目的 Node engines 均接受 20.9.0；这是声明检查，不能替代 Node 20 运行验证。
- 核对 React、React DOM 及类型包版本一致，Zod 3 与 resolver 5 配套，Next.js 与 eslint-config-next 同步。
- 未发现阻塞本次依赖升级提交的问题；FTP 独立传输主机行为变化和未完成的外部连接、浏览器验证仍以上述边界为准。
