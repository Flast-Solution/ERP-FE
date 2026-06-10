import AIChatbot from "@/containers/AIChatbot";
import FormBuilder from "@/containers/FormBuilder";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { RequestUtils } from "@flast-erp/core/utils";
import useFormBuilderStore from "@/store/useFormBuilderStore";

const BuilderPage = () => {

  const location = useLocation()
  const [chatbotOpen, setChatbotOpen] = useState(false)
  const [chatbotMode, setChatbotMode] = useState('default')
  const [chatbotContext, setChatbotContext] = useState(null)
  const [incomingTemplate, setIncomingTemplate] = useState(null)
  const templateId = useFormBuilderStore(s => s.templateMeta.id)
  const setTemplateMeta = useFormBuilderStore(s => s.setTemplateMeta)

  useEffect(() => {
    const template = location.state?.template
    if (!template) {
      return
    }

    setIncomingTemplate({
      meta: {
        id: template.id,
        name: template.name ?? '',
        domain: template.domain ?? '',
        description: template.description ?? '',
        enabled: template.enabled ?? true,
      },
      fields: Array.isArray(template.fields) ? template.fields : [],
      code: template.jsx_code
        ?? template.jsxCode
        ?? template.code
        ?? template.sourceComponent?.jsx_code
        ?? template.sourceComponent?.jsxCode
        ?? '',
      nonce: Date.now(),
    })
  }, [location.state])

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
      nonce: Date.now(),
    })
  }

  return (
    <div>
      <FormBuilder
        onOpenAI={openChatbot}
        onPreview={()=> {}}
        onSave={handleSave}
        incomingTemplate={incomingTemplate}
      />

      <AIChatbot
        open={chatbotOpen}
        mode={chatbotMode}
        context={chatbotContext}
        onClose={() => setChatbotOpen(false)}
        onTemplateSaved={handleTemplateSaved}
      />
    </div>
  )
}

export default BuilderPage;
