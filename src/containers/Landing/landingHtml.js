const escapeAttribute = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const buildMetaTags = schema => (schema?.seo?.meta ?? [])
  .filter(meta => meta?.name && meta?.value)
  .map(meta => {
    const key = String(meta.name)
    const attribute = key.startsWith('og:') ? 'property' : 'name'
    return `<meta ${attribute}="${escapeAttribute(key)}" content="${escapeAttribute(meta.value)}">`
  })
  .join('\n    ')

const getTitle = schema => (
  schema?.seo?.meta?.find(meta => meta?.name === 'title')?.value
  || schema?.name
  || 'Landing page'
)

const readStyle = style => {
  if (style.textContent) return style.textContent
  try {
    return Array.from(style.sheet?.cssRules ?? []).map(rule => rule.cssText).join('\n')
  } catch {
    return ''
  }
}

const captureStyledCss = () => Array.from(document.querySelectorAll('style[data-styled]'))
  .map(readStyle)
  .filter(Boolean)
  .join('\n')

const capturePreviewMarkup = () => {
  const source = document.querySelector('[data-landing-preview="true"]')
  if (!source) return ''
  const clone = source.cloneNode(true)
  clone.querySelectorAll('[data-landing-editor-only="true"]').forEach(node => node.remove())
  clone.querySelectorAll('.is-selected, .is-active').forEach(node => {
    node.classList.remove('is-selected', 'is-active')
  })
  clone.removeAttribute('data-landing-preview')
  clone.removeAttribute('data-device')
  return clone.outerHTML
}

export const generateLandingHtml = schema => {
  const markup = capturePreviewMarkup()
  if (!markup) throw new Error('Không tìm thấy nội dung Preview để sinh HTML.')
  const css = captureStyledCss()
  const metaTags = buildMetaTags(schema)
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeAttribute(getTitle(schema))}</title>
  ${metaTags}
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body { background: #fff; }
    ${css}
  </style>
</head>
<body>
  ${markup}
</body>
</html>`
}

export const formatLandingHtml = html => String(html ?? '').replace(/></g, '>\n<')
