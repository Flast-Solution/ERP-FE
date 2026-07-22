import React, { useRef, useState } from 'react'
import { Button, Drawer, Empty, message, Space, Spin } from 'antd'
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useReactToPrint } from 'react-to-print'
import DocumentNodeContent from '@/components/DocumentTemplateEditor/DocumentNodeContent'
import { A4ContentGrid, A4Page, CanvasViewport } from '@/components/DocumentTemplateEditor/styles'

const getPdfFileName = (template, title, data) => {
  const orderCode = data?.customerOrder?.code ?? data?.order?.code
  const rawName = orderCode
    ? `${template?.name ?? title}-${orderCode}`
    : template?.name ?? title ?? 'chung-tu'

  const normalizedName = String(rawName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${normalizedName || 'chung-tu'}.pdf`
}

const GeneratedDocumentViewer = ({
  open,
  title = 'Chứng từ',
  loading = false,
  template,
  data = {},
  onClose,
}) => {
  const documentRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const orientation = template?.page?.orientation === 'landscape' ? 'landscape' : 'portrait'
  const pageWidth = orientation === 'landscape' ? 297 : 210
  const pageHeight = orientation === 'landscape' ? 210 : 297
  const printDocument = useReactToPrint({
    contentRef: documentRef,
    documentTitle: template?.name || title,
    pageStyle: `
      @page { size: A4 ${orientation}; margin: 0; }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .generated-document-page {
          width: ${pageWidth}mm !important;
          min-height: ${pageHeight}mm !important;
          margin: 0 !important;
          border: 0 !important;
          box-shadow: none !important;
        }
        .generated-document-page > div > div,
        .generated-document-page tr,
        .generated-document-page img { break-inside: avoid; }
        .generated-document-page thead { display: table-header-group; }
      }
    `,
  })

  const downloadPdf = async () => {
    if (!documentRef.current || downloading) return

    setDownloading(true)

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready
      }

      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
        compress: true,
      })
      const pagePixelHeight = Math.max(1, Math.floor(canvas.width * pageHeight / pageWidth))
      let pageIndex = 0

      for (let offsetY = 0; offsetY < canvas.height; offsetY += pagePixelHeight) {
        const sliceHeight = Math.min(pagePixelHeight, canvas.height - offsetY)
        const pageCanvas = document.createElement('canvas')
        const pageContext = pageCanvas.getContext('2d')

        pageCanvas.width = canvas.width
        pageCanvas.height = sliceHeight
        pageContext.fillStyle = '#ffffff'
        pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        pageContext.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight,
        )

        if (pageIndex > 0) pdf.addPage('a4', orientation)

        const imageHeight = sliceHeight * pageWidth / canvas.width
        pdf.addImage(
          pageCanvas.toDataURL('image/jpeg', 0.95),
          'JPEG',
          0,
          0,
          pageWidth,
          imageHeight,
          undefined,
          'FAST',
        )
        pageIndex += 1
      }

      pdf.save(getPdfFileName(template, title, data))
      message.success('Đã tải chứng từ PDF')
    } catch (error) {
      console.error('Không thể tạo PDF từ chứng từ', error)
      message.error('Không thể tạo file PDF. Vui lòng kiểm tra ảnh trong chứng từ và thử lại.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      width="min(1100px, 92vw)"
      extra={(
        <Space>
          <Button icon={<PrinterOutlined />} disabled={!template} onClick={printDocument}>In</Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            disabled={!template}
            loading={downloading}
            onClick={downloadPdf}
          >
            Tải xuống
          </Button>
        </Space>
      )}
      styles={{ body: { padding: 0, background: '#eef1f5' } }}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        {!loading && !template ? (
          <div style={{ minHeight: 'calc(100vh - 56px)', display: 'grid', placeItems: 'center' }}>
            <Empty description="Đơn hàng chưa có mẫu báo giá" />
          </div>
        ) : (
          <CanvasViewport>
            {template ? (
              <A4Page
                ref={documentRef}
                className="generated-document-page"
                $margin={template.page?.margin}
              >
                <A4ContentGrid
                  $columns={template.layout?.columns}
                  $columnGap={template.layout?.columnGap}
                  $rowGap={template.layout?.rowGap}
                >
                  {(template.nodes ?? []).map(node => (
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
                  ))}
                </A4ContentGrid>
              </A4Page>
            ) : null}
          </CanvasViewport>
        )}
      </Spin>
    </Drawer>
  )
}

export default GeneratedDocumentViewer
