# Foothold v1 计划（11 月 10 日至 17 日）

提案：https://dbs-proposal-xi.vercel.app 。本仓库从 dbs-a5 复制而来（同一个 Clerk 应用、同一个 Supabase 项目，新表加 `fh_` 前缀，A4、A5 的表不动）。

## 一周切块

| 日 | 做什么 | 完成的标志 |
|---|---|---|
| 11-10 周一 | 仓库骨架；40 条标注集（evals/new-grad）；核实数据源 | 标注表等本人过一遍 |
| 11-11 周二 | 表：fh_companies、fh_postings、fh_judgments、fh_profiles、fh_cards、fh_messages；Scout worker 导入 YC JSON（6,387 家，含 isHiring、tags、team_size）和 HN 当月帖（326 条） | 库里有公司和岗位 |
| 11-12 周三 | Judge：Gemini 判 Yes / Maybe / No 并引用原文一句；引文自动核对存在；eval 脚本对 40 条算一致率 | 一致率有数，目标 80% |
| 11-13 周四 | 注册后建档：粘贴简历文本（PDF 转文本），选兴趣标签 | 新用户三分钟内有档案 |
| 11-14 周五 | Insider（你的切入点：简历一句 + 公司一个事实）和 Connector（HN 发帖人及其邮箱，YC 页面的创始人链接）；卡片四行成型 | 一张完整卡片 |
| 11-15 周六 | 团队房间：worker 每完成一步写一条 fh_messages，Realtime 推到页面；卡片三栏 New / Saved / Reached out；「I reached out」按钮记一条 entry | 页面会自己动 |
| 11-16 周日 | 部署到 Vercel；五位同学注册；README；修问题 | 真实注册 |
| 11-17 周一 | 缓冲，交 v1 | |

## 2026-11-10 追加：v1 岗位数目标（本人要求）

v1 岗位数至少达到 Fast AI Jobs 的一半，约 2 万条。实测依据（11-10）：

| 来源 | 实测 | 说明 |
|---|---|---|
| YC 在招公司猜 slug 打 Greenhouse / Lever / Ashby | 120 家命中 47 家，658 条；推到 1,493 家约 8,200 条 | A4 接口代码现成 |
| a16z 清单 26 家 VC 招聘板 | 21 家可访问，只有两种平台：Getro 9 家、Consider 11 家；robots.txt 允许，有 sitemap | a16z 一家页面显示 18,791 条、692 家公司；Accel 713 家公司 |

做法：VC 板只取公司名单（sitemap 或公司页），岗位仍从各公司自己的招聘系统接口拿；同一公司按域名去重。日程改动：11-11 做接口探测和 a16z 名单，Judge 顺延到 11-12 至 11-13，建档和 Insider 各压缩半天。

## 顺序原则

Judge 的 eval 先于一切界面。11 月 17 日拿不出「一致率 X%」这个数，其它都不算完成。

## 复用

| 来自 | 用在 |
|---|---|
| A5 board-worker + Cron + Realtime | Scout 和四个队友的消息流 |
| A4 src/app/api/jobs（Greenhouse、Lever、Ashby） | v2 招聘系统接口 |
| A4 goals / entries / reminders | 「本周联系几家」目标、「I reached out」、七天回访 |

## 本人要做的

| 事 | 何时 |
|---|---|
| 过一遍 evals/new-grad/review.md，不同意的填「Your label」 | 11-11 前 |
| 在 GitHub 建仓库 jessieyiqichen/foothold 并推送 | 11-11 前 |
| 在 Google AI Studio 申请 Gemini API key，写入 .env.local 的 GEMINI_API_KEY | 11-12 前 |
| 找五位同学答应注册 | 11-16 前 |
