import React from 'react'
import { Input } from 'antd'
import { resolveRuntimeAssetUrl } from '@/containers/PreviewModal/uploadUtils'
import { COMPONENT_TYPES } from './constants'
import { getImportedSkuSettings } from './importedTextBindings'
import { formatBindingValue, getValueByPath, resolveBindingValue, resolveNodeValue } from './utils'
import { TablePlaceholder } from './styles'

const resolveStyle = (style = {}) => ({
  fontFamily: style.fontFamily || 'Times New Roman',
  fontSize: style.fontSize,
  fontWeight: style.fontWeight,
  lineHeight: style.lineHeight,
  textAlign: style.textAlign,
  color: style.color,
  backgroundColor: style.backgroundColor,
  borderStyle: 'solid',
  borderColor: style.borderColor ?? '#d9d9d9',
  borderWidth: style.borderWidth ?? 0,
  borderTopWidth: style.borderTopWidth ?? style.borderWidth ?? 0,
  borderRightWidth: style.borderRightWidth ?? style.borderWidth ?? 0,
  borderBottomWidth: style.borderBottomWidth ?? style.borderWidth ?? 0,
  borderLeftWidth: style.borderLeftWidth ?? style.borderWidth ?? 0,
  borderRadius: style.borderRadius,
  padding: style.padding,
  marginBottom: style.marginBottom,
  boxSizing: 'border-box',
  whiteSpace: style.whiteSpace,
})

const resolveGridItemStyle = node => ({
  gridColumn: node.layout?.startNewRow
    ? `1 / span ${node.layout?.columnSpan ?? 12}`
    : `span ${node.layout?.columnSpan ?? 12}`,
  gridRow: node.layout?.rowStart
    ? `${node.layout.rowStart} / span ${node.layout?.rowSpan ?? 1}`
    : `span ${node.layout?.rowSpan ?? 1}`,
  minWidth: 0,
  minHeight: node.layout?.minHeight || undefined,
})

const interpolateBindings = (content, data, node) => String(content ?? '').replace(
  /{{\s*([^{}]+?)\s*}}/g,
  (_, path) => {
    const tokenPath = path.trim()
    if (tokenPath.startsWith('sku:')) {
      return escapeHtml(formatBindingValue(resolveBindingValue(data, 'skuDetails.values.text', tokenPath.slice(4), '')))
    }
    if (node?.tableCell && tokenPath.startsWith('skuDetails.')) {
      const skuPath = tokenPath.replace(/^skuDetails\.value(?=\.|$)/, 'skuDetails.values')
      return escapeHtml(formatBindingValue(resolveBindingValue(data, skuPath, node.skuAttributeLabel, '')))
    }
    const sum = tokenPath.match(/^SUM\(([^)]+)\)$/i)
    if (sum) {
      const values = getValueByPath(data, sum[1].trim(), [])
      return formatBindingValue([values].flat(Infinity).reduce((total, value) => total + (Number(value) || 0), 0), 'number_en')
    }
    if (node?.pdfContentMode === 'sku' && tokenPath.startsWith('skuDetails.')) {
      const { source, rowIndex } = getImportedSkuSettings(node)
      // The API uses values[]. Accept the user's singular value alias as well.
      const skuPath = tokenPath.replace(/^skuDetails\.value(?=\.|$)/, 'skuDetails.values')
      const value = resolveBindingValue(data, `${source}.${rowIndex}.${skuPath}`, node.skuAttributeLabel, '')
      // SKU values are text; only the authored template may supply HTML markup.
      return escapeHtml(formatBindingValue(value))
    }
    return escapeHtml(formatBindingValue(getValueByPath(data, tokenPath, '')))
  },
)

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const renderListItems = value => {
  const items = String(value ?? '')
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean)
  const normalizedItems = items.length ? items : ['']
  return normalizedItems.map(item => `<li>${item ? escapeHtml(item) : '<br>'}</li>`).join('')
}

