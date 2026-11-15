# 来源仓库登记 · Source Repositories

本文件记录本仓库的**来源与上下文**，以及「哪些内容取自哪里、哪些明确没有取」。

> 结论先行：本仓库是从零构建的独立演示，**未复制**下列任何仓库的代码、数据或文档正文。它们仅作为同方向的项目集登记在案，用于说明本工具的实务背景。

## 登记表

| 仓库 | 默认分支 | 角色 | 技术栈 | 与本仓库的关系 | 可见性 |
| --- | --- | --- | --- | --- | --- |
| `wanqushangpai-odoo` | `main` | 香港公司 Odoo 18 记账中台：Docker Compose 编排、SME-FRS 科目表、Airwallex 流水采集、离岸豁免辅助核算、CPA 底稿导出 | Odoo 18 · Python · PostgreSQL 16 · Docker | 账务与审计底稿来源；本工具 7 个证据类别中的「申报与账目一致性」「资金流」正对应其产出 | private |
| `wanqushangpai-odoo-infra` | `master` | 上述中台的一键部署、备份与运维 | Docker Compose · Nginx · Certbot | 部署层；与本工具无运行时依赖 | private |
| `group-sop` | `master` | 竞标 / 经纪 / PDF 解析引擎：需求解析、群内竞标、防串标监控、定标签约、验收付款 | React 19 · TypeScript · Vite · Cloudflare Workers · D1 · R2 | 同一业务方向的工程样例（前端 + 边缘后端） | private |
| `crypto-reconciliation-cleaner` | `main` | 单文件离线加密交易对账清洗器：本地 CSV/JSON 清洗、判重、成本基础缺口扫描 | 单文件 HTML/JS（零依赖、零构建） | 与本工具同一设计取向：纯本地处理、数据不出浏览器 | private |
| `outshore` | `main` | OUTSHORE 离岸证据链技术劳务落地页（Upwork 端） | 单文件 HTML/JS | Upwork 服务端页面，属于同一服务线 | private |

## 脱敏边界

| 类别 | 是否进入本仓库 | 说明 |
| --- | --- | --- |
| 上述仓库的源代码 | ❌ | 本仓库的 HTML/CSS/JS 全部为本项目重写 |
| 上述仓库的 README / 文档正文 | ❌ | 仅在本文件与 README 中以一句话摘要形式描述 |
| 客户名称、真实个案、真实申报数据 | ❌ | 示例个案为虚构内容（`Sample Case A（脱敏）`） |
| 密钥、令牌、`.env`、私钥 | ❌ | 本仓库经高置信 secret 扫描，零命中 |
| 上述仓库的仓库名与大致用途 | ✅ | 仅用于说明作品集的项目脉络；均为私有仓库，不含可访问内容 |
| 与 `wanqushangpai-odoo` 对应的证据类别划分 | ✅ | 仅抽象为通用清单结构（如「收入明细与账目核对表」），不含其实现 |

## 为什么没有把代码直接搬进来

1. **形态不同。** 五个仓库分别是 Odoo 18 应用、Docker 部署、React + Workers 应用、两个单文件页面；把它们拼进同一个仓库只会得到一个无法整体运行的大杂烩，反而不利于审阅者理解。
2. **私有内容不适合公开。** 其中包含客户记账配置、内部流程与竞标规则；公开传播既无必要也有风险。
3. **可审阅性。** 一个能在浏览器里直接打开、零依赖、带 19 个单元测试的小项目，比一堆无法运行的片段更能说明工程判断力。

如需把某一部分**脱敏后**并入本仓库，可按 `REQU.TXT` 的 `inputs.source_repos[].include_paths` / `exclude_paths` 指定范围，再走一次「提取 → 脱敏 → 扫描 → 人工复核」的流程；五个仓库的默认包含/排除规则已登记在 `REQU.TXT` 中。

## 访问

上述仓库为私有。如需演示、架构讲解或源码 walkthrough，请通过 <https://github.com/zhetai> 所列联系方式沟通。
