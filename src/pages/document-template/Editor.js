import React, { useEffect, useState } from 'react'
import { Alert, message, Spin } from 'antd'
import { Helmet } from 'react-helmet'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DocumentTemplateEditor, { createEmptyTemplate } from '@/components/DocumentTemplateEditor'
import { SUCCESS_CODE } from '@/configs'
import DocumentTemplateService, {
  buildDocumentSchemaFromEntityFields,
  normalizeDocumentSchema,
} from '@/services/DocumentTemplateService'

const DocumentTemplateEditorPage = () => {
  const navigate = useNavigate()
  const { templateId } = useParams()
  const [searchParams] = useSearchParams()
  const sourceTemplateId = searchParams.get('sourceTemplateId')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [record, setRecord] = useState(null)
  const [sourceTemplate, setSourceTemplate] = useState(null)
  const [schema, setSchema] = useState(null)
  const [dataSchema, setDataSchema] = useState([])
  const [previewData, setPreviewData] = useState({})
  const [initialTemplate, setInitialTemplate] = useState(null)

  useEffect(() => {
    let mounted = true

    const loadEditor = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const requestedTemplateId = templateId || sourceTemplateId
        if (!requestedTemplateId) {
          throw new Error('Chưa chọn hạng mục chứng từ')
        }

        const [templateResponse, entityResponse] = await Promise.all([
          DocumentTemplateService.fetchTemplates(),
          DocumentTemplateService.fetchAllEntities(),
        ])
        if (Number(templateResponse?.errorCode) !== SUCCESS_CODE || !Array.isArray(templateResponse?.data)) {
          throw new Error(templateResponse?.message || 'Không tải được danh sách template')
        }
        if (!Array.isArray(entityResponse)) {
          throw new Error('Không tải được danh sách nguồn dữ liệu')
        }
        const templateSource = templateResponse.data.find(item => String(item.templateId) === String(requestedTemplateId))
        if (!templateSource) throw new Error('Không tìm thấy template đã chọn')
        if (!mounted) return

        const schemaData = {
          ...buildDocumentSchemaFromEntityFields(
            entityResponse,
            { code: templateSource.code, name: templateSource.name },
          ),
          schemaVersion: templateSource.version,
        }
        let storedTemplate = null
        if (templateSource.data && typeof templateSource.data === 'object' && Array.isArray(templateSource.data.nodes)) {
          storedTemplate = templateSource.data
        } else if (typeof templateSource.data === 'string') {
          try {
            const parsedData = JSON.parse(templateSource.data)
            storedTemplate = parsedData && typeof parsedData === 'object' && Array.isArray(parsedData.nodes)
              ? parsedData
              : null
          } catch (error) {
            storedTemplate = null
          }
        }

        setRecord(templateId ? templateSource : null)
        setSourceTemplate(templateSource)
        setSchema(schemaData)
        setDataSchema(normalizeDocumentSchema(schemaData))
        setPreviewData({})
        const resolvedDocumentType = ['QUOTATION', 'GOODS_ISSUE'].includes(templateSource.documentType)
          ? templateSource.documentType
          : 'QUOTATION'
        const normalizedStoredTemplate = storedTemplate
          ? {
            ...storedTemplate,
            documentType: resolvedDocumentType,
          }
          : null
        setInitialTemplate(
          normalizedStoredTemplate
          || createEmptyTemplate({
            name: templateSource.name,
            documentType: resolvedDocumentType,
          })
        )
      } catch (error) {
        if (mounted) setLoadError(error?.message || 'Không thể mở trình thiết kế chứng từ')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadEditor()
    return () => { mounted = false }
  }, [sourceTemplateId, templateId])

  const handleSave = async (template) => {
    const { documentType, ...templateData } = template
    const payload = {
      templateId: record?.templateId ?? null,
      sourceTemplateId: record ? null : sourceTemplate?.templateId,
      code: record?.code ?? null,
      name: template.name,
      version: record?.version || schema?.schemaVersion,
      fields: Array.isArray(sourceTemplate?.fields) ? sourceTemplate.fields : [],
      status: record?.status ?? 1,
      bizId: sourceTemplate?.bizId ?? null,
      documentType: documentType || 'QUOTATION',
      data: JSON.stringify(templateData),
    }
    console.log('[DocumentTemplateEditor] Lưu chứng từ payload:', payload)
    setSaving(true)
    try {
      const response = await DocumentTemplateService.saveTemplate(payload)
      if (Number(response?.errorCode) !== SUCCESS_CODE) {
        throw new Error(response?.message || 'Lưu chứng từ thất bại')
      }
      message.success(response?.message || 'Lưu chứng từ thành công')
      const savedId = response?.data?.templateId || record?.templateId
      if (!record?.templateId && savedId) {
        navigate(`/system/document-templates/${savedId}/edit`, { replace: true })
      }
    } catch (error) {
      message.error(error?.message || 'Lưu chứng từ thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ minHeight: 480, display: 'grid', placeItems: 'center' }}><Spin tip="Đang tải cấu hình chứng từ" /></div>
  }
  if (loadError) {
    return <Alert type="error" showIcon message="Không thể mở trình thiết kế" description={loadError} />
  }

  return (
    <>
      <Helmet><title>{record?.name || initialTemplate?.name || 'Tạo chứng từ'}</title></Helmet>
      <DocumentTemplateEditor
        key={record?.templateId || sourceTemplate?.templateId}
        documentType={schema?.category?.code}
        initialTemplate={initialTemplate}
        dataSchema={dataSchema}
        sampleData={previewData}
        saving={saving}
        onSave={handleSave}
        onCancel={() => navigate('/system/document-templates')}
      />
    </>
  )
}

export default DocumentTemplateEditorPage
