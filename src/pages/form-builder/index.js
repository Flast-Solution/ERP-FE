import { useState } from "react";
import AIChatbot from "@/containers/AIChatbot";
import FormBuilder from "@/containers/FormBuilder";

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
        onContextUpdate={(context) => {
          setChatbotContext(context)
        }}
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