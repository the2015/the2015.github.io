# 推广执行清单

站点定位：面向个人开发者的低成本云服务与自动化实践。优先推广 Cloudflare 排障与 GitHub Actions 行情日报两条内容线。

本目录保存运营材料，位于 VitePress 的 `docs/` 之外，不会被构建进站点。草稿、预览和检查通过不等于已发布、已收录或已产生流量。

## 本地已准备

- 首页定位、三个专题页、文章描述、相关内容与 GitHub/RSS 出口。
- sitemap、robots.txt、逐页 canonical/Open Graph/Twitter 元信息、1200×630 分享封面。
- RSS 构建生成器和订阅说明，`pnpm check` 验证内容、Feed、静态页面、链接及图片尺寸。
- `drafts/` 下的掘金、知乎、项目展示稿和 GitHub 互链片段。

## 发布顺序

1. 审阅 `feat/blog-promotion` 的差异和本地预览，发布到现有 GitHub Pages 流程后检查 Actions 与线上页面、`/feed.xml`、`/sitemap.xml`、`/robots.txt`、`/og-cover.png`。现阶段不将本地验证写成线上验收。
2. 按 `drafts/github-backlinks.md` 更新自动化仓库的 README、主页和 Topics；个人 Profile README 放两条专题入口，置顶博客及代表项目。当前只读查询到自动化项目 homepage 和 Topics 为空，远端尚未由本任务修改。
3. 完成 Search Console 和 Bing Webmaster 验证并提交 sitemap，记录真实提交结果。
4. 根据平台规则人工发布首轮稿件，登记实际发布 URL；不群发评论，不在无关帖子粘贴广告。对已经登录的私人群组发消息也需要另行明确授权。
5. 统计接入并收到真实数据后，按来源比较结果；第一周的实际值作为基线，不编造访问或订阅量。

## 搜索收录操作

Google Search Console 使用 URL 前缀资源 `https://the2015.github.io/`，选择 HTML 文件或 meta 标签验证。`github.io` 的父域不是用户控制的 DNS，当前适合 URL 前缀验证。取得平台生成的实际文件/标签后，文件可放 `docs/public/`；使用 meta 验证时，在博客仓库的 **Settings → Secrets and variables → Actions → Variables** 设置 `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`，值只填标签的 `content`，部署流程会自动注入。发布后再点平台验证。不要用占位验证码假装完成。

Bing Webmaster 同样添加站点，使用平台提供的验证文件/标签，或在已经授权的情况下从 Search Console 导入。验证后提交：

```text
https://the2015.github.io/sitemap.xml
```

提交后记录平台状态，并检查首页、525、HTTPS、行情日报的 URL 检查结果。提交成功只说明接收，不保证收录和排名；在四周复盘中记录真实索引状态。

## 访问与转化统计

推荐先用现有账号可管理的 Cloudflare Web Analytics 记录聚合访问。取得实际站点 token 后，在同一组 Actions Variables 设置 `CLOUDFLARE_WEB_ANALYTICS_TOKEN`（只填公开站点标识，不是 Cloudflare API 密钥），重新部署，确认真实页面发出 beacon 请求且控制台出现数据；未设置时不会加载统计脚本。本地构建可用同名进程环境变量，项目不自动读取 `.env`。要细分 UTM 和 GitHub 外链点击，需要选定支持这些维度/事件的统计方案（如已有 Umami 实例），按实际能力接入。未经选择和提供站点标识，不安装占位脚本，也不把“已准备 UTM 链接”当成“已采集转化”。Plausible 的服务计划、自托管成本等另按实际选择确认。

只跟踪公开页面路径、渠道和预定义的 `github_click` / `rss_click` 事件，不发送文章正文、Issue 文本或链接里可能出现的个人信息。统计上线后在订阅/关于页说明实际采集方式。RSS 点击不是订阅人数，GitHub Star 是项目层面变化，不能直接归因给某一个来源。

建议草稿 URL 统一使用：

```text
utm_source=juejin|zhihu|github|community
utm_medium=article|readme|post
utm_campaign=blog-launch-2026-11
utm_content=cf525|cf-https|notebook-daily
```

canonical 保持无参数的原文地址。先验收阅读路径，再使用受支持的统计维度判断：展现有而点击少时调整标题与摘要；有阅读但项目点击少时改善项目入口；项目点击后反馈无法上手时修复使用说明。

## 首月节奏（站点上线后起算）

| 周 | 要做的事 | 现成材料或选题 | 要记录的证据 |
| --- | --- | --- | --- |
| 第 1 周 | 上线基础设施、互链、完成所有者验证和统计接入 | 三个专题、RSS、GitHub 片段 | 部署 SHA、线上 URL、验证/提交状态、实际统计基线 |
| 第 2 周 | 分发 525 案例和 HTTPS 答疑，回应相关问题 | `drafts/` 两篇 Cloudflare 稿 | 发布 URL、搜索展现/点击、有效讨论链接 |
| 第 3 周 | 展示行情日报，按文档完整走一次新用户上手 | 自动化项目稿；演示素材需来自真实运行 | 手动运行结果、Fork 所有者条件、配置反馈与仓库点击 |
| 第 4 周 | 根据已出现的搜索词或 Issue 补一篇长文，拆两条短内容 | Actions 不执行排查、RSS 来源失败处理、域名误区择一 | 原始问题链接、文章发布 URL、渠道表现 |

目标节奏是每周一篇完整内容、两条短分发；首轮先改写已有内容。新选题应来自真实问题，没有数据时先记录待验证假设。没有自动创建定时发帖、付费广告、域名采购或邮件订阅服务。

## 每周记录模板

在取得实际数据后逐周追加。空白代表未采集，不代表零。

| 周期 | 渠道 / 发布 URL | 可索引页 / 已索引页 | 搜索展现 / 点击 | 落地页访问 | GitHub / RSS 点击 | 有效讨论 / 问题 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 基线（待上线及接入） |  |  |  |  |  |  |  |

第一个月观察：代表文章是否获得搜索访问，是否出现 3～5 个真实引用或讨论，读者能否运行项目。以上是目标而非已发生的结果。自定义域名、邮件订阅和评论系统留在后续有需求时评估。