const renderRichTextHtml = ({ content, data, preview, editable, node }) => {
  const manualLists = []
  const manualInputs = []
  const contentWithListMarkers = String(content ?? '').replace(
    /{{\s*input-list:([^{}]+?)\s*}}/g,
    (_, path) => {
      const marker = `__DOCUMENT_MANUAL_LIST_${manualLists.length}__`
      manualLists.push({ marker, path: path.trim() })
      return marker
    },
  )
  const contentWithMarkers = contentWithListMarkers.replace(
    /{{\s*input:([^{}]+?)\s*}}/g,
    (_, path) => {
      const marker = `__DOCUMENT_MANUAL_INPUT_${manualInputs.length}__`
      manualInputs.push({ marker, path: path.trim() })
      return marker
    },
  )
  const resolvedContent = preview ? interpolateBindings(contentWithMarkers, data, node) : contentWithMarkers
  let html = sanitizeRichText(resolvedContent)

  manualLists.forEach(({ marker, path }) => {
    const value = getValueByPath(data, path, '')
    let replacement = `[Danh sách nhập tay: ${escapeHtml(path)}]`
    if (preview && editable) {
      replacement = `<ul data-document-manual-list-path="${escapeHtml(path)}" contenteditable="true" style="list-style-type:disc;list-style-position:outside;margin:2px 0 0;padding-left:24px;outline:none;min-height:24px">${renderListItems(value)}</ul>`
    } else if (preview) {
      replacement = `<ul style="list-style-type:disc;list-style-position:outside;margin:2px 0 0;padding-left:24px">${renderListItems(value)}</ul>`
    }
    html = html.replace(new RegExp(`\\s*${marker}\\s*`), replacement)
  })

  manualInputs.forEach(({ marker, path }) => {
    const value = getValueByPath(data, path, '')
    let replacement = `[Nhập tay: ${escapeHtml(path)}]`
    if (preview && editable) {
      replacement = `<input data-document-manual-path="${escapeHtml(path)}" value="${escapeHtml(value)}" placeholder="Nhập nội dung" style="display:block;width:100%;min-width:80px;height:28px;padding:2px 0;border:0;border-bottom:1px solid currentColor;border-radius:0;outline:none;color:inherit;background:transparent;font:inherit;text-align:inherit;box-sizing:border-box" />`
    } else if (preview) {
      replacement = value
        ? escapeHtml(formatBindingValue(value))
        : '<span style="display:block;min-height:24px;border-bottom:1px solid currentColor">&nbsp;</span>'
    }
    html = html.replace(new RegExp(`\\s*${marker}\\s*`), replacement)
  })

  return html
}

