import AIChatbot from "@/containers/AIChatbot";
import FormBuilder from "@/containers/FormBuilder";
import { useState } from "react";
import RequestUtils from "@flast-erp/core/utils/RequestUtils";
import useFormBuilderStore from "@/store/useFormBuilderStore";

const BuilderPage = () => {

  const [chatbotOpen, setChatbotOpen] = useState(false)
  const [chatbotMode, setChatbotMode] = useState('default')
  const [chatbotContext, setChatbotContext] = useState(null)
  const [incomingTemplate, setIncomingTemplate] = useState(null)
  const templateId = useFormBuilderStore(s => s.templateMeta.id)
  const setTemplateMeta = useFormBuilderStore(s => s.setTemplateMeta)

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
