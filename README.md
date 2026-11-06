# the2015.github.io

个人博客，基于 [VitePress](https://vitepress.dev/zh/) 构建，部署在 GitHub Pages：https://the2015.github.io

## 本地开发

```bash
pnpm install
pnpm dev        # 本地预览，默认 http://localhost:5173
```

## 构建

```bash
pnpm build      # 产物输出到 docs/.vitepress/dist
pnpm preview    # 本地预览构建产物
```

## 部署

推送到 `main` 分支后，GitHub Actions（`.github/workflows/deploy.yml`）自动构建并部署到 GitHub Pages，无需手动操作。

## 写新文章

在 `docs/posts/` 下新建 `.md` 文件，写好 frontmatter（title、date），然后把链接加进 `docs/posts/index.md` 和 `docs/.vitepress/config.mts` 的侧边栏即可。
