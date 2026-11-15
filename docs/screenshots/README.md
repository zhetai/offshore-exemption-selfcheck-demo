# 截图说明 · Screenshots

本目录保存 README 与作品集使用的界面截图，全部由 Chrome 无头模式直接渲染 `index.html` 生成，未做后期修补。

| 文件 | 尺寸 | 内容 |
| --- | --- | --- |
| `overview.png` | 1440×1080 | 主界面：评分环、结论、计数、检查提示、清单首屏 |
| `full-page.png` | 1440×3300 | 完整清单长图，覆盖全部 7 个类别 |
| `mobile.png` | 520×1600 | 窄屏布局（单列、状态控件整行） |

## 重新生成

需要本机安装 Chrome（路径按实际情况调整），在仓库根目录执行：

```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$url = "file:///$($PWD.Path.Replace('\','/'))/index.html"

# 主界面
& $chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars `
  --virtual-time-budget=4000 --window-size=1440,1080 `
  --screenshot="docs\screenshots\overview.png" $url

# 长图
& $chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars `
  --virtual-time-budget=4000 --window-size=1440,3300 `
  --screenshot="docs\screenshots\full-page.png" $url

# 窄屏
& $chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars `
  --virtual-time-budget=4000 --window-size=520,1600 `
  --screenshot="docs\screenshots\mobile.png" $url
```

> `--virtual-time-budget` 用于跳过首屏 toast 的显示时间，使截图干净。
> 注意 Chrome 在 Windows 上的最小窗口宽度约为 500px，窄屏截图请使用 ≥ 520px 的宽度，否则会被裁切。

## 关于 GIF

本仓库暂未包含演示 GIF（体积较大，且仓库保持精简）。如需补充：

1. 按 `DEMO.md` 的步骤 4 录制「补一项关键材料 → 结论变化」的片段，≤ 15 秒、≤ 3 MB；
2. 保存为 `docs/screenshots/demo.gif`；
3. 在 `README.md` 的「演示截图/GIF」章节引用：

```markdown
![关键材料补齐后结论变化](docs/screenshots/demo.gif)
```

## 隐私要求

截图必须来自脱敏示例个案（默认载入的 `Sample Case A（脱敏）`）。不要使用真实客户名称、真实合同编号或含可识别信息的备注；如需展示真实个案结构，请先替换为占位内容再截图。
