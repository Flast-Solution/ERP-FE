import DOMPurify from 'dompurify'
import * as cssTree from 'css-tree'

const ALLOWED_TAGS = ['div', 'span', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'small', 'sub', 'sup', 'h1', 'h2', 'h3', 'h4', 'header', 'footer', 'section', 'article', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'colgroup', 'col', 'img', 'ul', 'ol', 'li', 'hr']
const SAFE_DATA_URL = /^data:(?:image\/(?:png|jpeg|webp|gif)|font\/(?:woff2?|ttf|otf));base64,[a-z0-9+/=\s]+$/i
const PROPERTIES = new Set(('color background background-color background-image background-position background-size background-repeat font font-family font-size font-weight font-style line-height letter-spacing word-spacing text-align text-decoration text-transform text-indent vertical-align white-space overflow-wrap word-break width min-width max-width height min-height max-height margin margin-top margin-right margin-bottom margin-left padding padding-top padding-right padding-bottom padding-left border border-width border-style border-color border-top border-right border-bottom border-left border-top-width border-right-width border-bottom-width border-left-width border-collapse border-spacing border-radius box-sizing display grid-template-columns grid-template-rows grid-column grid-row gap row-gap column-gap align-items align-content justify-content flex flex-direction flex-wrap flex-grow flex-shrink flex-basis order table-layout list-style-type list-style-position position top right bottom left break-before break-after break-inside page-break-before page-break-after page-break-inside object-fit object-position opacity src font-display').split(' '))

export const resolveTemplateAsset = (value, assets = {}) => {
  const path = String(value || '').trim()
  if (SAFE_DATA_URL.test(path)) return path
  if (/^(?:\.\/)?assets\/[a-z0-9_./-]+$/i.test(path) && !path.split('/').includes('..')) {
    const asset = assets[path.replace(/^\.\//, '')]
    if (asset && SAFE_DATA_URL.test(asset)) return asset
  }
  throw new Error(`Ảnh/font phải nằm trong assets/ hoặc là data URL hợp lệ: ${path.slice(0, 80)}`)
}

// Parse CSS as an AST: URLs, escaped identifiers and nested rules must not bypass validation.
export const sanitizeTemplateCss = (css, assets = {}, scope = '', inline = false, fontNames = {}) => {
  const ast = cssTree.parse(String(css || ''), { context: inline ? 'declarationList' : 'stylesheet' })
  cssTree.walk(ast, node => {
    if (node.type === 'Raw') throw new Error('CSS không hợp lệ hoặc có cú pháp chưa được hỗ trợ')
    if (node.type === 'Atrule' && !['media', 'font-face'].includes(node.name.toLowerCase())) throw new Error(`Không hỗ trợ CSS @${node.name}. Khổ giấy được cấu hình trong fields.json.`)
    if (node.type === 'Atrule' && node.name.toLowerCase() === 'media' && cssTree.generate(node.prelude) !== 'print') throw new Error('Chỉ hỗ trợ @media print trong mẫu')
    if (node.type === 'Declaration') {
      const property = node.property.toLowerCase()
      if (!PROPERTIES.has(property)) throw new Error(`CSS chưa hỗ trợ thuộc tính: ${node.property}`)
      if (property === 'position' && !['static', 'relative', 'absolute'].includes(cssTree.generate(node.value))) throw new Error('Không hỗ trợ position fixed/sticky trong mẫu')
      if (property === 'display' && /^(none|contents)$/.test(cssTree.generate(node.value))) throw new Error('Không hỗ trợ display none/contents trong mẫu')
      if (['font', 'font-family'].includes(property)) {
        cssTree.walk(node.value, part => {
          const name = part.type === 'String' ? part.value.slice(1, -1) : part.type === 'Identifier' ? part.name : ''
          if (Object.prototype.hasOwnProperty.call(fontNames, name)) {
            if (part.type === 'String') part.value = `"${fontNames[name]}"`
            else part.name = fontNames[name]
          }
        })
      }
    }
    if (node.type === 'Function' && !['rgb', 'rgba', 'hsl', 'hsla', 'calc', 'min', 'max', 'clamp', 'repeat', 'minmax', 'linear-gradient', 'format'].includes(node.name.toLowerCase())) throw new Error(`CSS chưa hỗ trợ hàm: ${node.name}`)
    if (node.type === 'Url') {
      const value = node.value.type === 'String' ? node.value.value.slice(1, -1) : node.value.value
      node.value = { type: 'String', value: `"${resolveTemplateAsset(value, assets)}"` }
    }
  })
  if (!inline) {
    cssTree.walk(ast, {
      visit: 'Rule',
      enter(node) {
        if (node.prelude?.type !== 'SelectorList') throw new Error('Selector CSS không hợp lệ')
        const selectors = node.prelude.children.toArray().map(selector => {
          const text = cssTree.generate(selector)
          if (/(^|[\s>+~,])(html|body|:root)(?=$|[\s>+~.#[:])/i.test(text)) throw new Error('Dùng .document thay cho selector html/body/:root')
          return scope ? `${scope} ${text}` : text
        })
        node.prelude = cssTree.parse(selectors.join(','), { context: 'selectorList' })
      },
    })
  }
  return cssTree.generate(ast)
}

export const getScopedTemplateFonts = (css, scopeId) => {
  const names = {}
  cssTree.walk(cssTree.parse(css), { visit: 'Atrule', enter(node) {
    if (node.name.toLowerCase() !== 'font-face') return
    node.block?.children.forEach(declaration => {
      if (declaration.property?.toLowerCase() !== 'font-family') return
      const value = cssTree.generate(declaration.value)
      const name = value.replace(/^["']|["']$/g, '')
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name) || ['constructor', 'prototype'].includes(name)) throw new Error('Tên font nhúng chỉ gồm chữ, số, _ và -')
      names[name] = `${scopeId}-${name}`
    })
  } })
  return names
}

export const sanitizeTemplateHtml = (html, assets = {}) => {
  // DOMPurify parses in an inert document; no imported resources are mounted.
  const document = DOMPurify.sanitize(String(html || ''), {
    WHOLE_DOCUMENT: true, RETURN_DOM: true,
    ALLOWED_TAGS: [...ALLOWED_TAGS, 'html', 'head', 'body', 'style'],
    ALLOWED_ATTR: ['class', 'style', 'src', 'alt', 'width', 'height', 'colspan', 'rowspan', 'span', 'data-field', 'data-repeat'],
    ALLOW_DATA_ATTR: false,
  })
  const css = Array.from(document.querySelectorAll('style')).map(style => style.textContent).join('\n')
  document.querySelectorAll('style').forEach(style => style.remove())
  const body = document.querySelector('body')
  if (!body || body.querySelectorAll('*').length > 5000) throw new Error('HTML trống hoặc vượt quá 5.000 phần tử')
  body.querySelectorAll('[style]').forEach(element => element.setAttribute('style', sanitizeTemplateCss(element.getAttribute('style'), assets, '', true)))
  body.querySelectorAll('img').forEach(element => element.setAttribute('src', resolveTemplateAsset(element.getAttribute('src'), assets)))
  return { html: body.innerHTML, css: sanitizeTemplateCss(css, assets) }
}
