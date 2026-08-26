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
import { Alert, Button, Empty, Select, Space, Spin } from 'antd'
import { MinusOutlined, PlusOutlined, PrinterOutlined, ReloadOutlined } from '@ant-design/icons'
import { useReactToPrint } from 'react-to-print'
import DocumentTemplateService from '@/services/DocumentTemplateService'
import { SUCCESS_CODE } from '@/configs'
import DocumentTemplateContent from '@/components/DocumentTemplateEditor/DocumentTemplateContent'
import { createInvoiceData, getInvoiceTemplates, parseInvoiceTemplate } from './invoiceTemplateUtils'

const Invoice = ({ data }) => {
  const contentRef = useRef(null)
  const [templates, setTemplates] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  const [zoom, setZoom] = useState(85)
  const refresh = useCallback(() => setReload(value => value + 1), [])

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
        const response = await DocumentTemplateService.fetchTemplates()
        if (Number(response?.errorCode) !== SUCCESS_CODE || !Array.isArray(response?.data)) {
          throw new Error(response?.message || 'Không tải được mẫu hoá đơn')
        }
        if (!active) return
        const invoices = getInvoiceTemplates(response.data)
        setTemplates(invoices)
        setSelectedId(invoices.length ? String(invoices[0].templateId) : '')
      } catch (error) {
        if (active) setLoadError(error?.message || 'Không tải được mẫu hoá đơn')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [reload])

  const { template, templateError } = useMemo(() => {
    const record = templates.find(item => String(item.templateId) === selectedId)
    if (!record) return {}
    try {
      return { template: parseInvoiceTemplate(record) }
    } catch {
      return { templateError: 'Mẫu hoá đơn không hợp lệ. Vui lòng kiểm tra lại trong Tạo chứng từ.' }
    }
  }, [templates, selectedId])
  const documentData = useMemo(() => createInvoiceData(data, template), [data, template])
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
      }
    `,
  })

  return (
    <div>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        {templates.length > 1 ? (
          <Select
            aria-label="Mẫu hoá đơn"
            value={selectedId}
            options={templates.map(item => ({ value: String(item.templateId), label: item.name }))}
            onChange={setSelectedId}
            style={{ minWidth: 240 }}
          />
        ) : <strong>{template?.name || 'Mẫu hoá đơn'}</strong>}
        <Space wrap>
          <div role="group" aria-label="Thu phóng PDF" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef1f5', borderRadius: 8, padding: '2px 4px' }}>
            <Button type="text" aria-label="Thu nhỏ PDF" icon={<MinusOutlined />} disabled={loading || !template || zoom <= 50} onClick={() => changeZoom(-5)} />
            <span aria-label="Mức zoom PDF" aria-live="polite" style={{ minWidth: 44, textAlign: 'center' }}>{zoom}%</span>
            <Button type="text" aria-label="Phóng to PDF" icon={<PlusOutlined />} disabled={loading || !template || zoom >= 150} onClick={() => changeZoom(5)} />
          </div>
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>Tải lại mẫu</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={printInvoice} disabled={loading || !template}>In PDF</Button>
        </Space>
      </Space>
      {loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
        : loadError || templateError ? <Alert type="error" showIcon message={loadError || templateError} />
          : !template ? <Empty description="Chưa có mẫu hoá đơn đang sử dụng. Vui lòng tạo hoặc kích hoạt mẫu loại invoice trong Tạo chứng từ." />
            : (
              <div style={{ overflow: 'auto', background: '#eef1f5', padding: 16 }}>
                {/* Keep screen zoom outside the subtree cloned by react-to-print. */}
                <div data-invoice-zoom style={{ zoom: zoom / 100, width: 'max-content', margin: '0 auto' }}>
                  <div ref={contentRef}>
                    <DocumentTemplateContent template={template} data={documentData} />
                  </div>
                </div>
              </div>
            )}
    </div>
  )
}

export default Invoice
