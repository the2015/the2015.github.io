import { defineConfig, type HeadConfig } from 'vitepress'
import { siteUrl, siteTitle, siteDescription } from '../../scripts/site-config.mjs'
import { promotionHead } from '../../scripts/promotion-head.mjs'

function pageUrl(page: string) {
  const route = page
    .replace(/\.md$/, '')
    .replace(/\/index$/, '/')
    .replace(/^index$/, '/')
  return new URL(`/${route.replace(/^\/+/, '')}`, `${siteUrl}/`).toString()
}

// https://vitepress.dev/zh/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: siteTitle,
  description: siteDescription,
  cleanUrls: true,
  lastUpdated: true,
  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%93%9D%3C/text%3E%3C/svg%3E"
      }
    ],
    ['link', { rel: 'alternate', type: 'application/rss+xml', title: 'the2015 博客 RSS', href: `${siteUrl}/feed.xml` }],
    ...promotionHead() as HeadConfig[]
  ],
  transformHead({ page, pageData, title, description }) {
    if (page === '404.md') return [['meta', { name: 'robots', content: 'noindex' }]]
    const frontmatter = pageData.frontmatter ?? {}
    const pageTitle = frontmatter.title || title
    const pageDescription = frontmatter.description || description || siteDescription
    const canonical = pageUrl(page)
    const isArticle = page.startsWith('posts/') && page !== 'posts/index.md'

    return [
      ['meta', { property: 'og:type', content: isArticle ? 'article' : 'website' }],
      ['meta', { property: 'og:title', content: pageTitle }],
      ['meta', { property: 'og:description', content: pageDescription }],
      ['meta', { property: 'og:url', content: canonical }],
      ['meta', { property: 'og:site_name', content: 'the2015' }],
      ['meta', { property: 'og:locale', content: 'zh_CN' }],
      ['meta', { property: 'og:image', content: `${siteUrl}/og-cover.png` }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { property: 'og:image:alt', content: 'the2015：低成本云服务与自动化实践' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: pageTitle }],
      ['meta', { name: 'twitter:description', content: pageDescription }],
      ['meta', { name: 'twitter:image', content: `${siteUrl}/og-cover.png` }],
      ['link', { rel: 'canonical', href: canonical }]
    ]
  },
  sitemap: {
    hostname: siteUrl
  },
  themeConfig: {
    siteTitle: 'the2015 · 技术实践',
    nav: [
      { text: '首页', link: '/' },
      { text: '专题', items: [
        { text: 'Cloudflare 实战', link: '/topics/cloudflare' },
        { text: '零成本自动化', link: '/topics/automation' },
        { text: '个人项目部署', link: '/topics/deployment' }
      ] },
      { text: '文章', link: '/posts/' },
      { text: '订阅', link: '/subscribe' },
      { text: '关于', link: '/about' }
    ],
    sidebar: [
      {
        text: '按主题阅读',
        items: [
          { text: 'Cloudflare 实战', link: '/topics/cloudflare' },
          { text: '零成本自动化', link: '/topics/automation' },
          { text: '个人项目部署', link: '/topics/deployment' }
        ]
      },
      {
        text: '自动化与博客部署',
        items: [
          { text: '不花一分钱的行情日报', link: '/posts/notebook-market-daily' },
          { text: '部署到 GitHub Pages', link: '/posts/deploy-to-github-pages' }
        ]
      },
      {
        text: 'Cloudflare 实战笔记',
        items: [
          { text: 'DNS、橙云与灰云', link: '/posts/cloudflare-dns-proxy' },
          { text: '给博客绑定独立域名', link: '/posts/cloudflare-github-pages-domain' },
          { text: 'HTTPS 与源站证书', link: '/posts/cloudflare-https-origin-cert' },
          { text: '一次 525 排查实录', link: '/posts/cloudflare-525-troubleshooting' },
          { text: 'Tunnel 访问本地服务', link: '/posts/cloudflare-tunnel-local-service' },
          { text: '缓存配置与排查', link: '/posts/cloudflare-cache-debugging' }
        ]
      },
      {
        text: '其他',
        items: [
          { text: 'Hello VitePress', link: '/posts/hello-vitepress' },
          { text: '近期写作计划', link: '/posts/writing-plan' },
          { text: '订阅与联系', link: '/subscribe' },
          { text: '关于我', link: '/about' }
        ]
      }
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/the2015' }],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文章', buttonAriaLabel: '搜索文章' },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '清空关键词',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        }
      }
    },
    outline: { level: [2, 3], label: '本页目录' },
    lastUpdated: { text: '最后更新于' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    footer: {
      message: '低成本云服务与自动化实践 · <a href="/subscribe">订阅更新</a> · <a href="/feed.xml">RSS</a>',
      copyright: 'Copyright © 2026 the2015'
    }
  }
})
