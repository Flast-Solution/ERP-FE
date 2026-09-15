import React, { useId, useMemo } from 'react'
import { Alert } from 'antd'
import get from 'lodash/get'
import { getHtmlManualPath, getHtmlManualPlaceholder, getHtmlRepeatRows, normalizeHtmlDefinition, resolveHtmlField } from './model'
import { getScopedTemplateFonts, sanitizeTemplateCss } from './sanitize'
import HtmlSheetTable from './HtmlSheetTable'

const elementStyle = element => Object.fromEntries(Array.from(element.style || []).map(property => [
  property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), element.style.getPropertyValue(property),
]))

const HtmlTemplateContent = ({ template, data = {}, editable = false, onManualFieldChange, onSelectField, selectedFieldId, pageClassName = '' }) => {
  const scope = `html-document-${useId().replace(/[^a-z0-9]/gi, '')}`
  const prepared = useMemo(() => {
    try {
      const definition = normalizeHtmlDefinition(template.htmlTemplate)
      const doc = new DOMParser().parseFromString(definition.html, 'text/html')
      const fonts = getScopedTemplateFonts(definition.css, scope)
      if (Object.keys(fonts).length) doc.querySelectorAll('[style]').forEach(element => element.setAttribute('style', sanitizeTemplateCss(element.getAttribute('style'), {}, '', true, fonts)))
      return { definition, doc, css: sanitizeTemplateCss(definition.css, {}, `[data-html-scope="${scope}"]`, false, fonts) }
    } catch (error) {
      return { error: error.message }
    }
  }, [template.htmlTemplate, scope])
  if (prepared.error) return <Alert type="error" message="Mẫu HTML không hợp lệ" description={prepared.error} />
  const { definition, doc, css } = prepared
  const render = (node, key, context = {}) => {
    if (node.nodeType === 3) return /^\s*$/.test(node.textContent) && ['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'COLGROUP'].includes(node.parentElement?.tagName) ? null : node.textContent
    if (node.nodeType !== 1) return null
    const repeatId = node.getAttribute('data-repeat')
    if (repeatId && !context.inRepeat) {
      const rows = getHtmlRepeatRows(data, definition.repeats[repeatId].source)
      return rows.map((row, rowIndex) => render(node, `${key}-${row?.id ?? rowIndex}`, { row, rowIndex, inRepeat: true }))
    }
    const tag = node.tagName.toLowerCase()
    const props = { key, style: elementStyle(node) }
    for (const attribute of Array.from(node.attributes)) {
      if (attribute.name === 'style') continue
      const name = { class: 'className', colspan: 'colSpan', rowspan: 'rowSpan' }[attribute.name] || attribute.name
      props[name] = attribute.value
    }
    if (['tr', 'img'].includes(tag)) props['data-pdf-avoid-break'] = 'true'
    const sheetTableId = node.getAttribute('data-sheet-table')
    if (sheetTableId) {
      const { key: sheetTableKey, ...tableProps } = props
      return <HtmlSheetTable key={sheetTableKey} id={sheetTableId} data={data} tableProps={tableProps} />
    }
    const id = node.getAttribute('data-field')
    let children
    if (id) {
      const field = definition.fields[id]
      props.title = field.label
      if (onSelectField) {
        props.tabIndex = 0
        props.role = 'button'
        props['aria-label'] = `Cấu hình ${field.label}`
        props.onClick = event => { event.stopPropagation(); onSelectField(id) }
        props.onKeyDown = event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); onSelectField(id) } }
        props.style = { ...props.style, cursor: 'pointer', outline: `${selectedFieldId === id ? 2 : 1}px ${selectedFieldId === id ? 'solid' : 'dashed'} #6366f1`, outlineOffset: 1, minWidth: 12, display: ['td', 'th'].includes(tag) ? 'table-cell' : 'inline-block' }
      }
      const value = resolveHtmlField(id, field, definition, data, context.row, context.rowIndex)
      const path = getHtmlManualPath(id, field, definition, context.rowIndex)
      children = editable && field.mode === 'manual' ? (
        <input
          aria-label={field.label}
          data-document-manual-input="true"
          value={get(data, path, field.value) ?? ''}
          placeholder={getHtmlManualPlaceholder(field)}
          title={`Nhập tay: ${field.label}`}
          onChange={event => onManualFieldChange?.(path, event.target.value)}
          style={{ width: '100%', minWidth: 36, minHeight: 24, boxSizing: 'border-box', font: 'inherit', color: 'inherit', textAlign: 'inherit', background: 'rgba(37, 99, 235, 0.07)', padding: '2px 5px', border: '1px dashed rgba(37, 99, 235, 0.55)', borderRadius: 3, outline: 0 }}
        />
      ) : value || (onSelectField ? `[${field.label}]` : '\u00a0')
    } else children = Array.from(node.childNodes).map((child, index) => render(child, `${key}-${index}`, context))
    return ['img', 'br', 'hr', 'col'].includes(tag) ? React.createElement(tag, props) : React.createElement(tag, props, children)
  }
  const landscape = template.page?.orientation === 'landscape'
  return (
    <div className={`document-pdf-page ${pageClassName}`} data-html-scope={scope} style={{ position: 'relative', isolation: 'isolate', contain: 'layout style', width: landscape ? 1123 : 794, minHeight: landscape ? 794 : 1123, boxSizing: 'border-box', background: '#fff', margin: '0 auto 28px', color: '#000', fontFamily: 'Times New Roman', lineHeight: 'normal' }}>
      <style>{`${css}\n[data-html-scope="${scope}"] [data-document-manual-input="true"]::placeholder { color:#64748b;opacity:.72;font-style:italic; }\n[data-html-scope="${scope}"] [data-document-manual-input="true"]:focus { background:rgba(37,99,235,.12)!important;border-color:#2563eb!important;box-shadow:0 0 0 2px rgba(37,99,235,.16); }\n@media print { [data-html-scope="${scope}"] { break-inside:auto!important; } [data-html-scope="${scope}"] > .document { break-inside:auto!important; } [data-html-scope="${scope}"] input { border:0!important;background:transparent!important;box-shadow:none!important;padding:0!important; } }`}</style>
      {Array.from(doc.body.childNodes).map((node, index) => render(node, String(index)))}
    </div>
  )
}
export default HtmlTemplateContent