const sanitizeRichText = (html) => {
  if (typeof window === 'undefined' || typeof window.DOMParser !== 'function') return html
  const allowedTags = new Set([
    'B', 'STRONG', 'I', 'EM', 'U', 'S', 'BR', 'P', 'DIV', 'SPAN',
    'SMALL', 'SUB', 'SUP', 'UL', 'OL', 'LI',
  ])
  const parser = new window.DOMParser()
  const documentNode = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = documentNode.body.firstElementChild
  root?.querySelectorAll('*').forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes)
      return
    }
    Array.from(element.attributes).forEach((attribute) => {
      if (attribute.name !== 'style') element.removeAttribute(attribute.name)
    })
    if (element.hasAttribute('style')) {
      const allowedStyles = new Set([
        'color',
        'background-color',
        'font-size',
        'font-weight',
        'line-height',
        'text-align',
        'text-decoration',
        'text-decoration-line',
        'text-decoration-style',
        'text-decoration-color',
        'text-underline-offset',
        'list-style-type',
        'list-style-position',
        'margin',
        'margin-top',
        'margin-right',
        'margin-bottom',
        'margin-left',
        'padding',
        'padding-top',
        'padding-right',
        'padding-bottom',
        'padding-left',
      ])
      Array.from(element.style).forEach(property => {
        if (!allowedStyles.has(property)) element.style.removeProperty(property)
      })
    }
    if (['P', 'DIV'].includes(element.tagName)) element.style.margin = '0'
    if (['UL', 'OL'].includes(element.tagName)) {
      if (!element.style.margin) element.style.margin = '2px 0 0'
      if (!element.style.paddingLeft) element.style.paddingLeft = '24px'
      if (!element.style.listStylePosition) element.style.listStylePosition = 'outside'
    }
    if (element.tagName === 'LI' && !element.style.margin) element.style.margin = '0'
  })

  root?.querySelectorAll('li').forEach((listItem) => {
    if (['UL', 'OL'].includes(listItem.parentElement?.tagName)) return

    const list = documentNode.createElement('ul')
    list.style.listStyleType = 'disc'
    list.style.listStylePosition = 'outside'
    list.style.margin = '2px 0 0'
    list.style.paddingLeft = '24px'
    listItem.replaceWith(list)
    list.appendChild(listItem)

    let nextElement = list.nextElementSibling
    while (nextElement?.tagName === 'LI') {
      const followingElement = nextElement.nextElementSibling
      list.appendChild(nextElement)
      nextElement = followingElement
    }
  })

  const blockTags = new Set(['DIV', 'P', 'UL', 'OL', 'LI'])
  const textNodes = []
  const walker = documentNode.createTreeWalker(root, window.NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) textNodes.push(walker.currentNode)
  textNodes.forEach((textNode) => {
    if (!/^\s+$/.test(textNode.nodeValue ?? '')) return
    const previousTag = textNode.previousSibling?.nodeType === 1
      ? textNode.previousSibling.tagName
      : null
    const nextTag = textNode.nextSibling?.nodeType === 1
      ? textNode.nextSibling.tagName
      : null
    const parentTag = textNode.parentElement?.tagName
    if (blockTags.has(previousTag) || blockTags.has(nextTag) || ['UL', 'OL'].includes(parentTag)) {
      textNode.remove()
    }
  })

  return root?.innerHTML ?? ''
}

const evaluateFormula = (formula, rows) => {
  const normalized = String(formula ?? '').trim()
  const sumMatch = normalized.match(/^SUM\(([^)]+)\)$/i)
  if (sumMatch) {
    return rows.reduce((total, row) => total + (Number(getValueByPath(row, sumMatch[1].trim(), 0)) || 0), 0)
  }
  const productMatch = normalized.match(/^SUMPRODUCT\(([^,]+),\s*([^)]+)\)$/i)
  if (productMatch) {
    return rows.reduce((total, row) => total
      + (Number(getValueByPath(row, productMatch[1].trim(), 0)) || 0)
        * (Number(getValueByPath(row, productMatch[2].trim(), 0)) || 0), 0)
  }
  return normalized
}

