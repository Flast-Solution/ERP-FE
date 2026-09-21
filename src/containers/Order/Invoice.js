/**************************************************************************/
/*  Invoice.js                                                         		*/
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Empty, Select, Space, Spin, Tag, Tooltip, message } from 'antd'
import {
  CheckOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  MinusOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { useReactToPrint } from 'react-to-print'
import styled from 'styled-components'
import { jsPDF } from 'jspdf'
import { RequestUtils } from '@flast-erp/core/utils'
import DocumentTemplateService from '@/services/DocumentTemplateService'
import { SUCCESS_CODE } from '@/configs'
import DocumentTemplateContent from '@/components/DocumentTemplateEditor/DocumentTemplateContent'
import SheetImportButton from '../../components/DocumentTemplateEditor/SheetImportButton'
import { setSheetTableData } from '../../components/DocumentTemplateEditor/sheetImport'
import { getValueByPath } from '../../components/DocumentTemplateEditor/utils'
import { hasManualDocumentFields, setDocumentValueByPath } from '../../components/GeneratedDocumentViewer/manualEditing'
import { DocumentToolbar, ToolbarActions } from '../../components/GeneratedDocumentViewer/styles'
import {
  captureDocumentPage,
  getPdfPageSlices,
  withPdfCaptureLayout,
} from '../../components/GeneratedDocumentViewer/pdfExport'
import useGetMe from '../../hooks/useGetMe'
import QuotationApproverSelect from './List/components/QuotationApproverSelect'
import { QUOTATION_APPROVAL_STATUS } from './List/constants'
import { mergeSavedQuotationOrder } from './List/utils/quotationMappers'
import {
  buildInvoiceTemplatePayload,
  createInvoiceData,
  createInvoiceOrder,
  createInvoiceOrderFromResponse,
  getInvoiceTemplates,
  parseInvoiceTemplate,
} from './invoiceTemplateUtils'

const APPROVAL_STATUS_META = {
  [QUOTATION_APPROVAL_STATUS.DRAFT]: { label: 'Chưa duyệt', color: 'default' },
  [QUOTATION_APPROVAL_STATUS.PENDING]: { label: 'Chờ duyệt', color: 'processing' },
  [QUOTATION_APPROVAL_STATUS.APPROVED]: { label: 'Đã duyệt', color: 'success' },
}

const InvoiceDocumentToolbar = styled(DocumentToolbar)`
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: thin;

  > .ant-space,
  ${ToolbarActions} {
    flex-wrap: nowrap;
    flex: 0 0 auto;
  }

  ${ToolbarActions} .zoom-control {
    white-space: nowrap;
  }
`

const Invoice = ({ data }) => {
  const { user } = useGetMe()
  const contentRef = useRef(null)
  const dataRef = useRef(data)
  dataRef.current = data
  const [templates, setTemplates] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  const [zoom, setZoom] = useState(85)
  const [sourceOrder, setSourceOrder] = useState(() => createInvoiceOrder(data))
  const [documents, setDocuments] = useState({})
  const [approval, setApproval] = useState(null)
  const [approverId, setApproverId] = useState()
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const refresh = useCallback(() => setReload(value => value + 1), [])
  const approvalStatus = Number(approval?.status ?? QUOTATION_APPROVAL_STATUS.DRAFT)
  const isApprover = Boolean(Number(approval?.userApproval) > 0
    && Number(user?.id) === Number(approval.userApproval))
  const readOnly = approvalStatus !== QUOTATION_APPROVAL_STATUS.DRAFT || isApprover
  const reviewDisabled = approvalStatus !== QUOTATION_APPROVAL_STATUS.PENDING
  const isLoading = loading || invoiceLoading

  useEffect(() => {
    setZoom(85)
  }, [data.customerOrder?.id, selectedId])

  const changeZoom = amount => setZoom(current => Math.min(150, Math.max(50, current + amount)))

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    setTemplates([])
    const load = async () => {
      try {
        const [response, checkResponse] = await Promise.all([
          DocumentTemplateService.fetchTemplates(),
          DocumentTemplateService.checkInvoice(data.customerOrder?.id, 'invoice'),
        ])
        if (Number(response?.errorCode) !== SUCCESS_CODE || !Array.isArray(response?.data)) {
          throw new Error(response?.message || 'Không tải được mẫu hoá đơn')
        }
        if (Number(checkResponse?.errorCode) !== SUCCESS_CODE) {
          throw new Error(checkResponse?.message || 'Không kiểm tra được thông tin phê duyệt hoá đơn')
        }
        if (!active) return
        const invoices = getInvoiceTemplates(response.data)
        setTemplates(invoices)
        setSelectedId(invoices.length ? String(invoices[0].templateId) : '')
        const checkedApproval = checkResponse?.data?.aproval ?? checkResponse?.data
        const nextApproval = checkedApproval
          && !Array.isArray(checkedApproval)
          && (!checkedApproval.type || String(checkedApproval.type).toLowerCase() === 'invoice')
          ? checkedApproval
          : null
        setApproval(nextApproval)
        setApproverId(nextApproval?.userApproval == null ? undefined : Number(nextApproval.userApproval))
      } catch (error) {
        if (active) setLoadError(error?.message || 'Không tải được mẫu hoá đơn')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [data.customerOrder?.id, reload])

  const parsedTemplates = useMemo(() => templates.map(record => {
    try {
      return { record, template: parseInvoiceTemplate(record) }
    } catch {
      return { record, error: 'Mẫu hoá đơn không hợp lệ. Vui lòng kiểm tra lại trong Tạo chứng từ.' }
    }
  }), [templates])
  const selectedTemplate = parsedTemplates.find(({ record }) => String(record.templateId) === selectedId)
  const template = selectedTemplate?.template
  const templateError = selectedTemplate?.error
  const hasInvalidTemplate = parsedTemplates.some(item => item.error)
  useEffect(() => {
    const selected = parsedTemplates.find(({ record }) => String(record.templateId) === selectedId)
    if (!selected?.template || !data.customerOrder?.id) return undefined
    let active = true
    setInvoiceLoading(true)
    setLoadError('')
    DocumentTemplateService.fetchInvoice(data.customerOrder.id, selected.record.name)
      .then(response => {
        if (!active) return
        if (Number(response?.errorCode) !== SUCCESS_CODE) {
          throw new Error(response?.message || `Không tải được dữ liệu mẫu ${selected.record.name}`)
        }
        const nextOrder = createInvoiceOrderFromResponse(response?.data, dataRef.current)
        setSourceOrder(nextOrder)
        setDocuments(current => ({
          ...current,
          [selectedId]: createInvoiceData(
            { customerOrder: nextOrder }, selected.template, selected.record.templateId,
          ),
        }))
      })
      .catch(error => {
        if (active) setLoadError(error?.message || `Không tải được dữ liệu mẫu ${selected.record.name}`)
      })
      .finally(() => {
        if (active) setInvoiceLoading(false)
      })
    return () => { active = false }
  }, [data.customerOrder?.id, parsedTemplates, selectedId])

  const documentData = documents[selectedId] || {}
  const setDocumentData = updater => setDocuments(current => ({
    ...current,
    [selectedId]: typeof updater === 'function' ? updater(current[selectedId] || {}) : updater,
  }))

  const editableDocument = Boolean(template && !isLoading && !saving && !readOnly
    && hasManualDocumentFields(template.nodes, template))

  const updateTableCell = ({ node, rowIndex, column, value }) => {
    if (!editableDocument || !node?.source || !column?.binding) return
    setDocumentData(current => {
      const rows = getValueByPath(current, node.source, [])
      if (!Array.isArray(rows) || !rows[rowIndex]) return current
      const nextRows = rows.map((row, index) => (
        index === rowIndex ? setDocumentValueByPath(row, column.binding, value) : row
      ))
      return setDocumentValueByPath(current, node.source, nextRows)
    })
  }

  const updateManualField = (path, value) => {
    if (editableDocument && path) {
      setDocumentData(current => setDocumentValueByPath(current, path, value))
    }
  }

  const submitInvoice = async action => {
    if (saving || !sourceOrder?.id || !parsedTemplates.length) return
    if (hasInvalidTemplate) {
      message.error('Có mẫu hoá đơn không hợp lệ. Vui lòng kiểm tra lại trong Tạo chứng từ.')
      return
    }
    const reviewing = action === 'approve' || action === 'reject'
    if (reviewing && (!isApprover || reviewDisabled)) {
      message.error('Chỉ người được chỉ định mới có thể duyệt hoá đơn đang chờ duyệt')
      return
    }
    if (!reviewing && readOnly) {
      message.error('Hoá đơn hiện tại không cho phép chỉnh sửa')
      return
    }
    const selectedApprover = reviewing ? Number(approval.userApproval) : approverId
    const nextStatus = action === 'approve'
      ? QUOTATION_APPROVAL_STATUS.APPROVED
      : action === 'reject' || selectedApprover == null
        ? QUOTATION_APPROVAL_STATUS.DRAFT
        : QUOTATION_APPROVAL_STATUS.PENDING
    setSaving(true)
    try {
      const selected = parsedTemplates.find(({ record }) => String(record.templateId) === selectedId)
      if (!selected?.template) throw new Error('Không xác định được mẫu hoá đơn đang chọn')
      const invoice = {
        templateId: selected.record.templateId,
        template: selected.template,
        data: readOnly
          ? createInvoiceData({ customerOrder: sourceOrder }, selected.template, selected.record.templateId)
          : documents[selectedId] || createInvoiceData(
            { customerOrder: sourceOrder }, selected.template, selected.record.templateId,
          ),
      }
      const payload = buildInvoiceTemplatePayload(invoice, sourceOrder, selectedApprover, nextStatus)
      const response = await RequestUtils.Post('/order/save', payload)
      if (Number(response?.errorCode) !== SUCCESS_CODE) {
        throw new Error(response?.message || `Lưu hoá đơn ${invoice.templateId} thất bại`)
      }
      const savedOrder = mergeSavedQuotationOrder(sourceOrder, payload, response?.data)
      const savedApproval = payload.aproval
        ? { ...approval, ...payload.aproval, ...response?.data?.aproval }
        : null
      setSourceOrder(savedOrder)
      setApproval(savedApproval)
      setApproverId(savedApproval?.userApproval == null ? undefined : Number(savedApproval.userApproval))
      setDocuments(current => ({
        ...current,
        [selectedId]: createInvoiceData({ customerOrder: savedOrder }, selected.template, selected.record.templateId),
      }))
      message.success(reviewing
        ? action === 'approve' ? 'Đã duyệt hoá đơn' : 'Đã từ chối hoá đơn'
        : response?.message || 'Lưu hoá đơn thành công')
    } catch (error) {
      message.error(error?.message || 'Lưu hoá đơn thất bại')
    } finally {
      setSaving(false)
    }
  }
  const orientation = template?.page?.orientation === 'landscape' ? 'landscape' : 'portrait'
  const printInvoice = useReactToPrint({
    contentRef,
    documentTitle: `${template?.name || 'Hoa-don'}-${data.customerOrder?.code || ''}`,
    pageStyle: `
      @page { size: A4 ${orientation}; margin: 0; }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; background: #fff !important;
          -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .document-pdf-page { margin: 0 !important; border: 0 !important; box-shadow: none !important; }
        .document-pdf-page + .document-pdf-page { break-before: page; }
        [data-pdf-avoid-break], tr, img { break-inside: avoid; }
        thead { display: table-header-group; }
        [data-document-manual-input], [data-document-manual-path] {
          border: 0 !important; background: transparent !important; box-shadow: none !important; padding: 0 !important;
        }
        [data-document-manual-input]::placeholder, [data-document-manual-path]::placeholder { color: transparent !important; }
      }
    `,
  })

  const downloadInvoice = async () => {
    if (!contentRef.current || downloading || !template) return
    setDownloading(true)
    try {
      const pages = Array.from(contentRef.current.querySelectorAll('.document-pdf-page'))
      if (!pages.length) throw new Error('Hoá đơn không có trang để xuất')
      const absolute = template.layout?.mode === 'absolute'
      let pdf
      let pageIndex = 0
      await withPdfCaptureLayout(contentRef.current, async () => {
        for (const [index, page] of pages.entries()) {
          const canvas = await captureDocumentPage(page)
          const fallbackWidth = orientation === 'landscape' ? 297 : 210
          const fallbackHeight = orientation === 'landscape' ? 210 : 297
          const width = absolute && template.pages?.[index]?.width
            ? template.pages[index].width * 25.4 / 96
            : fallbackWidth
          const height = absolute && template.pages?.[index]?.height
            ? template.pages[index].height * 25.4 / 96
            : fallbackHeight
          const pageOrientation = width > height ? 'landscape' : 'portrait'
          if (!pdf) pdf = new jsPDF({ orientation: pageOrientation, unit: 'mm', format: [width, height], compress: true })
          const pageSlices = absolute
            ? [{ offset: 0, height: canvas.height }]
            : getPdfPageSlices(page, canvas.height, Math.max(1, Math.floor(canvas.width * height / width)))

          for (const pageSlice of pageSlices) {
            const pageCanvas = document.createElement('canvas')
            const pageContext = pageCanvas.getContext('2d')
            pageCanvas.width = canvas.width
            pageCanvas.height = pageSlice.height
            pageContext.fillStyle = '#ffffff'
            pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
            pageContext.drawImage(
              canvas,
              0,
              pageSlice.offset,
              canvas.width,
              pageSlice.height,
              0,
              0,
              canvas.width,
              pageSlice.height,
            )
            if (pageIndex > 0) pdf.addPage([width, height], pageOrientation)
            pdf.addImage(
              pageCanvas.toDataURL('image/jpeg', 0.95),
              'JPEG',
              0,
              0,
              width,
              absolute ? height : pageSlice.height * width / canvas.width,
              undefined,
              'FAST',
            )
            pageIndex += 1
          }
        }
      })
      const orderCode = sourceOrder?.code ? `-${sourceOrder.code}` : ''
      pdf.save(`${template.name || 'Hoa-don'}${orderCode}.pdf`)
      message.success('Đã tải hoá đơn PDF')
    } catch (error) {
      message.error(error?.message || 'Không thể tạo file PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <InvoiceDocumentToolbar>
        <Space>
          <Tag color={APPROVAL_STATUS_META[approvalStatus]?.color}>
            {loading ? 'Đang kiểm tra...' : APPROVAL_STATUS_META[approvalStatus]?.label ?? 'Không xác định trạng thái'}
          </Tag>
          {!isApprover && !loading && template ? (
            <QuotationApproverSelect
              value={approverId}
              onChange={setApproverId}
              disabled={saving || readOnly}
            />
          ) : null}
          {templates.length > 1 ? (
            <Select
              aria-label="Mẫu hoá đơn"
              value={selectedId}
              options={templates.map(item => ({ value: String(item.templateId), label: item.name }))}
              onChange={setSelectedId}
              disabled={saving}
              style={{ minWidth: 200 }}
            />
          ) : null}
        </Space>
        <ToolbarActions>
          <SheetImportButton
            template={template}
            disabled={readOnly || isLoading || saving}
            onImport={(id, table) => setDocumentData(current => setSheetTableData(current, id, table))}
          />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={readOnly || isLoading || !parsedTemplates.length || hasInvalidTemplate}
            onClick={() => submitInvoice('save')}
          >
            Lưu hoá đơn
          </Button>
          {isApprover ? (
            <>
              <Button type="primary" icon={<CheckOutlined />} loading={saving} disabled={reviewDisabled || saving} onClick={() => submitInvoice('approve')}>Duyệt</Button>
              <Button danger icon={<CloseCircleOutlined />} disabled={reviewDisabled || saving} onClick={() => submitInvoice('reject')}>Từ chối</Button>
            </>
          ) : null}
          <div role="group" aria-label="Thu phóng PDF" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef1f5', borderRadius: 8, padding: '2px 4px' }}>
            <Button type="text" aria-label="Thu nhỏ PDF" icon={<MinusOutlined />} disabled={isLoading || !template || zoom <= 50} onClick={() => changeZoom(-5)} />
            <span aria-label="Mức zoom PDF" aria-live="polite" style={{ minWidth: 44, textAlign: 'center' }}>{zoom}%</span>
            <Button type="text" aria-label="Phóng to PDF" icon={<PlusOutlined />} disabled={isLoading || !template || zoom >= 150} onClick={() => changeZoom(5)} />
          </div>
          <Tooltip title="Tải lại mẫu mới nhất">
            <Button
              aria-label="Tải lại mẫu hoá đơn"
              icon={<ReloadOutlined />}
              onClick={refresh}
              loading={loading}
            >
              {loadError ? 'Tải lại mẫu' : null}
            </Button>
          </Tooltip>
          <Tooltip title="In hoá đơn"><Button aria-label="In PDF" type="text" icon={<PrinterOutlined />} onClick={printInvoice} disabled={isLoading || !template} /></Tooltip>
          <Tooltip title="Tải xuống PDF"><Button aria-label="Tải xuống PDF" type="text" icon={<DownloadOutlined />} loading={downloading} onClick={downloadInvoice} disabled={isLoading || !template} /></Tooltip>
        </ToolbarActions>
      </InvoiceDocumentToolbar>
      {isLoading ? <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
        : loadError || templateError ? <Alert type="error" showIcon message={loadError || templateError} />
          : !template ? <Empty description="Chưa có mẫu hoá đơn đang sử dụng. Vui lòng tạo hoặc kích hoạt mẫu loại invoice trong Tạo chứng từ." />
            : (
              <div style={{ overflow: 'auto', background: '#eef1f5', padding: 16 }}>
                {/* Keep screen zoom outside the subtree cloned by react-to-print. */}
                <div data-invoice-zoom style={{ zoom: zoom / 100, width: 'max-content', margin: '0 auto' }}>
                  <div ref={contentRef}>
                    <DocumentTemplateContent
                      template={template}
                      data={documentData}
                      editable={editableDocument}
                      onTableCellChange={updateTableCell}
                      onManualFieldChange={updateManualField}
                    />
                  </div>
                </div>
              </div>
            )}
    </div>
  )
}

export default Invoice
