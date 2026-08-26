import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Drawer,
  Empty,
  Input,
  message,
  Segmented,
  Spin,
  Tooltip,
} from 'antd'
import {
  CheckOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  DownloadOutlined,
  MinusOutlined,
  PlusOutlined,
  PrinterOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useReactToPrint } from 'react-to-print'
import DocumentNodeContent from '@/components/DocumentTemplateEditor/DocumentNodeContent'
import { A4ContentGrid, A4Page } from '@/components/DocumentTemplateEditor/styles'
import { getValueByPath } from '@/components/DocumentTemplateEditor/utils'
import {
  DiscussionComposer,
  DiscussionHeader,
  DiscussionList,
  DiscussionPane,
  CommentCard,
  DocumentCanvas,
  DocumentPane,
  DocumentToolbar,
  DrawerTitle,
  EmptyDiscussion,
  FileInfo,
  PageZoom,
  ToolbarActions,
  ViewerModeBar,
  ViewerShell,
} from './styles'

const EMPTY_COMMENTS = []

const hasManualDocumentFields = (nodes = []) => nodes.some(node => (
  (node?.type === 'dynamicTable' && node.columns?.some(column => column.inputMode === 'manual'))
  || (node?.type === 'richText' && /{{\s*input(?:-list)?:[^{}]+?\s*}}/.test(node.content || ''))
  || hasManualDocumentFields(node?.children ?? [])
))

const setValueByPath = (source, path, value) => {
  const keys = String(path || '').split('.').filter(Boolean)
  if (!keys.length) return source

  const root = Array.isArray(source) ? [...source] : { ...(source ?? {}) }
  let cursor = root
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value
      return
    }
    const currentValue = cursor[key]
    cursor[key] = Array.isArray(currentValue) ? [...currentValue] : { ...(currentValue ?? {}) }
    cursor = cursor[key]
  })
  return root
}

const findCrossingRange = (ranges, minimumTop, target) => ranges.reduce((selected, range) => {
  const crossesBoundary = range.top > minimumTop && range.top < target && range.bottom > target
  return crossesBoundary && (!selected || range.top > selected.top) ? range : selected
}, null)

const getPdfPageSlices = (root, canvasHeight, pagePixelHeight) => {
  const rootRect = root.getBoundingClientRect()
  const scaleY = canvasHeight / Math.max(rootRect.height, 1)
  const protectedRanges = Array.from(root.querySelectorAll('[data-pdf-avoid-break="true"], tbody tr, tfoot tr'))
    .map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        top: Math.max(0, Math.round((rect.top - rootRect.top) * scaleY)),
        bottom: Math.min(canvasHeight, Math.round((rect.bottom - rootRect.top) * scaleY)),
      }
    })
    .filter(range => range.bottom > range.top)

  const slices = []
  let offset = 0
  while (offset < canvasHeight) {
    const target = Math.min(offset + pagePixelHeight, canvasHeight)
    if (target === canvasHeight) {
      slices.push({ offset, height: target - offset })
      break
    }
    const crossingRange = findCrossingRange(
      protectedRanges,
      offset + pagePixelHeight * 0.35,
      target,
    )
    const cutAt = crossingRange?.top ?? target
    slices.push({ offset, height: cutAt - offset })
    offset = cutAt > offset ? cutAt : target
  }
  return slices
}

