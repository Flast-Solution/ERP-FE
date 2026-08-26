import React from 'react'
import { Empty } from 'antd'
import DocumentNodeContent from './DocumentNodeContent'
import { A4ContentGrid, A4Page } from './styles'
import HtmlTemplateContent from './html/HtmlTemplateContent'

// Shared layout for preview, invoices and quotations; read-only by default.
const DocumentTemplateContent = ({ template, data, editable = false, onTableCellChange, onManualFieldChange, pageClassName = '' }) => {
  if (template.layout?.mode === 'html') return <HtmlTemplateContent template={template} data={data} editable={editable} onManualFieldChange={onManualFieldChange} pageClassName={pageClassName} />
  const renderNode = node => <DocumentNodeContent node={node} data={data} preview editable={editable} onTableCellChange={onTableCellChange} onManualFieldChange={onManualFieldChange} />
  if (template.layout?.mode === 'absolute') {
    return (template.pages?.length ? template.pages : [{ pageNumber: 1, width: 794, height: 1123 }]).map(page => (
      <A4Page
        key={page.pageNumber}
        className={`document-pdf-page ${pageClassName}`}
        $customWidth={page.width}
        $customHeight={page.height}
        $margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        {(template.nodes ?? [])
          .filter(node => (node.layout?.absolute?.page ?? 1) === page.pageNumber)
          .map(node => {
            const position = node.layout?.absolute ?? {}
            return (
              <div
                key={node.id}
                data-pdf-avoid-break="true"
                style={{
                  position: 'absolute',
                  left: position.x ?? 0,
                  top: position.y ?? 0,
                  width: position.width ?? 100,
                  height: position.height ?? 24,
                  transform: `rotate(${position.rotation ?? 0}deg)`,
                  transformOrigin: '0 0',
                }}
              >
                {renderNode(node)}
              </div>
            )
          })}
      </A4Page>
    ))
  }

  return (
    <A4Page className={`document-pdf-page ${pageClassName}`} $margin={template.page?.margin} $orientation={template.page?.orientation}>
      <A4ContentGrid
        $columns={template.layout?.columns}
        $columnGap={template.layout?.columnGap}
        $rowGap={template.layout?.rowGap}
      >
        {(template.nodes ?? []).length
          ? template.nodes.map(node => (
            <div
              key={node.id}
              data-pdf-avoid-break={node.layout?.avoidPageBreak === false ? undefined : 'true'}
              style={{
                gridColumn: node.layout?.startNewRow ? `1 / span ${node.layout?.columnSpan ?? 12}` : `span ${node.layout?.columnSpan ?? 12}`,
                gridRow: `span ${node.layout?.rowSpan ?? 1}`,
                minWidth: 0,
                minHeight: node.layout?.minHeight || undefined,
                height: '100%',
              }}
            >
              {renderNode(node)}
            </div>
          ))
          : <div style={{ gridColumn: '1 / -1' }}><Empty description="Template chưa có thành phần" /></div>}
      </A4ContentGrid>
    </A4Page>
  )
}

export default DocumentTemplateContent
