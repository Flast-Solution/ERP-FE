import React, { useEffect, useMemo, useState } from 'react'
import { Alert, message, Spin } from 'antd'
import { Helmet } from 'react-helmet'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DocumentTemplateEditor, {
  buildDraftStorageKey,
  readTemplateDraft,
  writeTemplateDraft,
} from '@/components/DocumentTemplateEditor'
import OrderService from '@/services/OrderService'
import {
  createQuotationTemplate,
  mapOrderToDocumentData,
  ORDER_DOCUMENT_SCHEMA,
  resolveOrderDocumentSource,
} from './orderDocumentAdapter'

const DocumentTemplateEditorPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { entityType = 'ORDER', entityId } = useParams()
  const [searchParams] = useSearchParams()
  const documentType = searchParams.get('documentType') ?? 'DOCUMENT'
  const navigationEntity = location.state?.entityData ?? null
  const [loading, setLoading] = useState(true)
  const [documentData, setDocumentData] = useState(null)
  const [loadError, setLoadError] = useState('')

  const storageKey = useMemo(() => buildDraftStorageKey({ documentType, entityType, entityId }), [documentType, entityId, entityType])
  const initialTemplate = useMemo(
    () => readTemplateDraft(storageKey) ?? (documentType === 'QUOTATION' ? createQuotationTemplate() : null),
    [documentType, storageKey],
  )

  useEffect(() => {
    let mounted = true

    const loadEntity = async () => {
      setLoading(true)
      setLoadError('')
      try {
        if (String(entityType).toUpperCase() !== 'ORDER') {
          throw new Error(`Chưa cấu hình bộ dữ liệu cho ${entityType}.`)
        }

        const response = await OrderService.getOrderOnEdit(entityId)
        if (!mounted) return
        const source = resolveOrderDocumentSource(response, navigationEntity)
        setDocumentData(mapOrderToDocumentData(source))
      } catch (error) {
        if (!mounted) return
        if (navigationEntity) {
          setDocumentData(mapOrderToDocumentData(resolveOrderDocumentSource(null, navigationEntity)))
          message.warning('Đang dùng dữ liệu từ danh sách vì chưa tải được chi tiết đơn hàng.')
        } else {
          setLoadError(error?.message || 'Không tải được dữ liệu chứng từ.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadEntity()
    return () => { mounted = false }
  }, [entityId, entityType, navigationEntity])

  const handleSave = (template) => {
    writeTemplateDraft(storageKey, {
      ...template,
      context: { documentType, entityType, entityId },
    })
    message.success('Đã lưu bản nháp template trên trình duyệt.')
  }

  if (loading) {
    return <div style={{ minHeight: 480, display: 'grid', placeItems: 'center' }}><Spin tip="Đang tải dữ liệu chứng từ" /></div>
  }

  if (loadError) {
    return <Alert type="error" showIcon message="Không thể mở trình thiết kế" description={loadError} />
  }

  return (
    <>
      <Helmet><title>Thiết kế báo giá</title></Helmet>
      <DocumentTemplateEditor
        documentType={documentType}
        initialTemplate={initialTemplate}
        dataSchema={ORDER_DOCUMENT_SCHEMA}
        sampleData={documentData}
        onSave={handleSave}
        onCancel={() => navigate(-1)}
      />
    </>
  )
}

export default DocumentTemplateEditorPage