const DynamicTable = ({ node, data, preview, editable = false, onTableCellChange }) => {
  const rows = getValueByPath(data, node.source, [])
  const previewRows = Array.isArray(rows) && rows.length ? rows : (preview ? [] : [{}])
  const borderColor = node.tableStyle?.borderColor ?? '#d1d5db'
  const borderWidth = node.tableStyle?.borderWidth ?? 1
  const cellBorder = `${borderWidth}px solid ${borderColor}`
  const cellPadding = node.tableStyle?.cellPadding ?? 8
  const headerRows = Array.isArray(node.headerRows) ? node.headerRows : []
  const summaryRows = Array.isArray(node.summaryRows) ? node.summaryRows : []
  // Fixed-width columns must wrap long labels rather than paint over adjacent cells.
  // Share these rules between ordinary headers and merged/multi-row headers.
  const headerStyle = {
    border: cellBorder,
    padding: cellPadding,
    whiteSpace: 'pre-line',
    overflowWrap: 'anywhere',
    wordBreak: 'normal',
    verticalAlign: 'middle',
    fontSize: node.tableStyle?.headerFontSize ?? node.style?.fontSize,
    lineHeight: node.tableStyle?.headerLineHeight ?? 1.25,
  }

  return (
    <TablePlaceholder style={{ borderColor, fontSize: node.style?.fontSize, tableLayout: 'fixed' }}>
      <colgroup>
        {(node.columns ?? []).map(column => (
          <col key={column.id} style={{ width: column.width ? `${column.width}%` : undefined }} />
        ))}
      </colgroup>
      <thead>
        {headerRows.length ? headerRows.map((headerRow, rowIndex) => (
          <tr key={headerRow.id ?? rowIndex} data-pdf-avoid-break="true">
            {(headerRow.cells ?? []).map((cell, cellIndex) => (
              <th
                key={cell.id ?? cellIndex}
                colSpan={cell.colSpan || 1}
                rowSpan={cell.rowSpan || 1}
                style={{
                  ...headerStyle,
                  textAlign: cell.align || 'center',
                  color: cell.color,
                  fontWeight: cell.fontWeight,
                  backgroundColor: cell.backgroundColor || node.tableStyle?.headerBackgroundColor,
                }}
              >
                {preview ? interpolateBindings(cell.title, data) : cell.title}
              </th>
            ))}
          </tr>
        )) : (
          <tr data-pdf-avoid-break="true">
            {(node.columns ?? []).map(column => (
              <th
                key={column.id}
                colSpan={column.headerColSpan || 1}
                rowSpan={column.headerRowSpan || 1}
                style={{
                  ...headerStyle,
                  textAlign: column.headerAlign || column.align || 'center',
                  backgroundColor: column.headerBackgroundColor || node.tableStyle?.headerBackgroundColor,
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        )}
      </thead>
      <tbody>
        {previewRows.length ? previewRows.map((row, rowIndex) => (
          <tr key={row?.id ?? row?.key ?? rowIndex} data-pdf-avoid-break="true">
            {(node.columns ?? []).map(column => {
              const isManual = column.inputMode === 'manual'
              const fallback = preview
                ? ''
                : (isManual ? `[Nhập tay: ${column.binding || 'chưa đặt key'}]` : `{{ ${column.binding} }}`)
              const value = resolveBindingValue(row, column.binding, column.skuAttributeLabel, fallback)

              return (
                <td key={column.id} style={{ border: cellBorder, padding: cellPadding, height: node.tableStyle?.rowMinHeight, verticalAlign: column.verticalAlign || 'middle', textAlign: column.align, color: column.color, backgroundColor: column.backgroundColor, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
                  {isManual && preview && editable ? (
                    <Input
                      variant="borderless"
                      value={value}
                      placeholder={column.placeholder || 'Nhập nội dung'}
                      onChange={event => onTableCellChange?.({
                        node,
                        row,
                        rowIndex,
                        column,
                        value: event.target.value,
                      })}
                      style={{ padding: 0, textAlign: column.align || 'left' }}
                    />
                  ) : column.cellTemplate
                    ? <span dangerouslySetInnerHTML={{ __html: sanitizeRichText(preview ? interpolateBindings(column.cellTemplate, row, { ...column, tableCell: true }) : column.cellTemplate) }} />
                    : formatBindingValue(value, column.format)}
                </td>
              )
            })}
          </tr>
        )) : (
          <tr data-pdf-avoid-break="true"><td colSpan={Math.max(node.columns?.length ?? 0, 1)} style={{ textAlign: 'center', color: '#9ca3af' }}>Không có dữ liệu</td></tr>
        )}
      </tbody>
      {summaryRows.length ? (
        <tfoot>
          {summaryRows.map((summary, index) => {
            if (Array.isArray(summary.cells) && summary.cells.length) {
              return (
                <tr key={summary.id ?? index} data-pdf-avoid-break="true">
                  {summary.cells.map((cell, cellIndex) => (
                    <td key={cell.id ?? cellIndex} colSpan={cell.colSpan || 1} style={{ border: cellBorder, padding: cellPadding, textAlign: cell.align || 'right', backgroundColor: cell.backgroundColor || summary.backgroundColor, fontWeight: summary.fontWeight || 700 }}>
                      {cell.formula
                        ? formatBindingValue(preview ? evaluateFormula(cell.formula, Array.isArray(rows) ? rows : []) : cell.formula, cell.format || 'number')
                        : cell.label}
                    </td>
                  ))}
                </tr>
              )
            }
            const labelColSpan = Math.min(
              Math.max(Number(summary.labelColSpan) || Math.max((node.columns?.length ?? 1) - 1, 1), 1),
              Math.max(node.columns?.length ?? 1, 1),
            )
            const valueColSpan = Math.max((node.columns?.length ?? 1) - labelColSpan, 1)
            const value = preview ? evaluateFormula(summary.formula, Array.isArray(rows) ? rows : []) : (summary.formula || 'Công thức')
            return (
              <tr key={summary.id ?? index} data-pdf-avoid-break="true">
                <td colSpan={labelColSpan} style={{ border: cellBorder, padding: cellPadding, textAlign: summary.labelAlign || 'right', fontWeight: summary.fontWeight || 700, backgroundColor: summary.backgroundColor }}>
                  {summary.label}
                </td>
                <td colSpan={valueColSpan} style={{ border: cellBorder, padding: cellPadding, textAlign: summary.valueAlign || 'right', fontWeight: summary.fontWeight || 700, backgroundColor: summary.backgroundColor }}>
                  {formatBindingValue(value, summary.format || 'number')}
                </td>
              </tr>
            )
          })}
        </tfoot>
      ) : null}
    </TablePlaceholder>
  )
}

const CodeGraphic = ({ type, value, size = 96, height = 64 }) => {
  if (type === COMPONENT_TYPES.QR_CODE) {
    return (
      <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(7, 1fr)', width: size, height: size, border: '5px solid #fff', boxShadow: '0 0 0 1px #111' }}>
        {Array.from({ length: 49 }).map((_, index) => (
          <i key={index} style={{ background: (index * 7 + index % 3) % 5 < 2 ? '#111' : '#fff' }} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div style={{ width: 220, height, background: 'repeating-linear-gradient(90deg,#111 0 2px,#fff 2px 5px,#111 5px 6px,#fff 6px 9px)' }} />
      <div style={{ width: 220, marginTop: 4, textAlign: 'center', fontSize: 11 }}>{value}</div>
    </div>
  )
}

const DocumentNodeContent = ({
  node,
  data = {},
  preview = false,
  editable = false,
  onTableCellChange,
  onManualFieldChange,
  renderChildren,
}) => {
  if (node?.visible === false && preview) return null
  const style = resolveStyle(node.style)
  const stretchedStyle = { ...style, height: '100%' }
  const boundValue = preview ? resolveNodeValue(node, data) : `{{ ${node.binding || 'chưa chọn field'} }}`

  switch (node.type) {
    case COMPONENT_TYPES.TEXT:
      return <div style={stretchedStyle}>{node.content}</div>
    case COMPONENT_TYPES.RICH_TEXT: {
      const html = renderRichTextHtml({
        content: node.content,
        data,
        preview,
        editable,
        node,
      })
      return (
        <div
          style={stretchedStyle}
          dangerouslySetInnerHTML={{ __html: html }}
          onBlur={event => {
            const inputPath = event.target?.dataset?.documentManualPath
            if (inputPath) onManualFieldChange?.(inputPath, event.target.value)

            const listPath = event.target?.dataset?.documentManualListPath
            if (listPath) {
              const value = Array.from(event.target.querySelectorAll('li'))
                .map(item => item.textContent.trim())
                .filter(Boolean)
                .join('\n')
              onManualFieldChange?.(listPath, value)
            }
          }}
        />
      )
    }
    case COMPONENT_TYPES.CONTAINER:
      return (
        <div style={{ ...style, height: '100%', minHeight: node.layout?.minHeight ?? 160 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${node.grid?.columns ?? 12}, minmax(0, 1fr))`,
            gridTemplateRows: node.grid?.rows
              ? `repeat(${node.grid.rows}, minmax(${node.grid?.rowHeight ?? 80}px, auto))`
              : undefined,
            gridAutoRows: `minmax(${node.grid?.rowHeight ?? 80}px, auto)`,
            gridAutoFlow: 'row',
            columnGap: node.grid?.columnGap ?? 0,
            rowGap: node.grid?.rowGap ?? 0,
            alignItems: 'stretch',
            alignContent: 'start',
            minHeight: Math.max((node.layout?.minHeight ?? 160) - ((node.style?.padding ?? 8) * 2), 0),
          }}>
            {renderChildren
              ? renderChildren(node.children ?? [])
              : (node.children ?? []).map(child => (
                <div key={child.id} style={resolveGridItemStyle(child)} data-pdf-avoid-break="true">
                  <DocumentNodeContent
                    node={child}
                    data={data}
                    preview={preview}
                    editable={editable}
                    onTableCellChange={onTableCellChange}
                    onManualFieldChange={onManualFieldChange}
                  />
                </div>
              ))}
          </div>
        </div>
      )
    case COMPONENT_TYPES.DATA_FIELD:
    case COMPONENT_TYPES.DATE:
      return <div style={stretchedStyle}>{node.label ? <strong>{node.label}: </strong> : null}{boundValue}</div>
    case COMPONENT_TYPES.MANUAL_FIELD:
      return <div style={stretchedStyle}><div style={{ marginBottom: 5, fontWeight: 600 }}>{node.label}</div><Input disabled={preview} placeholder={node.placeholder} /></div>
    case COMPONENT_TYPES.TABLE:
      return (
        <div style={style}>
          <DynamicTable
            node={node}
            data={data}
            preview={preview}
            editable={editable}
            onTableCellChange={onTableCellChange}
          />
        </div>
      )
    case COMPONENT_TYPES.IMAGE:
    case COMPONENT_TYPES.LOGO:
      return (
        <div style={style}>
          {node.src
            ? <img src={resolveRuntimeAssetUrl(node.src)} alt={node.alt ?? ''} style={{ maxWidth: '100%', height: node.height, objectFit: 'contain' }} />
            : <div style={{ height: node.height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#9ca3af' }}>{node.type === COMPONENT_TYPES.LOGO ? 'Logo' : 'Hình ảnh'}</div>}
        </div>
      )
    case COMPONENT_TYPES.QR_CODE:
    case COMPONENT_TYPES.BARCODE:
      return <div style={style}><CodeGraphic type={node.type} value={boundValue} size={node.size} height={node.height} /></div>
    case COMPONENT_TYPES.RECTANGLE:
      return <div style={{ ...style, height: node.height }} />
    case COMPONENT_TYPES.LINE:
      return <div style={{ ...style, padding: 0, border: 0, borderTop: `1px solid ${node.style?.borderColor ?? '#111'}` }} />
    case COMPONENT_TYPES.DIVIDER:
      return <div style={{ ...style, padding: 0, border: 0, borderTop: `1px dashed ${node.style?.borderColor ?? '#d1d5db'}` }} />
    case COMPONENT_TYPES.SIGNATURE:
      return <div style={{ ...style, minHeight: node.height }}><strong>{node.title}</strong><div style={{ marginTop: 6, fontSize: 12 }}>{node.subtitle}</div></div>
    default:
      return null
  }
}

export default DocumentNodeContent
