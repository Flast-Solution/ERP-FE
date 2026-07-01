import AIChatbot from "@/containers/AIChatbot";
import FormBuilder from "@/containers/FormBuilder";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { message } from "antd";
import { RequestUtils } from "@flast-erp/core/utils";
import useFormBuilderStore from "@/store/useFormBuilderStore";
import { parseJsxToSchema } from "@/containers/PreviewModal/parseJSXSchema";
import styled from "styled-components";

const FORM_TEMPLATE_DETAIL_API = '/workflow/forms/template/find-id'

const BuilderPageShell = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
  height: calc(100vh - 170px);
  min-width: 0;
  overflow: hidden;
  background: #f5f5f5;
`

const BuilderPane = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
`

const getTemplateCode = (template = {}) => (
  template.jsx_code
  ?? template.jsxCode
  ?? template.code
  ?? template.sourceComponent?.jsx_code
  ?? template.sourceComponent?.jsxCode
  ?? template.sourceComponent?.code
  ?? ''
)

const collectOptionsByFieldKey = (fields = [], map = new Map()) => {
  fields.forEach(field => {
    if (field?.fieldKey && Array.isArray(field?.config?.options) && field.config.options.length > 0) {
      map.set(field.fieldKey, field.config.options)
    }
    if (Array.isArray(field?.children)) {
      collectOptionsByFieldKey(field.children, map)
    }
  })
  return map
}

const mergeMissingOptions = (fields = [], optionsByKey = new Map()) => fields.map(field => {
  const children = Array.isArray(field.children)
    ? mergeMissingOptions(field.children, optionsByKey)
    : field.children
  const currentOptions = field?.config?.options
  const parsedOptions = field?.fieldKey ? optionsByKey.get(field.fieldKey) : null

  if (!parsedOptions?.length || currentOptions?.length) {
    return { ...field, children }
  }

  return {
    ...field,
    children,
    config: {
      ...(field.config ?? {}),
      options: parsedOptions,
    },
  }
})

const enrichTemplateFieldsFromCode = (template = {}) => {
  const fields = Array.isArray(template.fields) ? template.fields : []
  const code = getTemplateCode(template)
  if (!code) {
    return fields
  }

  try {
    const parsed = parseJsxToSchema(code, { name: template.name ?? '' })
    const optionsByKey = collectOptionsByFieldKey(parsed.fields ?? [])
    return mergeMissingOptions(fields, optionsByKey)
  } catch (_) {
    return fields
  }
}

const BuilderPage = () => {

  const location = useLocation()
  const params = useParams()
  const routeTemplateId = params.id ?? params['*']?.split('/')?.[0]
  const [chatbotOpen, setChatbotOpen] = useState(false)
  const [chatbotMode, setChatbotMode] = useState('default')
  const [chatbotContext, setChatbotContext] = useState(null)
  const [incomingTemplate, setIncomingTemplate] = useState(null)
  const templateId = useFormBuilderStore(s => s.templateMeta.id)
  const setTemplateMeta = useFormBuilderStore(s => s.setTemplateMeta)
  const resetBuilder = useFormBuilderStore(s => s.reset)

  const applyTemplate = (template, openPreview = false) => {
    const code = getTemplateCode(template)
    setIncomingTemplate({
      meta: {
        id: template.id,
        name: template.name ?? '',
        domain: template.domain ?? '',
        description: template.description ?? '',
        enabled: template.enabled ?? true,
      },
      fields: enrichTemplateFieldsFromCode(template),
      code,
      provenance: {
        source: 'api',
        action: 'loaded',
      },
      openPreview,
      nonce: Date.now(),
    })
  }

  const resolveTemplateFromResponse = (response, targetId) => {
    const payload = response?.data ?? response
    const detailCandidates = [
      payload?.data,
      payload?.template,
      payload?.data?.template,
      payload,
    ]

    const detail = detailCandidates.find(item => (
      item
      && !Array.isArray(item)
      && String(item?.id ?? '') === String(targetId ?? '')
    ))

    if (detail) {
      return detail
    }

    const embedded = Array.isArray(payload?.embedded)
      ? payload.embedded
      : Array.isArray(payload?.data?.embedded)
        ? payload.data.embedded
        : Array.isArray(payload)
          ? payload
          : []

    if (embedded.length > 0) {
      return embedded.find(item => String(item?.id ?? '') === String(targetId ?? '')) ?? null
    }

    if (String(payload?.id ?? '') === String(targetId ?? '')) {
      return payload
    }

    if (String(payload?.data?.id ?? '') === String(targetId ?? '')) {
      return payload.data
    }

    return null
  }

  useEffect(() => {
    if (routeTemplateId != null) {
      return
    }

    const template = location.state?.template
    if (!template) {
      resetBuilder()
      return
    }

    applyTemplate(template, false)
  }, [routeTemplateId, location.state, resetBuilder])

  useEffect(() => {
    if (routeTemplateId == null) {
      return undefined
    }

    let mounted = true
    resetBuilder()

    const fetchTemplate = async () => {
      try {
        const response = await RequestUtils.Get(FORM_TEMPLATE_DETAIL_API, { id: routeTemplateId })
        const template = resolveTemplateFromResponse(response, routeTemplateId)

        if (!template) {
          message.error('Không tải được dữ liệu form để chỉnh sửa.')
          return
        }

        if (mounted) {
          applyTemplate(template, false)
        }
      } catch (error) {
        if (mounted) {
          message.error('Không tải được dữ liệu form để chỉnh sửa.')
        }
      }
    }

    fetchTemplate()

    return () => {
      mounted = false
    }
  }, [routeTemplateId, resetBuilder])

  const openChatbot = ({ mode, context }) => {
    setChatbotMode(mode)
    setChatbotContext(context)
    setChatbotOpen(true)
  }

  const handleSave = async (payload) => {
    const endpoint = templateId
      ? '/workflow/forms/template/update'
      : '/workflow/forms/template/save'

    const response = await RequestUtils.Post(endpoint, payload)
    const nextTemplateId =
      response?.data?.id ??
      response?.data?.templateId ??
      response?.data?.meta?.id ??
      response?.data?.meta?.templateId

    if (!templateId && nextTemplateId) {
      setTemplateMeta({ id: nextTemplateId })
    }

    return response
  }

  const handleTemplateSaved = ({ fields, code, meta }) => {
    console.log('[FormBuilderPage] applying AI template', {
      fieldCount: fields?.length ?? 0,
      fields,
      code,
      meta,
    })
    setIncomingTemplate({
      fields,
      code,
      meta,
      provenance: {
        source: 'ai',
        action: 'created',
      },
      openPreview: true,
      nonce: Date.now(),
    })
  }

  return (
    <BuilderPageShell>
      <BuilderPane>
        <FormBuilder
          onOpenAI={openChatbot}
          onPreview={()=> {}}
          onSave={handleSave}
          incomingTemplate={incomingTemplate}
        />
      </BuilderPane>

      <AIChatbot
        open={chatbotOpen}
        embedded
        mode={chatbotMode}
        context={chatbotContext}
        onClose={() => setChatbotOpen(false)}
        onTemplateSaved={handleTemplateSaved}
      />
    </BuilderPageShell>
  )
}

export default BuilderPage;
