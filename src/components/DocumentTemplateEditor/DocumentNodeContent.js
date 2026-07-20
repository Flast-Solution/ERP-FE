import React from 'react'
import { Input } from 'antd'
import { COMPONENT_TYPES } from './constants'
import { formatBindingValue, getValueByPath, resolveNodeValue } from './utils'
import { TablePlaceholder } from './styles'

const resolveStyle = (style = {}) => ({
  fontFamily: style.fontFamily,
  fontSize: style.fontSize,
  fontWeight: style.fontWeight,
  textAlign: style.textAlign,
  color: style.color,
  backgroundColor: style.backgroundColor,
  border: `${style.borderWidth ?? 0}px solid ${style.borderColor ?? '#d9d9d9'}`,
  borderRadius: style.borderRadius,
  padding: style.padding,
  marginBottom: style.marginBottom,
  boxSizing: 'border-box',
})

const DynamicTable = ({ node, data, preview }) => {
  const rows = getValueByPath(data, node.source, [])
  const previewRows = Array.isArray(rows) && rows.length ? rows : (preview ? [] : [{}])

  return (
    <TablePlaceholder>
      <thead>
        <tr>
          {(node.columns ?? []).map(column => <th key={column.id}>{column.title}</th>)}
        </tr>
      </thead>
      <tbody>
        {previewRows.length ? previewRows.map((row, rowIndex) => (
          <tr key={row?.id ?? row?.key ?? rowIndex}>
            {(node.columns ?? []).map(column => (
              <td key={column.id} style={{ textAlign: column.align }}>
                {formatBindingValue(getValueByPath(row, column.binding, preview ? '' : `{{ ${column.binding} }}`), column.format)}
              </td>
            ))}
          </tr>
        )) : (
          <tr><td colSpan={Math.max(node.columns?.length ?? 0, 1)} style={{ textAlign: 'center', color: '#9ca3af' }}>Không có dữ liệu</td></tr>
        )}
      </tbody>
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

const DocumentNodeContent = ({ node, data = {}, preview = false }) => {
  if (!node?.visible && preview) return null
  const style = resolveStyle(node.style)
  const boundValue = preview ? resolveNodeValue(node, data) : `{{ ${node.binding || 'chưa chọn field'} }}`

  switch (node.type) {
    case COMPONENT_TYPES.TEXT:
      return <div style={style}>{node.content}</div>
    case COMPONENT_TYPES.DATA_FIELD:
    case COMPONENT_TYPES.DATE:
      return <div style={style}>{node.label ? <strong>{node.label}: </strong> : null}{boundValue}</div>
    case COMPONENT_TYPES.MANUAL_FIELD:
      return <div style={style}><div style={{ marginBottom: 5, fontWeight: 600 }}>{node.label}</div><Input disabled={preview} placeholder={node.placeholder} /></div>
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
