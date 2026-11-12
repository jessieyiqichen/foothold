# A3 计划：Nudge（暂名）· 督促你做「不喜欢但重要」的事

## Context

DBS Assignment 3 要求做一个每天/每周用的小工具，围绕三条流程（首访、主任务、回访）构建，Next.js + Tailwind + localStorage，部署 Vercel，10 月 20 日周二 17:30 截止。本人选题：大目标（LinkedIn 500 connections、每天投 3 份简历）拆成每日配额，主动提醒、「强迫」开始，没做就用鼓励的口吻多次提醒。项目已建在 `~/projects/dbs-a3`（Next 16.4.2、React 19.3，仅脚手架 + AGENTS.md / log.md / research.md）。

已定（本人确认）：通用目标；首访四条（先出数字、做 1 个就算打卡、落后越催越密、漏一天不算失败）；额外步骤全要（多目标、一次记多个 + 撤销、暂停、导出/导入）；提醒 = 日历 .ics + 网页通知；新做一套「督促」视觉风格。

## 主流程（README 用的那句话）

I pick a goal → it tells me today's number and I do the first one now → if I haven't started, it nudges me again (and again) → I come back and see how close I am.

## 路由（每一步一个页面，共享导航 Today / Goals / Reminders）

| 路由 | 流程步骤 | 内容 |
|---|---|---|
| `/` | 首访 + 每日任务 + 回访 | 无目标：「What have you been putting off?」+ 3 个示例（LinkedIn 500 by Dec 1 / Apply to 3 jobs a day / Write my own），点一下即创建并显示今天的数字。有目标：最该做的那个放最大（今天的数字、督促语、`Open LinkedIn` + `+1` 主按钮、「记多个」），其余目标列在下面；回访时顶部「Welcome back」+ 自上次以来的变化 |
| `/goals/new` | 表单 | 新建目标（单列）：What / Type（by a date · every day）/ Target / Unit / Deadline / Link（可选）。编辑复用 `/goals/[id]/edit` |
| `/goals` | 管理 | 全部目标、暂停/恢复、删除（确认）、导出/导入备份 |
| `/goals/[id]` | 回访 | 进度：已完成 / 目标、累计线 vs 理想线（纯 SVG）、连续天数、每日记录、休息日 |
| `/reminders` | 回访的入口 | 提醒时间（默认 10:00 / 15:00 / 20:00）、开启网页通知、下载日历文件，并如实说明两者的区别 |

每个子页面有「← Back」和导航高亮，告诉用户在哪、怎么回去。

## 数据与逻辑（`src/lib/`，纯函数，先写测试）

- `storage.ts`：单键 `nudge:v1`，`{ goals, entries, settings, lastVisit }`；读取时手写类型校验（不加 zod），损坏则提示「导出原始数据 / 重置」；localStorage 不可用时顶部提示「这个浏览器不会保存」。客户端组件按 Next 16 文档的 `use(browser())` + `<Suspense>` 模式读取，避免 hydration 不一致（`node_modules/next/dist/docs/01-app/02-guides/single-page-applications.md`）。
- `quota.ts`：
  - by-date：今天配额 = ceil(剩余 / 剩余有效天数)，有效天数扣除暂停日；配额高于初始基线时给出原因（「昨天差 6 个，所以今天 21 个」）。
  - every-day：配额 = 目标数。
  - 打卡：当天 ≥1 即算没断；每个自然周 1 个自动休息日不断连续天数。
  - 状态：not started / started / done / ahead / behind / paused / complete / deadline passed；首页按紧急度排序（没开始且落后的最前）。
- `nudges.ts`：督促语模板按「状态 × 力度（gentle → firmer → last call）」分组，按日期轮换、不与昨天重复；永远鼓励，不羞辱。
- `ics.ts`：从今天到截止日（最多 30 天）每天一个事件，每个带配置时间的 VALARM 和当天轮换的文案，链接回工具；文案写明「做完了就忽略这条」。浏览器里用 Blob 下载，不走服务器。
- `notify.ts`：页面开着且已授权时，按今天剩余的提醒时间 setTimeout；触发时重新检查，今天已开始就不响；最后一个时间之后仍未开始，再补一条 22:30「last call」。每天上限 4 条。
- `validate.ts`：错误贴在字段旁、说下一步怎么做，保留已输入内容，提交时聚焦第一个错误：
  - What 空 →「Enter what you want to do, like "Send connection requests".」
  - Target 非正整数 →「Enter a whole number, like 500.」
  - Deadline ≤ 今天 →「Pick a date after today.」
  - 配额过高（软提示，不拦）→「That's 84 a day. Pick a later date or a smaller number?」
  - Link 非 http(s) →「Paste a full link that starts with https://」
  - 导入文件不合法 →「This file isn't a Nudge backup. Choose the .json file you exported.」

## 共享组件（`src/components/`）

`Button`（primary / secondary / ghost / danger）、`Field`（label + hint + error，`aria-describedby`、`aria-invalid`）、`TextInput` / `NumberInput` / `DateInput` / `Select`、`ProgressBar`、`Toast`（含 Undo，`aria-live`）、`Nav`、`PageHeader`（标题 + Back）、`GoalCard`。所有页面只用这些。

## 视觉

先用中性 token 把流程做通，再定「督促」风格：大数字、强对比、全页只有一个醒目主按钮，偏「陪练」。token 写在 `globals.css` 的 Tailwind v4 `@theme`，定稿前请本人看样式再定。对比度用脚本逐对检查（≥4.5:1），键盘焦点清晰可见。

## 文档

`flows.md`（Mermaid：首访、每日任务、回访三张图，含错误与状态分支）→ 嵌入 `README.md`；README 另含：工具介绍、研究结论（链 research.md）、本人决定、提醒限制说明、无障碍检查、First-run check 反馈与改动。`log.md` 每轮记录。

## 提交顺序（每步一个小 commit，点名加文件）

1. `docs: flows.md` + README 骨架
2. `test` + `feat`：storage、quota、nudges、validate（vitest，唯一新增开发依赖）
3. 共享组件 + 导航布局
4. 首访（`/` 空状态 + 示例）
5. 每日任务（`/` 焦点卡、+1、记多个、撤销）
6. 表单 `/goals/new`、编辑
7. `/goals` 管理、暂停、导出/导入
8. `/goals/[id]` 进度
9. `/reminders`：ics + 网页通知
10. 视觉风格（本人确认后）
11. 无障碍与对比度检查
12. 部署（建 GitHub 仓库、连 Vercel，**先问本人**）→ First-run check → 按反馈修改 → README 收尾

## 验证

- `npm test`（lib 覆盖率 ≥80%）、`npm run lint`、`npm run build`。
- 内置浏览器跑本地 dev：清空 localStorage 走首访；故意提交空表单、负数、过去日期，确认错误位置与保留内容；刷新后数据仍在；把系统日期相关逻辑用测试模拟「隔天回来」和「漏一天」；只用 Tab / Enter 走完三条流程；390px 与 1440px 无横向滚动。
- 下载的 .ics 导入苹果日历确认提醒时间与文案。
- 部署后让子代理以新用户身份执行「Add three things you need to push yourself on this week」，再模拟隔天回来，收集可用性反馈写进 README。
