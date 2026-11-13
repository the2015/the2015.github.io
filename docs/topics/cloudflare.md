---
title: Cloudflare 实战：从域名接入到故障排查
description: 按问题选择 DNS、GitHub Pages 域名、HTTPS、525、Tunnel 和缓存教程，逐层验证 Cloudflare 的访问链路。
---

# Cloudflare 实战笔记

面向自己部署网站、管理域名的个人开发者。六篇文章围绕同一条链路展开：**DNS → TCP → TLS → HTTP → 应用**。先找失败在哪一层，再改变一个变量做对照。

## 你现在遇到什么问题

| 问题 | 从这里开始 | 读完能验证什么 |
| --- | --- | --- |
| 不知道解析在哪改、橙云是否生效 | [DNS、橙云与灰云](/posts/cloudflare-dns-proxy) | 权威 DNS、代理状态与实际响应 |
| 给 GitHub Pages 绑定域名 | [博客独立域名](/posts/cloudflare-github-pages-domain) | 域名归属、解析、HTTPS 和站点地址 |
| Full、Full (strict)、Origin CA 分不清 | [两段 HTTPS 与源站证书](/posts/cloudflare-https-origin-cert) | 两段 TLS、证书信任与域名匹配 |
| 网站返回 525 | [一次 525 排查实录](/posts/cloudflare-525-troubleshooting) | 用本机与公网、HTTP 与 HTTPS、SNI 对照定位 |
| 想临时分享本地服务 | [Cloudflare Tunnel](/posts/cloudflare-tunnel-local-service) | 本地服务、隧道路由和访问控制 |
| 更新后仍看到旧内容 | [缓存分层排查](/posts/cloudflare-cache-debugging) | 构建、托管、边缘和浏览器中的内容版本 |

## 从零开始的阅读顺序

按上表从上往下阅读。已有基础时可以直接看 525 案例，它保留了命令、历史结果和判断边界：这次定位到接入平台的备案拦截，不代表所有 525 都由相同原因引起。

这些教程中的域名、IP 和配置需要换成自己的值；其中的步骤说明与真实历史结果已在各篇区分。

## 读完之后

- [个人项目部署](/topics/deployment)：把博客和独立域名串成一条可验证的发布流程。
- [零成本自动化](/topics/automation)：用 GitHub Actions 把重复工作定时跑起来。
- [订阅更新](/subscribe)或在 [GitHub Issue](https://github.com/the2015/the2015.github.io/issues) 补充你的排查结果。
