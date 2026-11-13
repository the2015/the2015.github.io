---
title: 个人项目部署：VitePress 与 GitHub Pages
description: 从 VitePress 本地写作到 GitHub Actions 构建、GitHub Pages 发布，再到域名和缓存验证的完整阅读路线。
---

# 个人项目部署

以这个博客为例，把本地文件变成可访问的网站。重点是每一步都有可检查的结果。

| 阶段 | 文章 | 验证重点 |
| --- | --- | --- |
| 选择工具 | [Hello VitePress](/posts/hello-vitepress) | Markdown、静态构建和托管的分工 |
| 自动发布 | [部署到 GitHub Pages](/posts/deploy-to-github-pages) | 构建输出、Actions 状态和线上页面 |
| 绑定域名 | [给博客绑定独立域名](/posts/cloudflare-github-pages-domain) | 归属验证、DNS、证书和站点地址 |
| 更新排障 | [更新后还是旧内容？](/posts/cloudflare-cache-debugging) | 新内容是否停在构建、托管、边缘或浏览器 |

## 复用本站

[博客源码](https://github.com/the2015/the2015.github.io)包含 VitePress 配置、文章和部署工作流。复用时应替换站点名称、域名、仓库链接和自己的文章内容。

发布后直接打开一篇文章并刷新，同时检查 CSS、脚本和 RSS；首页能打开并不能证明所有路由都正常。

## 继续阅读

- [Cloudflare 实战笔记](/topics/cloudflare)：理解域名、代理和 HTTPS。
- [零成本自动化](/topics/automation)：把 GitHub Actions 用到日报和通知。
- [订阅更新](/subscribe)，或在 [GitHub Issue](https://github.com/the2015/the2015.github.io/issues) 讨论部署过程。
