import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMarkdownRenderer } from 'vitepress'
import { siteUrl, siteTitle, siteDescription } from './site-config.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const postsDir = path.resolve(process.argv[2] || path.join(root, 'docs/posts'))
const outputPath = path.resolve(process.argv[3] || path.join(root, 'docs/public/feed.xml'))
const markdown = await createMarkdownRenderer(path.join(root, 'docs'))

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function parsePost(source, file) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!frontmatter) throw new Error(`${file} is missing frontmatter`)

  const env = {}
  markdown.render(frontmatter[0], env)
  const fields = env.frontmatter
  if (fields.draft === true) return null
  for (const field of ['title', 'description']) {
    if (typeof fields[field] !== 'string' || !fields[field].trim()) {
      throw new Error(`${file} is missing ${field}`)
    }
  }

  // YAML accepts impossible dates by normalizing them; validate the original day.
  const rawDate = frontmatter[1].match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*(?:#.*)?$/m)?.[1]
  const date = new Date(`${rawDate}T00:00:00Z`)
  if (!rawDate || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== rawDate) {
    throw new Error(`${file} needs a valid date in YYYY-MM-DD format`)
  }
  return { title: fields.title.trim(), description: fields.description.trim(), date, slug: file.slice(0, -3) }
}

const posts = fs.readdirSync(postsDir)
  .filter(file => file.endsWith('.md') && file !== 'index.md')
  .map(file => parsePost(fs.readFileSync(path.join(postsDir, file), 'utf8'), file))
  .filter(Boolean)
  .sort((a, b) => b.date - a.date || a.slug.localeCompare(b.slug, 'en'))

const items = posts.map(post => {
  const link = new URL(`/posts/${encodeURIComponent(post.slug)}`, siteUrl).href
  return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${post.date.toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`
}).join('\n')

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${siteUrl}/</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>zh-CN</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, feed)
process.stdout.write(`Generated ${path.relative(root, outputPath)} with ${posts.length} posts\n`)
