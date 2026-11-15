# 演示脚本 · DEMO

一份约 5 分钟的走查脚本，用于 Upwork 作品集录屏或现场演示。所有数据均为脱敏示例。

## 准备

```bash
python -m http.server 8080
# 或直接双击 index.html
```

打开 `http://localhost:8080`。首次访问会自动载入「示例个案 A（脱敏）」，评分 **70**，结论为 **存在阻断项，暂不可提交**。

> 如果浏览器里已有上一次的状态，点右上角「载入示例」还原。

## 演示步骤

| # | 操作 | 预期结果 | 讲解要点 |
| --- | --- | --- | --- |
| 1 | 观察左侧面板 | 评分环显示 70，结论红色「存在阻断项」 | 分数不低，但结论仍是不可提交——阻断项优先于总分 |
| 2 | 看「检查提示」 | 3 条：1 阻断、1 注意、1 提示 | 规则命中比分数更能说明「差在哪」 |
| 3 | 展开「申报与账目一致性」类别 | 类别得分 55% | 关键项「收入明细与账目核对表」缺失，直接触发阻断 |
| 4 | 把该项标记为「已齐备」 | 评分上升，阻断提示消失，结论变「需要补充或复核」 | 一条关键证据就能改变整体结论 |
| 5 | 在备注里写「已与总账核对，附收入明细表」 | 备注即时保存（刷新不丢） | 缺口说明用于交接与复核 |
| 6 | 切换主张类型为「服务 / 佣金」 | 适用项由 24 变 21，出现「服务交付证明」，提单等物流项消失 | 同一份清单按个案结构自适应 |
| 7 | 切回「货物买卖」，把「提单 / 空运单」改为「部分」 | 出现「买卖型个案以运输单据为核心证据」的警告 | 规则引擎按主张类型做交叉校验 |
| 8 | 点「导出 JSON」 | 下载 `selfcheck-<个案代号>-<时间>.json` | 报告含分数、分类别得分、规则命中与逐项状态，可归档对比 |
| 9 | 点「打印 / PDF」 | 打印预览隐藏按钮与状态控件，保留状态文字与备注 | 可直接交付复核人 |
| 10 | 点「重置」 | 清空为空白清单（分数 0，全部缺失） | 每个个案从干净状态开始 |

## 建议的录屏节奏

1. **0:00–0:20** 首屏 + 一句话定位：离岸豁免材料的完整性自检，不联网、不构成税务意见。
2. **0:20–1:20** 步骤 1–3：解释「阻断项优先于分数」，指出 9 个关键项。
3. **1:20–2:40** 步骤 4–6：补一项关键材料 → 结论变化；切换主张类型 → 清单自适应。
4. **2:40–3:40** 步骤 7–8：规则引擎的交叉校验，导出 JSON 并展示结构。
5. **3:40–4:30** 步骤 9：打印 / PDF 交付；再展示窄屏布局。
6. **4:30–5:00** 收尾：技术栈取舍（零依赖、可测试内核）与免责声明。

## 截图

仓库已包含以下真实截图（均由无头 Chrome 直接渲染，未做后期修补）：

| 文件 | 内容 |
| --- | --- |
| `assets/screenshot-main.png` | README 首屏主截图 1360×840 |
| `docs/screenshots/overview.png` | 主界面 1440×1080 |
| `docs/screenshots/full-page.png` | 完整清单长图 1440×3300 |
| `docs/screenshots/mobile.png` | 窄屏 520×1600 |

如需自行重新生成（需本机安装 Chrome）：

```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
& $chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars `
  --virtual-time-budget=4000 --window-size=1360,840 `
  --screenshot="assets\screenshot-main.png" "file:///$PWD/index.html"
```

## 可选的 GIF

