import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'docs/.vitepress/dist')
const read = file => fs.readFileSync(path.join(dist, file), 'utf8')
const site = 'https://the2015.github.io'

function attributes(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(([element]) =>
    Object.fromEntries([...element.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value])))
}

function resolveLocal(url) {
  const route = decodeURIComponent(url.pathname)
  const relative = route.replace(/^\//, '')
  return [relative, `${relative}.html`, `${relative.replace(/\/$/, '')}/index.html`]
    .map(file => path.join(dist, file))
    .find(file => fs.existsSync(file) && fs.statSync(file).isFile())
}

const pages = fs.readdirSync(dist, { recursive: true })
  .filter(file => file.endsWith('.html') && file !== '404.html')

for (const file of pages) {
  test(`rendered metadata is canonical and shareable: ${file}`, () => {
    const html = read(file)
    const meta = attributes(html.split('</head>')[0], 'meta')
    const links = attributes(html.split('</head>')[0], 'link')
    const route = `/${file.replaceAll('\\', '/').replace(/index\.html$/, '').replace(/\.html$/, '')}`
    const canonical = site + route
    assert.equal(links.filter(link => link.rel === 'canonical').length, 1)
    assert.equal(links.find(link => link.rel === 'canonical').href, canonical)
    assert.equal(meta.filter(item => item.name === 'description').length, 1)
    assert.ok(meta.find(item => item.name === 'description')?.content.length > 10)
    assert.equal(meta.find(item => item.property === 'og:url')?.content, canonical)
    assert.equal(meta.find(item => item.property === 'og:image')?.content, `${site}/og-cover.png`)
    assert.equal(meta.find(item => item.name === 'twitter:card')?.content, 'summary_large_image')
    assert.equal(links.find(link => link.type === 'application/rss+xml')?.href, `${site}/feed.xml`)
  })
}

test('every local rendered link, asset and fragment resolves', () => {
  const errors = []
  for (const file of pages) {
    const base = new URL(`/${file.replaceAll('\\', '/').replace(/index\.html$/, '').replace(/\.html$/, '')}`, site)
    const html = read(file)
    const refs = [...attributes(html, 'a').map(item => item.href), ...attributes(html, 'img').map(item => item.src),
      ...attributes(html, 'script').map(item => item.src), ...attributes(html, 'link').map(item => item.href)]
    for (const ref of refs.filter(Boolean)) {
      const url = new URL(ref.replaceAll('&amp;', '&'), base)
      if (url.origin !== site) continue
      const target = resolveLocal(url)
      if (!target) errors.push(`${file}: missing ${ref}`)
      else if (url.hash && target.endsWith('.html')) {
        const id = decodeURIComponent(url.hash.slice(1))
        if (!fs.readFileSync(target, 'utf8').includes(`id="${id}"`)) errors.push(`${file}: missing fragment ${ref}`)
      }
    }
  }
  assert.deepEqual(errors, [])
})

test('topic hubs, subscription help and repository conversion exist in built output', () => {
  for (const topic of ['cloudflare', 'automation', 'deployment']) {
    assert.ok(fs.existsSync(path.join(dist, `topics/${topic}.html`)), `${topic} topic is built`)
  }
  assert.match(read('subscribe.html'), /feed\.xml/)
  assert.match(read('index.html'), /个人开发者/)
  assert.match(read('posts/notebook-market-daily.html'), /https:\/\/github\.com\/the2015\/notebook-market-daily/)
})

test('feed items and sitemap describe the actual clean-URL pages', () => {
  const xml = read('feed.xml')
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => item)
  const expectedPosts = fs.readdirSync(path.join(root, 'docs/posts')).filter(file => file.endsWith('.md') && file !== 'index.md')
  assert.equal(items.length, expectedPosts.length)
  for (const item of items) {
    const link = item.match(/<link>(.*?)<\/link>/)?.[1]
    const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]
    assert.ok(link && resolveLocal(new URL(link)), `feed link resolves: ${link}`)
    assert.match(date, /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/)
  }
  const sitemap = read('sitemap.xml')
  for (const [, location] of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) {
    assert.ok(resolveLocal(new URL(location)), `sitemap URL resolves: ${location}`)
    assert.ok(!location.endsWith('.html'), `clean sitemap URL: ${location}`)
  }
  assert.match(read('robots.txt'), /Sitemap: https:\/\/the2015\.github\.io\/sitemap\.xml/)
})

test('social preview is a valid 1200 by 630 PNG', () => {
  const buffer = fs.readFileSync(path.join(dist, 'og-cover.png'))
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(buffer.readUInt32BE(16), 1200)
  assert.equal(buffer.readUInt32BE(20), 630)
})
