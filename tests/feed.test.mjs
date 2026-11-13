import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const script = path.join(root, 'scripts/generate-feed.mjs')

function fixture(t, posts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-feed-'))
  fs.mkdirSync(path.join(dir, 'posts'))
  for (const [name, source] of Object.entries(posts)) {
    fs.writeFileSync(path.join(dir, 'posts', name), source)
  }
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  return { dir, output: path.join(dir, 'feed.xml') }
}

const article = (date, extra = '') => `---\ntitle: 'Cloud & "Tools"'\ndate: ${date}\ndescription: >-\n  One < two & three\n  with YAML on two lines.\n${extra}---\n# Article\n`

function generate(dir, output) {
  return execFileSync(process.execPath, [script, path.join(dir, 'posts'), output], { encoding: 'utf8', stdio: 'pipe' })
}

test('feed handles YAML, escapes XML and uses RFC 822 dates in newest-first order', t => {
  const { dir, output } = fixture(t, {
    'older.md': article('2026-11-06'),
    'newer.md': article('2026-11-13'),
    'index.md': '# Index without post metadata',
    'draft.md': article('2026-11-14', 'draft: true\n')
  })
  generate(dir, output)
  assert.ok(fs.existsSync(output), 'generator must write the requested feed')
  const xml = fs.readFileSync(output, 'utf8')
  assert.match(xml, /Cloud &amp; &quot;Tools&quot;/)
  assert.match(xml, /One &lt; two &amp; three with YAML on two lines\./)
  assert.match(xml, /<pubDate>Fri, 13 Nov 2026 00:00:00 GMT<\/pubDate>/)
  assert.equal([...xml.matchAll(/<item>/g)].length, 2, 'exclude index and drafts')
  assert.ok(xml.indexOf('/posts/newer') < xml.indexOf('/posts/older'))
  assert.match(xml, /<atom:link[^>]+rel="self"/)
  generate(dir, output)
  assert.equal(fs.readFileSync(output, 'utf8'), xml, 'same sources produce the same feed')
})

test('feed rejects impossible dates and incomplete metadata before overwriting output', t => {
  for (const source of [article('2026-02-30'), '---\ntitle: Test\ndate: 2026-11-13\n---\n# Missing description']) {
    const { dir, output } = fixture(t, { 'invalid.md': source })
    fs.writeFileSync(output, 'existing feed')
    assert.throws(() => generate(dir, output), /invalid\.md/, 'error should identify the invalid article')
    assert.equal(fs.readFileSync(output, 'utf8'), 'existing feed')
  }
})
