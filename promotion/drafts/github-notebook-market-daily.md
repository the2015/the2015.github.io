# 发布标题

按公开仓库免费额度设计的笔记本行情日报：GitHub Actions、RSS 与通知降级

# 短介绍

把几个 RSS 源汇总成 Markdown 报告，再交给 GitHub Actions 定时运行和可选通知通道发送。这个项目重点展示的是低依赖、可降级和可复查的自动化设计；它不是经过人工核实的行情终端，也不承诺所有账号在任何时期都没有费用。

# 正文

如果只是想每天快速扫一遍笔记本和硬件资讯，手动打开十几个网站既费时间，也不值得为此购买一套行情 API。我做了一个小型日报项目，把 RSS、关键词过滤、Markdown 输出和通知通道串在一个 GitHub Actions workflow 里：

[the2015/notebook-market-daily](https://github.com/the2015/notebook-market-daily)

## 整体流程

```text
RSS 数据源 ──► scripts/collect.sh ──► out/report.md ──► scripts/notify.sh ──► 微信
(IT之家/                                  (关键词过滤                  (Server酱 /
 TechPowerUp)                              汇总成 Markdown)             企业微信机器人)
```

方案按每天一次任务设计，workflow 使用北京时间 09:10 对应的 `10 1 * * *`，避开整点调度高峰。实际调度仍受 GitHub Actions 服务和仓库配置影响，不能把 cron 当成准点保证。

## 数据源和过滤

当前文章记录的来源包括：

- IT之家：国内数码资讯 RSS；
- TechPowerUp：海外硬件资讯 RSS；
- Ars Technica：前两个来源不可用时的备用 RSS；
- 京东：可选的商品标价接口，非官方、无 key，随时可能失效。

`collect.sh` 不把所有标题都推送出去，而是按关键词过滤。中文关键词包括“轻薄本、游戏本、拯救者、RTX、Ryzen”等，英文关键词包括“laptop、SSD、price cut”等；每个来源最多取 12 条，报告更适合快速浏览。

抓取和解析使用 bash 加内嵌 Python 标准库的 `re` 与 `html`，没有额外 pip 依赖。这样可以减少 runner 上的安装步骤和依赖漂移，但不代表外部 RSS 源永远稳定。

## 通知通道的降级顺序

1. 优先使用 Server酱，在仓库 Secrets 中配置 `SCT_KEY` 后通过个人微信接收；
2. 也可以配置 `WEWORK_WEBHOOK`，使用企业微信群机器人 webhook；
3. 两者都未配置时，报告仍输出到 Actions 日志，任务可以继续完成。

密钥全部放在仓库 Secrets 中，代码里不出现任何凭据。“未配置通知也能产出报告”是刻意设计的降级路径，适合先验证采集流程，再决定是否接入消息通道。Secret 名称和使用方式以仓库当前 workflow 为准。

## 给免费额度加三个护栏

这个方案按公开仓库可用的免费额度来设计，但免费政策、额度和计费规则可能变化，使用前应核对 GitHub 当前文档。workflow 中可以看到几项与费用和故障隔离有关的设置：

- `timeout-minutes: 5`：异常时限制单次运行时间；
- `retention-days: 1`：报告只保留很短时间，减少存储占用；
- `runs-on: ubuntu-latest` 与 `permissions: contents: read`：使用 Linux runner，并保持最小读取权限。

这些设置只是防护措施，不能替代查看 Actions 用量，也不能保证所有账号和所有来源都处于免费范围。

## 使用边界

- 京东部分是标价，不是券后到手价；接口非官方，可能失效。
- 报告是机器汇总的标题清单，没有做事实核实，重要结论要打开原文确认。
- 报告不包含 IDC、Canalys 等付费数据的官方出货量明细。
- GitHub 的定时 workflow 可能受长期无活动等平台规则影响；需要持续运行时，应按 GitHub 当前规则检查并偶尔复核任务状态。
- RSS 源、通知服务和第三方接口都有自己的可用性边界，日报生成成功不等于每个来源都完整。

因此，项目的目标是降低每天收集信息的重复劳动，而不是替用户做购买决策。报告末尾保留口径说明，比把机器结果写成权威结论更可靠。

## 如何开始

先注意一个与 Fork 直接相关的 workflow 条件：当前报告 job 带有 `if: github.repository_owner == 'the2015'`。它会让原仓库按预期运行，但 Fork 后所有者变成你的 GitHub 用户名，条件不满足时报告 job 会被跳过。因此，这个项目不能表述为“Fork 后直接就能跑”。

1. Fork 仓库后，先打开 Actions，启用 workflow，并阅读 `.github/workflows/daily.yml`、`scripts/collect.sh` 和 `scripts/notify.sh`；
2. 在自己的 Fork 中，把报告 job 的 owner 条件改成你的 GitHub 用户名，或在理解该条件用途后按自己的权限边界调整；
3. 先手动运行一次，检查 Actions 日志和生成的 Markdown，确认报告 job 没有被 skip；
4. 验证采集正常后，再在仓库 Secrets 中配置 `SCT_KEY` 或 `WEWORK_WEBHOOK`，并确认凭据没有进入脚本或日志；
5. 最后核对 workflow 的定时配置和 Actions 状态，确认后续定时任务是否按预期执行。

没有配置通知 Secret 时，报告仍可输出到 Actions 日志；Fork 后的任务是否成功，还取决于你对 workflow 条件、Actions 权限和数据源可用性的调整。

项目源码和可复制的 workflow：

- [the2015/notebook-market-daily](https://github.com/the2015/notebook-market-daily?utm_source=github&utm_medium=post&utm_campaign=blog-launch-2026-11&utm_content=notebook-daily)
- [项目设计说明：GitHub Actions 每天推送笔记本行情](https://the2015.github.io/posts/notebook-market-daily?utm_source=github&utm_medium=post&utm_campaign=blog-launch-2026-11&utm_content=notebook-daily)
- [博客 GitHub 仓库](https://github.com/the2015/the2015.github.io)

# 发布前说明

- 文章只描述仓库和原文已经记录的方案，不添加实时运行截图、虚构的成功次数或当前上游价格。
- 项目是否能按时运行、某个 RSS 是否可访问、通知是否送达，需要发布者在自己的 GitHub 账号和 Secrets 环境中单独验证。
- 所有费用表述均以“按免费额度设计”为限，不构成当前 GitHub 计费政策承诺。
