import React, { useRef } from 'react'
import { Button, Drawer, Empty, Segmented, Space } from 'antd'
import { FilePdfOutlined } from '@ant-design/icons'
import { useReactToPrint } from 'react-to-print'
import DocumentNodeContent from './DocumentNodeContent'
import { A4ContentGrid, A4Page, CanvasViewport, CodePreview } from './styles'

const PreviewDrawer = ({ open, template, data, onClose }) => {
  const [mode, setMode] = React.useState('preview')
  const documentRef = useRef(null)
  const orientation = template.page?.orientation === 'landscape' ? 'landscape' : 'portrait'
  const pageWidth = orientation === 'landscape' ? 297 : 210
  const pageHeight = orientation === 'landscape' ? 210 : 297
  const exportPdf = useReactToPrint({
    contentRef: documentRef,
    documentTitle: template.name || 'chung-tu',
    pageStyle: `
      @page {
        size: A4 ${orientation};
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .document-pdf-page {
          width: ${pageWidth}mm !important;
          min-height: ${pageHeight}mm !important;
          margin: 0 !important;
          border: 0 !important;
          box-shadow: none !important;
        }
        .document-pdf-page > div > div {
          break-inside: avoid;
        }
        .document-pdf-page table {
          break-inside: auto;
        }
        .document-pdf-page thead {
          display: table-header-group;
        }
        .document-pdf-page tr,
        .document-pdf-page img {
          break-inside: avoid;
        }
      }
    `,
  })

  return (
    <Drawer
      open={open}
      width="min(980px, 92vw)"
      title="Xem trước chứng từ"
      onClose={onClose}
      extra={(
        <Space>
          <Segmented value={mode} onChange={setMode} options={[{ value: 'preview', label: 'Chứng từ' }, { value: 'json', label: 'Template JSON' }]} />
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            disabled={mode !== 'preview'}
            onClick={exportPdf}
          >
            Xuất PDF
          </Button>
        </Space>
      )}
      styles={{ body: { padding: 0, background: '#eef1f5' } }}
    >
      {mode === 'json' ? (
        <div style={{ padding: 20 }}><CodePreview>{JSON.stringify(template, null, 2)}</CodePreview></div>
      ) : (
        <CanvasViewport>
          <A4Page ref={documentRef} className="document-pdf-page" $margin={template.page?.margin}>
            <A4ContentGrid
              $columns={template.layout?.columns}
              $columnGap={template.layout?.columnGap}
              $rowGap={template.layout?.rowGap}
            >
              {(template.nodes ?? []).length
                ? template.nodes.map(node => (
                  <div
                    key={node.id}
                    style={{
                      gridColumn: node.layout?.startNewRow
                        ? `1 / span ${node.layout?.columnSpan ?? 12}`
                        : `span ${node.layout?.columnSpan ?? 12}`,
                      gridRow: `span ${node.layout?.rowSpan ?? 1}`,
                      minWidth: 0,
                      minHeight: node.layout?.minHeight || undefined,
                    }}
                  >
                    <DocumentNodeContent node={node} data={data} preview />
                  </div>
                ))
                : <div style={{ gridColumn: '1 / -1' }}><Empty description="Template chưa có thành phần" /></div>}
            </A4ContentGrid>
          </A4Page>
        </CanvasViewport>
      )}
    </Drawer>
  )
}

export default PreviewDrawer
