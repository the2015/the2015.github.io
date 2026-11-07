---
title: 博客更新后还是旧内容？Cloudflare 缓存排查
date: 2026-11-07
description: 区分构建产物、托管平台、Cloudflare 边缘和浏览器缓存，用一个独立 CSS 文件验证 MISS、HIT 与按 URL 清理缓存。
---

# 博客更新后还是旧内容？Cloudflare 缓存排查

文章已经提交，浏览器仍显示旧内容，第一反应往往是清缓存。但旧内容可能停留在构建产物、托管平台、Cloudflare 边缘或浏览器中的任何一层。

这篇先找出实际返回旧内容的层，再用一个独立测试文件验证缓存行为。下面的实验是操作步骤，不代表本站已经开启了这些缓存规则。

## 先确认新版本真的发布了

```text
Markdown → VitePress 构建产物 → GitHub Pages → Cloudflare → 浏览器
```

本地能看到新文章，只能说明源文件已修改。先确认构建成功、对应提交的 GitHub Actions 已完成部署，并在构建产物中找到新增的独特文字。

```powershell
pnpm build
Select-String -Path docs/.vitepress/dist/posts/hello-vitepress.html -Pattern '要核对的文字'
```

若产物中就没有新内容，清 Cloudflare 缓存无济于事。如果域名使用灰云，HTTP 请求根本不经过 Cloudflare 代理，应把排查重点放到托管平台和浏览器。

## 看正文，也看响应头

以下命令使用 Bash；Windows 可以使用 `curl.exe` 并将 `/dev/null` 换成 `NUL`：

```bash
curl -sS -D - -o /dev/null https://blog.example.com/posts/hello-vitepress
```

| 响应头或值 | 可以帮助判断什么 |
| --- | --- |
| `Cache-Control` | 响应声明的缓存策略，还需结合 Cloudflare 规则 |
| `CF-Cache-Status: HIT` | 当前响应由 Cloudflare 缓存提供 |
| `CF-Cache-Status: MISS` | 该次请求未命中相应边缘缓存 |
| `CF-Cache-Status: DYNAMIC` | 当前响应未被视为可缓存对象 |
| `CF-Cache-Status: BYPASS` | 某些源站指令或请求条件使缓存被绕过 |
| `Age` | 若存在，可辅助判断响应在缓存中的时间 |
| `ETag`、`Last-Modified` | 用于资源版本判断和条件请求 |

`MISS` 不代表配置失败，`HIT` 也不保证内容是最新版本。不同节点、缓存键、驱逐和重验证都会影响结果，需要同时检查正文。

## Cloudflare 默认不会缓存所有页面

默认缓存行为主要根据文件扩展名判断适用资源，HTML 和 JSON 默认不缓存。自定义 Cache Rules、Workers 和其他配置可以改变这个行为。

所以，对 VitePress 博客而言，HTML 显示 `DYNAMIC` 并不意外，静态 JS、CSS 则可能命中缓存。给整站套一个强制缓存规则，并不是必要的第一步。

`no-cache` 也不等于“永远不保存”，它强调使用前重验证；`no-store` 才表示不存储。具体边缘表现还受 Origin Cache Control 和规则覆盖影响，不能只凭某个响应头推断全部行为。

## 用独立 CSS 文件做实验

前提是 `blog.example.com` 已开启橙云。先记录现有规则及顺序，确保实验规则只影响测试路径。

### 1. 发布 v1 文件

在 VitePress 项目的 `docs/public/cache-demo.css` 中放入：

```css
/* cache-demo: v1 */
:root { --cache-demo-version: 1; }
```

构建并发布后，该文件应出现在站点根路径 `/cache-demo.css`。先请求确认正文是 v1：

```bash
curl -sS https://blog.example.com/cache-demo.css
```

### 2. 只对测试文件设置规则

在 Cloudflare 创建 Cache Rule，表达式限制到这个域名、路径和 GET 请求：

```text
(http.host eq blog.example.com
 and http.request.uri.path eq /cache-demo.css
 and http.request.method eq GET)
```

设置为 Eligible for cache。为了让实验有明确的边缘保留时间，可以只对这个公开测试文件覆盖源站缓存指令，将 Edge TTL 设为 2 小时；Browser TTL 保持尊重源站设置。保存前检查后续规则是否会覆盖这些字段。

这是一条实验规则，不是建议给全站统一覆盖 TTL。它不会缩短已经存在于浏览器中的缓存。

### 3. 连续观察同一个 URL

用 GET 请求，同时保留响应头和正文：

```bash
curl -sS -D - https://blog.example.com/cache-demo.css
curl -sS -D - https://blog.example.com/cache-demo.css
```

第一次可能是 `MISS`，后续可能看到 `HIT`。如果文件已经缓存，第一次直接 `HIT` 也正常。不保证每次请求都经过同一个缓存节点，必要时对比 `cf-ray` 和其他响应头。

### 4. 更新为 v2，再按 URL 清理

将文件修改为：

```css
/* cache-demo: v2 */
:root { --cache-demo-version: 2; }
```

构建并发布，确认对应部署已经完成。此时边缘仍可能返回 v1。在 Cloudflare 的 **Caching → Configuration → Purge Cache → Custom Purge** 中，按完整 URL 清理：

```text
https://blog.example.com/cache-demo.css
```

随后重新 GET，检查正文是否变为 v2，再观察后续缓存命中。不要把“点了清理按钮”当作验证完成。

本文使用默认缓存键。如果配置了把请求头、Cookie 等加入缓存键的自定义规则，控制台按 URL 清理可能不能覆盖相应变体，应按官方说明选择带完整缓存键参数的 API 或其他清理方式。

### 5. 清理实验配置

移除这条测试规则和 `docs/public/cache-demo.css`，重新构建发布，再清理测试 URL。保留其他原有规则。

## 为什么清边缘缓存后浏览器仍可能旧

清理 Cloudflare 缓存不会清理用户浏览器已经保存的文件。先用 `curl` 确认当前网络响应，再打开开发者工具，禁用浏览器缓存并刷新，区分本地缓存与边缘缓存。

给 URL 随意追加查询参数也不是可靠的清理方式：是否形成新的缓存项取决于缓存键如何处理查询字符串。

## 正式博客的缓存取舍

带内容哈希的 JS、CSS 适合较长缓存，因为内容变化会产生新文件名。HTML 应允许及时更新或重验证，避免长期引用过期资源。自定义文件只有真正做到“内容变则 URL 变”，才适合使用长期 `immutable` 策略。

登录页、用户资料接口、管理后台和携带身份信息的响应，应有明确的缓存隔离或 bypass 规则。不要把这篇针对公开 CSS 文件的覆盖策略扩展到 New API 的接口域名。

排查结束时，应能回答三个问题：源站发布的是哪个版本、边缘返回的是哪个版本、浏览器显示的是哪个版本。三个答案对齐后，才算解决了“更新不生效”。

返回[Cloudflare 系列文章索引](./#cloudflare-实战笔记)。

## 参考资料

- [Cloudflare：默认缓存行为](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)
- [Cloudflare：缓存状态响应头](https://developers.cloudflare.com/cache/concepts/cache-responses/)
- [Cloudflare：Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/)
- [Cloudflare：Cache-Control](https://developers.cloudflare.com/cache/concepts/cache-control/)
- [Cloudflare：按单个 URL 清理缓存](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/)
- [VitePress：静态资源](https://vitepress.dev/guide/asset-handling)
