import AIChatbot from "@/containers/AIChatbot";
import FormBuilder from "@/containers/FormBuilder";
import { useState } from "react";

const BuilderPage = () => {

  const [chatbotOpen, setChatbotOpen] = useState(false)
  const [chatbotMode, setChatbotMode] = useState('default')
  const [chatbotContext, setChatbotContext] = useState(null)

  const openChatbot = ({ mode, context }) => {
    setChatbotMode(mode)
    setChatbotContext(context)
    setChatbotOpen(true)
  }

  return (
    <div>
      <FormBuilder
        onOpenAI={openChatbot}
        onPreview={()=> {}}
      />

      <AIChatbot
        open={chatbotOpen}
        mode={chatbotMode}
        context={chatbotContext}
        onClose={() => setChatbotOpen(false)}
      />
    </div>
  )
}

export default BuilderPage;