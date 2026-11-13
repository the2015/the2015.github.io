---
title: 零成本自动化：GitHub Actions、RSS 与微信通知
description: 从开源笔记本行情日报开始，学习用 GitHub Actions 定时汇总 RSS 并推送微信，理解免费用量、降级和数据边界。
---

# 零成本自动化

把每天重复的收集、过滤和通知交给小脚本，留下可以复查的运行结果。这一栏面向希望少维护一台服务器的个人开发者。

## 先看一个可以改的项目

[不花一分钱，GitHub Actions 每天给我推笔记本行情](/posts/notebook-market-daily)用 RSS 汇总硬件资讯，按关键词筛选，再通过 Server酱或企业微信群机器人通知。

```text
RSS → 关键词过滤 → Markdown 日报 → 微信通知
                    ↑
           GitHub Actions 定时运行
```

- **想看设计取舍**：[阅读实践复盘](/posts/notebook-market-daily)。
- **想自己运行**：[打开 notebook-market-daily 仓库](https://github.com/the2015/notebook-market-daily)，按文章的[上手步骤](/posts/notebook-market-daily#复制项目前先改这个条件)调整工作流所有者条件，再配置 Secrets。
- **先不配通知渠道**：可先查看 Actions 运行结果，确认数据获取成功后再加通知。

它是资讯标题汇总，不是完整价格数据库，也不保证覆盖券后价或付费市场统计。免费额度、通知服务与 RSS 来源的限制，应以当前平台规则和仓库说明为准。

## 可以迁移的思路

先选稳定数据源，再限定关键词和输出长度；给任务设超时和最小权限；数据源或推送渠道失败时保留明确状态，避免把“没有拿到数据”误读成“没有变化”。

同样的 GitHub Actions 也用于[发布这个博客](/posts/deploy-to-github-pages)。一个负责定时汇总，一个负责提交后的构建发布。

## 后续阅读

后续计划补充定时任务未执行的排查，以及新数据源接入的完整验证过程。已发表内容见[全部文章](/posts/)，更新可以通过 [RSS](/feed.xml)接收；选题建议可以放在 [GitHub Issue](https://github.com/the2015/the2015.github.io/issues)。
