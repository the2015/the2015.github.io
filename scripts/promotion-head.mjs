export function promotionHead(env = process.env) {
  const head = []
  for (const [key, name] of [
    ['GOOGLE_SITE_VERIFICATION', 'google-site-verification'],
    ['BING_SITE_VERIFICATION', 'msvalidate.01']
  ]) {
    const content = env[key]?.trim()
    if (content) head.push(['meta', { name, content }])
  }

  const token = env.CLOUDFLARE_WEB_ANALYTICS_TOKEN?.trim()
  if (token) {
    if (!/^(?:[a-f0-9]{32}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.test(token)) {
      throw new Error('CLOUDFLARE_WEB_ANALYTICS_TOKEN must be a valid Web Analytics site token')
    }
    head.push(['script', {
      defer: '',
      src: 'https://static.cloudflareinsights.com/beacon.min.js',
      'data-cf-beacon': JSON.stringify({ token })
    }])
  }
  return head
}
