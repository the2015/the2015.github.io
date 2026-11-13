---
title: 全部文章
description: 按 Cloudflare 云服务排障、GitHub Actions 自动化和个人项目部署阅读 the2015 的技术实践。
---

# 全部文章

首次访问可以先看 [Cloudflare 实战](/topics/cloudflare)、[零成本自动化](/topics/automation)或[个人项目部署](/topics/deployment)专题。想收到后续更新，可以[订阅 RSS](/subscribe)。

## 零成本自动化

- [不花一分钱，GitHub Actions 每天给我推笔记本行情](./notebook-market-daily) · 2026-11-13<br>用 RSS、关键词过滤和微信推送，搭一套有边界、能复查的日报。

## Cloudflare 实战笔记

从域名接入到故障排查，按下面的顺序阅读；按现象找入口可用[专题问题表](/topics/cloudflare)。

1. [域名接入 Cloudflare：DNS、橙云与灰云](./cloudflare-dns-proxy) · 2026-11-07<br>分清注册商、DNS 与源站，通过解析和响应头验证代理状态。
2. [给 VitePress 博客绑定独立域名](./cloudflare-github-pages-domain) · 2026-11-07<br>接续本站的 GitHub Pages 部署，配置域名验证、解析和 HTTPS。
3. [Cloudflare HTTPS：两段连接与源站证书](./cloudflare-https-origin-cert) · 2026-11-07<br>理解 Full (strict)、Origin CA 和 Nginx 的验证方式。
4. [一次 Cloudflare 525 排查实录](./cloudflare-525-troubleshooting) · 2026-11-07<br>用 HTTP、HTTPS 和 SNI 对照，把故障定位到云平台拦截。
5. [用 Cloudflare Tunnel 访问本地服务](./cloudflare-tunnel-local-service) · 2026-11-07<br>从临时分享测试页，到固定域名和访问控制。
6. [博客更新后还是旧内容？Cloudflare 缓存排查](./cloudflare-cache-debugging) · 2026-11-07<br>用独立 CSS 文件验证缓存命中、版本变化和按 URL 清理。

## 个人项目部署

- [部署到 GitHub Pages](./deploy-to-github-pages) · 2026-11-06<br>从 VitePress 构建到 Actions 发布，验证实际页面可访问。

## 随笔与写作

- [近期写作计划](./writing-plan) · 2026-11-06
- [Hello VitePress](./hello-vitepress) · 2026-11-06
