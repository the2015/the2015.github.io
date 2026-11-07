---
title: 域名接入 Cloudflare：DNS、橙云与灰云
date: 2026-11-07
description: 从域名注册商、DNS 和源站的关系入手，配置 Cloudflare 解析，并通过命令验证橙云和灰云的区别。
---

# 域名接入 Cloudflare：DNS、橙云与灰云

域名买在阿里云，服务器放在另一家云厂商，DNS 再交给 Cloudflare，这三个选择并不冲突。容易混淆的是：到底在哪个平台修改什么配置？

这篇先搭起一条最小访问链路。示例使用 `example.com` 和文档示例 IP `203.0.113.10`，操作时替换成自己的值。

## 先分清三个角色

| 角色 | 负责什么 | 本文示例 |
| --- | --- | --- |
| 域名注册商 | 购买、续费、修改域名的权威 nameserver | 阿里云 |
| DNS 服务商 | 管理 A、AAAA、CNAME、TXT 等解析记录 | Cloudflare |
| 网站托管方 | 运行 Nginx、应用或静态站点 | 自己的服务器或 GitHub Pages |

使用 Cloudflare 常见的完整接入方式，需要在注册商处把 nameserver 改成 Cloudflare 分配的那一组。域名仍然在原注册商续费；切换完成后，解析记录在 Cloudflare 管理。

仅在 Cloudflare 添加站点，却没有更换 nameserver，不能说明接入已经完成。

## 接入前，保留已有解析

先记录现有解析，尤其是邮件相关的 MX、SPF、DKIM 和 DMARC。Cloudflare 的自动扫描可以辅助导入，但仍应与原 DNS 控制台逐条核对。

如果原域名已经启用 DNSSEC，需要按官方迁移步骤处理旧 DS 记录，再切换 nameserver；旧 DS 与新 DNS 签名不匹配可能导致解析失败。不要把这种故障误判为网站服务器宕机。

接入步骤：

1. 在 Cloudflare 添加 `example.com`，选择适合的计划并核对 DNS 记录。
2. 复制 Cloudflare 分配的两个 nameserver。
3. 在域名注册商处修改 nameserver，使用实际分配值，不照抄他人的地址。
4. 等待 Cloudflare 显示域名已激活，再验证权威 DNS。
5. 如需 DNSSEC，按 Cloudflare 给出的 DS 参数在注册商处重新配置。

Linux、macOS 或安装了 `dig` 的环境：

```bash
dig NS example.com +short
dig A blog.example.com +short
```

Windows PowerShell：

```powershell
Resolve-DnsName example.com -Type NS
Resolve-DnsName blog.example.com -Type A
```

NS 查询应能看到 Cloudflare 分配的 nameserver。不同递归 DNS 和本机缓存的更新时间可能不同，单次查询到旧记录时，先核对权威侧配置。

## 橙云与灰云改变了哪一段

给服务器添加一条记录：

| 类型 | 名称 | 内容 | 代理状态 |
| --- | --- | --- | --- |
| A | `blog` | `203.0.113.10` | 先设为 DNS only |

灰云，也就是 **DNS only**，返回源站的解析结果。访问者直接连接源站，Cloudflare 不承接这条 HTTP/HTTPS 请求。

橙云，也就是 **Proxied**，返回 Cloudflare 的地址。请求先到 Cloudflare，再由它连接源站。

```text
灰云：浏览器 ───────────────→ 源站
橙云：浏览器 → Cloudflare → 源站
```

只有适用的 A、AAAA、CNAME 记录可以开启代理，MX、TXT 不走这种代理。域名验证用的 CNAME 通常也应保持 DNS only。

## 做一次可观察的对照

前提是源站已经能提供这个域名的 HTTPS 服务。先在灰云下测试，再开启橙云并重复：

```bash
dig A blog.example.com +short
curl -sS -D - -o /dev/null https://blog.example.com/
```

橙云接入后，解析结果应变成 Cloudflare 的地址，响应通常可见 `cf-ray` 等头。灰云则直接连接源站。只看浏览器是否打开页面，不足以判断请求到底经过了谁。

如果源站使用 Cloudflare Origin CA 证书，普通客户端直连会有信任问题。此时不要把切灰云当作无条件可用的回退方案，先阅读[HTTPS 与源站证书](./cloudflare-https-origin-cert)。

## 常见误解

**橙云不是任意端口的透明转发。** 普通 HTTP 代理有支持的端口范围，不能拿同一套配置直接代理 SSH；测试网站时先使用标准的 80、443 端口。

**解析正确不代表应用正常。** DNS、TCP、TLS、HTTP 是连续的几层，解析到地址只是第一步。遇到 525 可以接着看[这次真实排查](./cloudflare-525-troubleshooting)。

**源站条件不会被橙云替代。** Cloudflare 仍需访问源站；如果源站服务停了，或回源链路被阻断，边缘节点也不能凭空生成应用响应。

## 完成标准

能查到正确的权威 nameserver；DNS 记录与预期一致；可以解释当前请求走灰云还是橙云；网站返回预期状态与内容。这几项都成立后，再继续配置缓存和其他功能。

下一篇：[给 VitePress 博客绑定独立域名](./cloudflare-github-pages-domain)。

## 参考资料

- [Cloudflare：添加域名](https://developers.cloudflare.com/fundamentals/manage-domains/add-site/)
- [Cloudflare：Proxy status](https://developers.cloudflare.com/dns/proxy-status/)
- [Cloudflare：DNSSEC](https://developers.cloudflare.com/dns/dnssec/)
- [Cloudflare：支持的网络端口](https://developers.cloudflare.com/fundamentals/reference/network-ports/)
