export const handler = async (event) => {
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  const empty = { title: null, description: null, image: null }

  if (event.httpMethod === 'OPTIONS')
    return { statusCode: 204, headers: CORS, body: '' }

  const rawUrl = event.queryStringParameters?.url
  if (!rawUrl)
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing url' }) }

  let targetUrl
  try {
    targetUrl = new URL(rawUrl).href
  } catch {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(empty) }
  }

  try {
    const res = await fetch(targetUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; pro-bookmarks-bot/1.0)' },
    })

    if (!res.ok)
      return { statusCode: 200, headers: CORS, body: JSON.stringify(empty) }

    // Read only the first 50KB — OG tags are always in <head>
    const reader = res.body.getReader()
    const chunks = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done || total >= 50_000) { reader.cancel(); break }
      chunks.push(value)
      total += value.length
    }
    const html = new TextDecoder().decode(
      chunks.reduce((acc, c) => {
        const b = new Uint8Array(acc.length + c.length)
        b.set(acc)
        b.set(c, acc.length)
        return b
      }, new Uint8Array())
    )

    // Two-pass extraction: match the whole <meta> tag first, then pull content="..."
    // from the matched tag. This handles both attribute orderings correctly.
    const contentRe = /content=["']([^"']+)["']/i

    function extractOg(prop) {
      const tag = html.match(new RegExp(`<meta\\s[^>]*property=["']${prop}["'][^>]*>`, 'i'))?.[0]
      return tag ? (tag.match(contentRe)?.[1] ?? null) : null
    }

    function extractMeta(name) {
      const tag = html.match(new RegExp(`<meta\\s[^>]*name=["']${name}["'][^>]*>`, 'i'))?.[0]
      return tag ? (tag.match(contentRe)?.[1] ?? null) : null
    }

    function decodeEntities(str) {
      if (!str) return str
      return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&nbsp;/g, ' ')
    }

    const title = decodeEntities(
      extractOg('og:title') ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
      null
    )

    const description = decodeEntities(
      extractOg('og:description') ??
      extractMeta('description') ??
      null
    )

    let image = extractOg('og:image')

    // Resolve relative OG image URLs against the page origin
    if (image && !image.startsWith('http')) {
      try { image = new URL(image, targetUrl).href } catch { image = null }
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ title, description, image }) }
  } catch {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(empty) }
  }
}
