import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

const postFiles = fs.readdirSync(path.join(root, 'docs', 'posts'))
  .filter(file => file.endsWith('.md') && file !== 'index.md')

test('homepage exposes a focused positioning and return paths', () => {
  const home = read('docs/index.md')

  assert.match(home, /个人开发者/)
  assert.match(home, /低成本/)
  assert.match(home, /自动化/)
  assert.match(home, /\/feed\.xml/)
  assert.match(home, /notebook-market-daily/)
})

test('every article has search metadata and a conversion CTA', () => {
  for (const file of postFiles) {
    const article = read(path.join('docs', 'posts', file))

    assert.match(article, /^description:\s*.+$/m, `${file} needs a description`)
    assert.match(article, /## 继续阅读/, `${file} needs a return section`)
    assert.match(article, /https:\/\/github\.com\/the2015/, `${file} needs a GitHub path`)
  }
})

test('site config emits share metadata and exposes the feed', () => {
  const config = read('docs/.vitepress/config.mts')

  assert.match(config, /transformHead/)
  assert.match(config, /og:title/)
  assert.match(config, /og:description/)
  assert.match(config, /canonical/)
  assert.match(config, /feed\.xml/)
})

test('build pipeline generates a valid RSS feed', () => {
  const packageJson = JSON.parse(read('package.json'))
  const feedGenerator = path.join(root, 'scripts', 'generate-feed.mjs')
  const feed = path.join(root, 'docs', 'public', 'feed.xml')

  assert.match(packageJson.scripts.build, /generate:feed/)
  assert.equal(fs.existsSync(feedGenerator), true)
  assert.equal(fs.existsSync(feed), true)
  assert.match(read('docs/public/feed.xml'), /<rss version="2\.0"(?:\s[^>]*)?>/)
  assert.match(read('docs/public/feed.xml'), /notebook-market-daily/)
})