const getInitials = (name) => String(name ?? 'Bạn')
  .trim()
  .split(/\s+/)
  .slice(-2)
  .map(part => part.charAt(0))
  .join('')
  .toUpperCase()

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
  comments = EMPTY_COMMENTS,
  onSubmitComment,
  commentSubmitting = false,
  onSubmitDocument,
  documentSubmitting = false,
  toolbarContent,
  allowDocumentSubmit = false,
  readOnly = false,
  onApproveDocument,
  onRejectDocument,
  reviewDisabled = false,
  onClose,
}) => {
  const documentRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [zoom, setZoom] = useState(0.85)
  const [activePane, setActivePane] = useState('document')
  const [commentValue, setCommentValue] = useState('')
  const [discussionComments, setDiscussionComments] = useState(comments)
  const [documentData, setDocumentData] = useState(data)
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
          transform: none !important;
        }
        .generated-document-page > div > div,
        .generated-document-page tr,
        .generated-document-page img { break-inside: avoid; }
        .generated-document-page thead { display: table-header-group; }
      }
    `,
  })
  const pdfFileName = useMemo(
    () => getPdfFileName(template, title, documentData),
    [documentData, template, title],
  )
  const customerOrder = documentData?.customerOrder
  const customerName = customerOrder?.enterpriseName
    ?? customerOrder?.customerReceiverName
    ?? documentData?.customer?.name

  useEffect(() => {
    if (!open) return
    setZoom(0.85)
    setActivePane('document')
    setCommentValue('')
    setDiscussionComments(comments)
  }, [comments, open])

  useEffect(() => {
    if (open) setDocumentData(data)
  }, [data, open])

  const editableDocument = Boolean(!readOnly && !loading && !documentSubmitting
    && (onSubmitDocument || onApproveDocument || onRejectDocument)
    && hasManualDocumentFields(template?.nodes))

  const updateTableCell = ({ node, rowIndex, column, value }) => {
    if (!editableDocument || !node?.source || !column?.binding) return
    setDocumentData(currentData => {
      const rows = getValueByPath(currentData, node.source, [])
      if (!Array.isArray(rows) || !rows[rowIndex]) return currentData
      const nextRows = rows.map((row, index) => (
        index === rowIndex ? setValueByPath(row, column.binding, value) : row
      ))
      return setValueByPath(currentData, node.source, nextRows)
    })
  }

  const updateManualField = (path, value) => {
    if (!editableDocument || !path) return
    setDocumentData(currentData => setValueByPath(currentData, path, value))
  }

  const changeZoom = (amount) => {
    setZoom(current => Math.min(1.4, Math.max(0.6, Number((current + amount).toFixed(1)))))
  }

  const submitComment = async () => {
    const content = commentValue.trim()
    if (!content) return
    if (onSubmitComment) {
      await onSubmitComment(content)
    } else {
      setDiscussionComments(current => [
        ...current,
        {
          id: `local-comment-${Date.now()}`,
          author: 'Bạn',
          role: 'Kinh doanh',
          time: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          content,
        },
      ])
    }
    setCommentValue('')
  }

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
      const pageSlices = getPdfPageSlices(documentRef.current, canvas.height, pagePixelHeight)

      for (const pageSlice of pageSlices) {
        const offsetY = pageSlice.offset
        const sliceHeight = pageSlice.height
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
      title={(
        <DrawerTitle>
          <div className="drawer-title">
            {title}
          </div>
          {customerName ? <div className="drawer-subtitle">{customerName}</div> : null}
        </DrawerTitle>
      )}
      open={open}
      onClose={onClose}
      width="min(750px, calc(100vw - 16px))"
      closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: 18 }} />}
      styles={{
        header: {
          minHeight: 80,
          padding: '14px 24px',
          color: '#fff',
          background: '#192c46',
          borderBottom: 0,
        },
        body: { padding: 0, overflow: 'hidden', background: '#eef1f5' },
      }}
      destroyOnHidden
    >
      <ViewerModeBar>
        <Segmented
          block
          value={activePane}
          onChange={setActivePane}
          options={[
            { value: 'document', label: 'Chứng từ' },
            {
              value: 'discussion',
              label: `Trao đổi (${discussionComments.length})`,
            },
          ]}
        />
      </ViewerModeBar>
      <ViewerShell>
        {activePane === 'document' ? (
          <DocumentPane>
          <DocumentToolbar>
            {toolbarContent ?? <FileInfo>
              <span className="file-dot" />
              <span className="file-name">{pdfFileName}</span>
              <span className="page-count">Trang 1</span>
            </FileInfo>}
            <ToolbarActions>
              {!readOnly && onSubmitDocument && (editableDocument || allowDocumentSubmit) ? (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={documentSubmitting}
                  disabled={loading || !template}
                  onClick={() => onSubmitDocument(documentData)}
                >
                  Lưu báo giá
                </Button>
              ) : null}
              {onApproveDocument ? (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={documentSubmitting}
                  disabled={reviewDisabled || loading || documentSubmitting || !template}
                  onClick={() => onApproveDocument(documentData)}
                >
                  Duyệt
                </Button>
              ) : null}
              {onRejectDocument ? (
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  disabled={reviewDisabled || loading || documentSubmitting || !template}
                  onClick={() => onRejectDocument(documentData)}
                >
                  Từ chối
                </Button>
              ) : null}
              <div className="zoom-control">
                <Button
                  type="text"
                  size="small"
                  icon={<MinusOutlined />}
                  disabled={zoom <= 0.6}
                  onClick={() => changeZoom(-0.1)}
                />
                <span className="zoom-value">{Math.round(zoom * 100)}%</span>
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  disabled={zoom >= 1.4}
                  onClick={() => changeZoom(0.1)}
                />
              </div>
              <Tooltip title="In báo giá">
                <Button
                  type="text"
                  icon={<PrinterOutlined />}
                  disabled={!template}
                  onClick={printDocument}
                />
              </Tooltip>
              <Tooltip title="Tải xuống PDF">
                <Button
                  type="text"
                  icon={<DownloadOutlined />}
                  disabled={!template}
                  loading={downloading}
                  onClick={downloadPdf}
                />
              </Tooltip>
            </ToolbarActions>
          </DocumentToolbar>

          <Spin spinning={loading} wrapperClassName="document-pane-spin">
            <DocumentCanvas>
              {!loading && !template ? (
                <div style={{ minHeight: 'calc(100vh - 210px)', display: 'grid', placeItems: 'center' }}>
                  <Empty description="Đơn hàng chưa có mẫu báo giá" />
                </div>
              ) : null}
              {template ? (
                <PageZoom $zoom={zoom} $orientation={orientation}>
                  <A4Page
                    ref={documentRef}
                    className="generated-document-page"
                    $margin={template.page?.margin}
                    $orientation={orientation}
                  >
                    <A4ContentGrid
                      $columns={template.layout?.columns}
                      $columnGap={template.layout?.columnGap}
                      $rowGap={template.layout?.rowGap}
                    >
                      {(template.nodes ?? []).map(node => (
                        <div
                          key={node.id}
                          data-pdf-avoid-break={node.layout?.avoidPageBreak === false ? undefined : 'true'}
                          style={{
                            gridColumn: node.layout?.startNewRow
                              ? `1 / span ${node.layout?.columnSpan ?? 12}`
                              : `span ${node.layout?.columnSpan ?? 12}`,
                            gridRow: `span ${node.layout?.rowSpan ?? 1}`,
                            minWidth: 0,
                            minHeight: node.layout?.minHeight || undefined,
                          }}
                        >
                          <DocumentNodeContent
                            node={node}
                            data={documentData}
                            preview
                            editable={editableDocument}
                            onTableCellChange={updateTableCell}
                            onManualFieldChange={updateManualField}
                          />
                        </div>
                      ))}
                    </A4ContentGrid>
                  </A4Page>
                </PageZoom>
              ) : null}
            </DocumentCanvas>
          </Spin>
          </DocumentPane>
        ) : null}

        {activePane === 'discussion' ? (
          <DiscussionPane>
          <DiscussionHeader>
            <h3>Trao đổi về báo giá</h3>
            <span>{discussionComments.length} bình luận</span>
          </DiscussionHeader>
          <DiscussionList>
            {discussionComments.length === 0 ? (
              <EmptyDiscussion>Chưa có trao đổi về báo giá này</EmptyDiscussion>
            ) : discussionComments.map(comment => (
              <CommentCard
                key={comment.id}
                $internal={comment.role !== 'Khách hàng'}
              >
                <div className="comment-avatar">{getInitials(comment.author)}</div>
                <div className="comment-body">
                  <div className="comment-meta">
                    <span className="comment-author">{comment.author}</span>
                    {comment.role ? <span className="comment-role">{comment.role}</span> : null}
                    <span className="comment-time">{comment.time}</span>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                </div>
              </CommentCard>
            ))}
          </DiscussionList>
          <DiscussionComposer>
            <div className="composer-row">
              <Input.TextArea
                value={commentValue}
                rows={3}
                placeholder="Nhập phản hồi..."
                onChange={event => setCommentValue(event.target.value)}
              />
              <Button
                type="primary"
                shape="circle"
                size="large"
                icon={<SendOutlined />}
                disabled={!commentValue.trim()}
                loading={commentSubmitting}
                onClick={submitComment}
              />
            </div>
          </DiscussionComposer>
          </DiscussionPane>
        ) : null}
      </ViewerShell>
    </Drawer>
  )
}

export default GeneratedDocumentViewer
