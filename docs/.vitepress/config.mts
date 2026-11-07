import { defineConfig } from 'vitepress'

// https://vitepress.dev/zh/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: 'the2015 的博客',
  description: '记录技术实践、工具效率与日常思考的个人博客',
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
    ]
  ],
  sitemap: {
    hostname: 'https://the2015.github.io'
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' },
      { text: '关于', link: '/about' }
    ],
    sidebar: [
      {
        text: '文章',
        items: [
          { text: 'Hello VitePress', link: '/posts/hello-vitepress' },
          { text: '部署到 GitHub Pages', link: '/posts/deploy-to-github-pages' },
          { text: '近期写作计划', link: '/posts/writing-plan' }
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
        items: [{ text: '关于我', link: '/about' }]
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
      message: '基于 VitePress 构建 · 部署于 GitHub Pages',
      copyright: 'Copyright © 2026 the2015'
    }
  }
})
