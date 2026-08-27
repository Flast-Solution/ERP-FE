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
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { RequestUtils } from '@flast-erp/core/utils'
import DocumentTemplateService from '@/services/DocumentTemplateService'
import { SUCCESS_CODE } from '@/configs'
import DocumentTemplateContent from '@/components/DocumentTemplateEditor/DocumentTemplateContent'
import { getValueByPath } from '../../components/DocumentTemplateEditor/utils'
import { hasManualDocumentFields, setDocumentValueByPath } from '../../components/GeneratedDocumentViewer/manualEditing'
import { DocumentToolbar, ToolbarActions } from '../../components/GeneratedDocumentViewer/styles'
import useGetMe from '../../hooks/useGetMe'
import QuotationApproverSelect from './List/components/QuotationApproverSelect'
import { QUOTATION_APPROVAL_STATUS } from './List/constants'
import { mergeSavedQuotationOrder } from './List/utils/quotationMappers'
import {
  buildInvoicePayload,
  createInvoiceData,
  createInvoiceOrder,
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
  const [templates, setTemplates] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  const [zoom, setZoom] = useState(85)
  const [sourceOrder, setSourceOrder] = useState(() => createInvoiceOrder(data))
  const [documentData, setDocumentData] = useState({})
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

  const { template, templateError } = useMemo(() => {
    const record = templates.find(item => String(item.templateId) === selectedId)
    if (!record) return {}
    try {
      return { template: parseInvoiceTemplate(record) }
    } catch {
      return { templateError: 'Mẫu hoá đơn không hợp lệ. Vui lòng kiểm tra lại trong Tạo chứng từ.' }
    }
  }, [templates, selectedId])
  useEffect(() => {
    const nextOrder = createInvoiceOrder(data)
    setSourceOrder(nextOrder)
    setDocumentData(createInvoiceData({ customerOrder: nextOrder }, template))
  }, [data, template])

  const editableDocument = Boolean(template && !loading && !saving && !readOnly
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
    if (saving || !sourceOrder?.id || !template) return
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
      const dataToSave = readOnly
        ? createInvoiceData({ customerOrder: sourceOrder }, template)
        : documentData
      const payload = buildInvoicePayload(dataToSave, template, sourceOrder, selectedApprover, nextStatus)
      const response = await RequestUtils.Post('/order/save', payload)
      if (Number(response?.errorCode) !== SUCCESS_CODE) {
        throw new Error(response?.message || 'Lưu hoá đơn thất bại')
      }
      const savedOrder = mergeSavedQuotationOrder(sourceOrder, payload, response?.data)
      const savedApproval = payload.aproval
        ? { ...approval, ...payload.aproval, ...response?.data?.aproval }
        : null
      setSourceOrder(savedOrder)
      setApproval(savedApproval)
      setApproverId(savedApproval?.userApproval == null ? undefined : Number(savedApproval.userApproval))
      setDocumentData(createInvoiceData({ customerOrder: savedOrder }, template))
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
      if (document.fonts?.ready) await document.fonts.ready
      const pages = Array.from(contentRef.current.querySelectorAll('.document-pdf-page'))
      if (!pages.length) throw new Error('Hoá đơn không có trang để xuất')
      const absolute = template.layout?.mode === 'absolute'
      let pdf
      for (const [index, page] of pages.entries()) {
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
        })
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
        else pdf.addPage([width, height], pageOrientation)
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, width, height, undefined, 'FAST')
      }
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
          {!readOnly && template ? (
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => submitInvoice('save')}>
              Lưu hoá đơn
            </Button>
          ) : null}
          {isApprover ? (
            <>
              <Button type="primary" icon={<CheckOutlined />} loading={saving} disabled={reviewDisabled || saving} onClick={() => submitInvoice('approve')}>Duyệt</Button>
              <Button danger icon={<CloseCircleOutlined />} disabled={reviewDisabled || saving} onClick={() => submitInvoice('reject')}>Từ chối</Button>
            </>
          ) : null}
          <div role="group" aria-label="Thu phóng PDF" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef1f5', borderRadius: 8, padding: '2px 4px' }}>
            <Button type="text" aria-label="Thu nhỏ PDF" icon={<MinusOutlined />} disabled={loading || !template || zoom <= 50} onClick={() => changeZoom(-5)} />
            <span aria-label="Mức zoom PDF" aria-live="polite" style={{ minWidth: 44, textAlign: 'center' }}>{zoom}%</span>
            <Button type="text" aria-label="Phóng to PDF" icon={<PlusOutlined />} disabled={loading || !template || zoom >= 150} onClick={() => changeZoom(5)} />
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
          <Tooltip title="In hoá đơn"><Button aria-label="In PDF" type="text" icon={<PrinterOutlined />} onClick={printInvoice} disabled={loading || !template} /></Tooltip>
          <Tooltip title="Tải xuống PDF"><Button aria-label="Tải xuống PDF" type="text" icon={<DownloadOutlined />} loading={downloading} onClick={downloadInvoice} disabled={loading || !template} /></Tooltip>
        </ToolbarActions>
      </InvoiceDocumentToolbar>
      {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
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
