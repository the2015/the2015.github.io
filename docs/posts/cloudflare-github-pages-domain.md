---
title: 给 VitePress 博客绑定独立域名
date: 2026-11-07
description: 在 GitHub Pages 上配置自定义域名，通过 Cloudflare 管理 DNS，并说明 GitHub Actions 部署时 CNAME 文件和 VitePress sitemap 的处理。
---

# 给 VitePress 博客绑定独立域名

本站使用 VitePress，由 GitHub Actions 构建并部署到 GitHub Pages。已有的部署链路见[部署到 GitHub Pages](./deploy-to-github-pages)。

这篇在现有结构上增加独立域名，使用 `blog.example.com` 作为示例。它是一份操作教程，不代表本站已经完成自定义域名绑定。

## 先用子域名把链路跑通

本文选择 `blog.example.com`，通过 CNAME 指向 `the2015.github.io`，避免一开始同时处理主域名、`www` 和跳转策略。

```text
blog.example.com
      │ DNS CNAME
      ▼
the2015.github.io → GitHub Pages → VitePress 静态文件
```

前提是域名的权威 DNS 已交给 Cloudflare，而且原来的 GitHub Pages 地址可以正常访问。如果还没接入 DNS，先看[系列第一篇](./cloudflare-dns-proxy)。

## 先验证域名归属

GitHub 的域名验证位于**个人账号 Settings → Pages**，与仓库里的 Pages 设置是两个入口。

在个人设置添加待验证域名，按 GitHub 给出的名称和值创建 TXT 记录。下面只展示结构，验证值必须使用 GitHub 实际生成的内容：

| 类型 | 名称示例 | 内容 |
| --- | --- | --- |
| TXT | `_github-pages-challenge-the2015.example.com` | GitHub 提供的验证值 |

添加后先查询，再点击 Verify：

```bash
dig TXT _github-pages-challenge-the2015.example.com +short
```

名称以控制台提示为准，尤其要避免在自动追加域名的输入框里重复填写后缀。验证成功后保留 TXT 记录。

## 设置仓库域名，再添加解析

进入博客仓库的 **Settings → Pages**，在 **Custom domain** 填写 `blog.example.com` 并保存。

随后在 Cloudflare 添加：

| 类型 | 名称 | 目标 | 代理状态 |
| --- | --- | --- | --- |
| CNAME | `blog` | `the2015.github.io` | DNS only |

CNAME 的目标是主机名，不带 `https://`，也不带仓库路径。这里先使用灰云，让 GitHub 的域名校验、证书签发和访问验证都直接针对 Pages 完成。

```bash
dig CNAME blog.example.com +short
curl -I https://blog.example.com/
```

GitHub 页面上的 DNS 检查通过、证书准备好后，再启用 **Enforce HTTPS**。证书签发可能需要等待，尚未出现可用选项时先检查解析和 Pages 状态，不要反复切换代理开关。

## Actions 部署需要 CNAME 文件吗

本站的工作流通过 `actions/upload-pages-artifact` 上传产物，再用 `actions/deploy-pages` 发布。这属于自定义 GitHub Actions 部署。

按 GitHub 官方说明，这种部署方式不要求 `CNAME` 文件；已有文件也不会用于这条部署流程。自定义域名由仓库的 Pages 设置管理。

只有从分支发布等其他方式，才需要按相应文档处理 `CNAME` 文件。不要把不同发布方式的教程混在一起。

## 调整 VitePress 的站点地址

实际切换域名时，将 `docs/.vitepress/config.mts` 中的 sitemap 地址改为新地址：

```ts
sitemap: {
  hostname: 'https://blog.example.com'
},
```

这个用户主站部署在域名根路径，不需要额外设置成仓库子路径。如果之后添加 canonical、RSS 或分享元信息，也要同步检查它们使用的站点地址。

在 PowerShell 中构建，并检查 sitemap：

```powershell
pnpm build
Select-String -Path docs/.vitepress/dist/sitemap.xml -Pattern 'blog.example.com'
```

构建通过后发布变更，等 Actions 部署成功，再检查线上文章页面和 sitemap。修改本地文件不会自动改变已经部署的站点。

## 是否还要开启橙云

**只使用 Cloudflare 管理 DNS，也已经是一种完整配置。** GitHub Pages 自己提供 HTTPS，不是必须再增加一层代理。

如果确实需要 Cloudflare 的代理功能，可以在上述验证全部完成后尝试开启橙云，并使用 **Full (strict)**。重新检查首页、文章页、证书状态和跳转链。遇到自定义域名检查或证书续期异常时，灰云是有用的对照状态。

```bash
curl -sS -L -o /dev/null -w 'status=%{http_code} final=%{url_effective}\n' \
  https://blog.example.com/posts/hello-vitepress
```

验收时除了首页，还应直接打开一篇文章并刷新，确认 CSS、JavaScript 正常加载，链接没有落回错误域名或错误子路径。

## 回退方式

若开启橙云后才出现异常，先恢复 DNS only 并重新测试。若需要完全撤下自定义域名，应协调删除指向 Pages 的 DNS 记录、移除仓库中的自定义域名设置，并把 sitemap 地址改回原站点，避免留下无人接管的解析记录。

下一篇：[Cloudflare HTTPS 与源站证书](./cloudflare-https-origin-cert)。

## 参考资料

- [GitHub：验证 GitHub Pages 自定义域名](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [GitHub：管理 GitHub Pages 自定义域名](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub：使用 HTTPS 保护 GitHub Pages 站点](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [VitePress：Sitemap](https://vitepress.dev/guide/sitemap-generation)