录屏工具建议：Windows 用 [ScreenToGif](https://www.screentogif.com/) 或 Win+G；macOS 用 Kap。要求：

- 时长 ≤ 15 秒，宽度 ≤ 1200px，文件 ≤ 3 MB；
- 只演示步骤 4（补一项关键材料 → 结论变化）这一段，信息密度最高；
- 输出为 `assets/demo.gif`（README 的 `<details>` 折叠块已预留引用，放入后取消注释即可）。

## 发布清单（在线演示 / 60 秒视频）

README 首屏的两个入口目前是**明确标注的占位项**，需要人工补齐。任选一种托管方式即可，静态站点无需构建：

| 方式 | 操作 | 得到的链接 |
| --- | --- | --- |
| Cloudflare Pages | Direct Upload，上传仓库根目录（`index.html` + `assets/`） | `https://<project>.pages.dev` |
| GitHub Pages | 仓库 Settings → Pages → Deploy from branch → `main` / root | `https://zhetai.github.io/offshore-exemption-selfcheck-demo/` |
| Netlify Drop | 拖拽文件夹上传 | `https://<name>.netlify.app` |

部署完成后：

1. 把 README 顶部 CTA 表格中的「🔧 待部署 · human action required」替换为真实链接；
2. 录制 ≤ 60 秒讲解视频（Loom 不公开链接即可），替换「🔧 待录制」一行；
3. 确认线上页面能直接打开（不要要求访客下载仓库）。

> 🔧 `human_action_required`：在线演示地址、视频链接、`assets/demo.gif` 三项需要人工提供。在补齐之前，README 不会引导客户「下载后再找 index.html」。

## Upwork 作品集文案（可直接复制）

### English（粘贴到 Upwork Portfolio）

**Title:** Offshore Exemption Material Self-Check Tool — HK Profits Tax Documentation Audit

**Overview:**
A lightweight, browser-only self-check tool for Hong Kong companies preparing an offshore profits claim. It turns a filing cabinet of contracts, bills of lading, bank statements and internal emails into one repeatable checklist: 26 evidence items across 7 categories, filtered by claim type (trading, service/commission, manufacturing, IP).

Each item is marked ready / partial / missing / not applicable, and the tool immediately returns a weighted completeness score, blocking items, and a per-category gap list. Revenue recognised without matching bank statements, a trading claim without shipping documents, or a related-party list without pricing support are all flagged automatically. Export a JSON record for the file, or print to PDF for your accountant.

Everything runs locally in the browser — no account, no upload, no analytics. Zero dependencies, 19 unit tests on the scoring engine.

**Deliverables:** GitHub repository · bilingual README with screenshots · demo walkthrough (DEMO.md) · sanitized sample case · JSON/PDF export.

**Skills:** HTML · JavaScript · Compliance Automation · Documentation Review · GitHub

**Disclaimer:** Documentation completeness only. This is not tax, legal or accounting advice, and it does not guarantee that an offshore claim will be accepted. Consult a practising tax adviser before filing.

### 中文对照（给香港客户看）

**标题：** 离岸豁免材料自检工具 —— 香港利得税申报材料完整性盘点

**简述：** 面向准备离岸豁免申请的香港公司，把散落在合同、提单、银行月结单与内部邮件里的证据，整理成一张可重复使用的自检清单：7 个类别、26 个证据项，按主张类型（货物买卖 / 服务佣金 / 制造加工 / 知识产权）自动筛选。

每项标为「齐备 / 部分 / 缺失 / 不适用」后，立即得到加权评分、阻断项与按类别拆分的缺口清单：有收入却缺银行流水、买卖型个案缺提单、关联交易缺定价依据，都会被自动点名。可导出 JSON 留档，或打印成 PDF 交给会计师。

全部在本机浏览器完成，无需账号、不上传、不埋点；零依赖，评分内核有 19 个单元测试。

**交付物：** GitHub 仓库 · 含截图的双语 README · 演示走查脚本 · 脱敏示例个案 · JSON / PDF 导出。

**技能标签：** HTML · JavaScript · 合规自动化 · 文档复核 · GitHub（与仓库 topics 对应：`html` `javascript` `compliance` `self-check` `offshore-exemption` `portfolio` `upwork`）

**免责声明：** 仅做材料完整性自检，不构成税务或法律意见，不保证离岸豁免获批。正式提交前请咨询执业税务顾问。
