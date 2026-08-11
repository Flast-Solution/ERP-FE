import React from 'react'
import { Input } from 'antd'
import { COMPONENT_TYPES } from './constants'
import { formatBindingValue, getValueByPath, resolveNodeValue } from './utils'
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

const interpolateBindings = (content, data) => String(content ?? '').replace(
  /{{\s*([^{}]+?)\s*}}/g,
  (_, path) => formatBindingValue(getValueByPath(data, path.trim(), '')),
)

const sanitizeRichText = (html) => {
  if (typeof window === 'undefined' || typeof window.DOMParser !== 'function') return html
  const allowedTags = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'BR', 'P', 'DIV', 'SPAN', 'SMALL', 'SUB', 'SUP'])
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
      const allowedStyles = new Set(['color', 'background-color', 'font-size', 'font-weight', 'line-height', 'text-align', 'text-decoration'])
      Array.from(element.style).forEach(property => {
        if (!allowedStyles.has(property)) element.style.removeProperty(property)
      })
    }
    if (['P', 'DIV'].includes(element.tagName)) element.style.margin = '0'
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

const DynamicTable = ({ node, data, preview }) => {
  const rows = getValueByPath(data, node.source, [])
  const previewRows = Array.isArray(rows) && rows.length ? rows : (preview ? [] : [{}])
  const borderColor = node.tableStyle?.borderColor ?? '#d1d5db'
  const borderWidth = node.tableStyle?.borderWidth ?? 1
  const cellBorder = `${borderWidth}px solid ${borderColor}`
  const cellPadding = node.tableStyle?.cellPadding ?? 8
  const headerRows = Array.isArray(node.headerRows) ? node.headerRows : []
  const summaryRows = Array.isArray(node.summaryRows) ? node.summaryRows : []

  return (
    <TablePlaceholder style={{ borderColor }}>
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
                  border: cellBorder,
                  padding: cellPadding,
                  textAlign: cell.align || 'center',
                  color: cell.color,
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
                  border: cellBorder,
                  padding: cellPadding,
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
            {(node.columns ?? []).map(column => (
              <td key={column.id} style={{ border: cellBorder, padding: cellPadding, textAlign: column.align, color: column.color, backgroundColor: column.backgroundColor }}>
                {column.cellTemplate
                  ? <span dangerouslySetInnerHTML={{ __html: sanitizeRichText(preview ? interpolateBindings(column.cellTemplate, row) : column.cellTemplate) }} />
                  : formatBindingValue(getValueByPath(row, column.binding, preview ? '' : `{{ ${column.binding} }}`), column.format)}
              </td>
            ))}
          </tr>
        )) : (
          <tr data-pdf-avoid-break="true"><td colSpan={Math.max(node.columns?.length ?? 0, 1)} style={{ textAlign: 'center', color: '#9ca3af' }}>Không có dữ liệu</td></tr>
        )}
      </tbody>
      {summaryRows.length ? (
        <tfoot>
          {summaryRows.map((summary, index) => {
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

const DocumentNodeContent = ({ node, data = {}, preview = false, renderChildren }) => {
  if (node?.visible === false && preview) return null
  const style = resolveStyle(node.style)
  const stretchedStyle = { ...style, height: '100%' }
  const boundValue = preview ? resolveNodeValue(node, data) : `{{ ${node.binding || 'chưa chọn field'} }}`

  switch (node.type) {
    case COMPONENT_TYPES.TEXT:
      return <div style={stretchedStyle}>{node.content}</div>
    case COMPONENT_TYPES.RICH_TEXT: {
      const html = sanitizeRichText(preview ? interpolateBindings(node.content, data) : node.content)
      return <div style={stretchedStyle} dangerouslySetInnerHTML={{ __html: html }} />
    }
    case COMPONENT_TYPES.CONTAINER:
      return (
        <div style={{ ...style, height: '100%', minHeight: node.layout?.minHeight || 160 }}>
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
            minHeight: Math.max((node.layout?.minHeight || 160) - ((node.style?.padding ?? 8) * 2), 96),
          }}>
            {renderChildren
              ? renderChildren(node.children ?? [])
              : (node.children ?? []).map(child => (
                <div key={child.id} style={resolveGridItemStyle(child)} data-pdf-avoid-break="true">
                  <DocumentNodeContent node={child} data={data} preview={preview} />
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
      return <div style={style}><DynamicTable node={node} data={data} preview={preview} /></div>
    case COMPONENT_TYPES.IMAGE:
    case COMPONENT_TYPES.LOGO:
      return (
        <div style={style}>
          {node.src
            ? <img src={node.src} alt={node.alt ?? ''} style={{ maxWidth: '100%', height: node.height, objectFit: 'contain' }} />
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
