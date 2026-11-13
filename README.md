# the2015.github.io

面向个人开发者的**低成本云服务与自动化实践**：Cloudflare、GitHub Actions、VitePress 和开源工具的部署、排障与项目复盘。

[访问博客](https://the2015.github.io/) · [Cloudflare 实战](https://the2015.github.io/topics/cloudflare) · [零成本自动化](https://the2015.github.io/topics/automation) · [RSS](https://the2015.github.io/feed.xml)

## 本地开发

```bash
pnpm install --frozen-lockfile
pnpm dev             # 先生成 RSS，再预览，默认 http://localhost:5173
```

## 构建与检查

```bash
pnpm check           # 源文件检查、RSS 行为检查、构建、产物和链接检查
pnpm build           # 生成 RSS + VitePress，输出 docs/.vitepress/dist
pnpm preview         # 预览构建结果
```

专项命令：`pnpm test:promotion` 检查定位和文章入口，`pnpm test:feed` 验证 XML 转义、日期、排序及草稿过滤，`pnpm test:site` 检查已经构建出的页面、站内链接与片段、sitemap、分享图和 RSS 条目。CI 在部署前运行 `pnpm check`。

## 部署

推送到 `main` 分支后，`.github/workflows/deploy.yml` 检查、构建并部署到 GitHub Pages。发布后要检查 Actions 状态及实际线上页面，本地构建成功不表示已经上线。

站点名称、描述和 canonical 域名在 `scripts/site-config.mjs` 统一配置。搜索验证与可选统计读取构建环境中的 `GOOGLE_SITE_VERIFICATION`、`BING_SITE_VERIFICATION`、`CLOUDFLARE_WEB_ANALYTICS_TOKEN`；CI 对接同名 Actions Variables，未设置不会发出统计请求。配置步骤见推广清单。域名变更时同步更新 `docs/public/robots.txt`、订阅页与 README 中显示的地址，并重新生成封面。分享图源稿为 `scripts/og-cover.html`，`docs/public/og-cover.png` 是 1200×630 的导出图，构建不依赖浏览器或外部图片服务。

## 写新文章

在 `docs/posts/` 下新建 Markdown 文件，frontmatter 使用：

```yaml
title: 清楚描述读者的问题
date: 2026-11-14
description: 一两句话说明文章解决的问题、步骤与适用边界。
```

把链接加入 `docs/posts/index.md`、相应 `docs/topics/` 专题和侧边栏。文章结尾保留“继续阅读”、GitHub 与 RSS 入口。RSS 读取 VitePress 的 YAML 元信息，日期必须为真实的 `YYYY-MM-DD`；`draft: true` 会排除在 RSS 之外，注意这本身不会阻止 VitePress 构建该页面。

`docs/public/feed.xml` 是生成文件，不提交。修改文章后重新运行 `pnpm generate:feed`、`pnpm dev` 或 `pnpm build` 刷新 RSS。

## 推广材料

首轮平台稿、GitHub 互链片段、收录与统计接入、四周节奏在 [promotion/README.md](promotion/README.md)。该目录不在 VitePress 源目录中，不会随站点构建发布。
