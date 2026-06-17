import AIChatbot from "@/containers/AIChatbot";
import FormBuilder from "@/containers/FormBuilder";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { RequestUtils } from "@flast-erp/core/utils";
import useFormBuilderStore from "@/store/useFormBuilderStore";
import styled from "styled-components";

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
