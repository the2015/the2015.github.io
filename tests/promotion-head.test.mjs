import assert from 'node:assert/strict'
import test from 'node:test'

const load = () => import('../scripts/promotion-head.mjs')

test('unconfigured sites have no verification placeholders or analytics requests', async () => {
  const { promotionHead } = await load()
  assert.deepEqual(promotionHead({}), [])
})

test('verification and analytics use supplied public identifiers only', async () => {
  const { promotionHead } = await load()
  const token = 'a'.repeat(32)
  const entries = promotionHead({
    GOOGLE_SITE_VERIFICATION: 'test-verification_123',
    BING_SITE_VERIFICATION: 'ABC123',
    CLOUDFLARE_WEB_ANALYTICS_TOKEN: token
  })
  assert.deepEqual(entries.find(([tag, props]) => tag === 'meta' && props.name === 'google-site-verification'),
    ['meta', { name: 'google-site-verification', content: 'test-verification_123' }])
  assert.deepEqual(entries.find(([tag, props]) => tag === 'meta' && props.name === 'msvalidate.01'),
    ['meta', { name: 'msvalidate.01', content: 'ABC123' }])
  const [, props] = entries.find(([tag]) => tag === 'script')
  assert.equal(props.src, 'https://static.cloudflareinsights.com/beacon.min.js')
  assert.deepEqual(JSON.parse(props['data-cf-beacon']), { token })
  assert.ok('defer' in props)
})

test('invalid analytics tokens fail with a clear name and without leaking the value', async () => {
  const { promotionHead } = await load()
  assert.throws(() => promotionHead({ CLOUDFLARE_WEB_ANALYTICS_TOKEN: 'invalid-private-value' }), error => {
    assert.match(error.message, /CLOUDFLARE_WEB_ANALYTICS_TOKEN/)
    assert.ok(!error.message.includes('invalid-private-value'))
    return true
  })
})
