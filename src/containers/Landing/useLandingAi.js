import { useCallback, useEffect, useRef, useState } from 'react'

import { ChatSession } from '@/containers/AIChatbot/chatService'
import useChatStore from '@/containers/AIChatbot/useChatStore'
import { useEditorStore } from '@/store/editorStore'
import {
  buildLandingAiContext,
  parseLandingAiResponse,
} from './landingAi'

const FORM_BUILDER_CHAT_MODE = 'form_builder'

export const useLandingAi = () => {
  const sessionRef = useRef(null)
  const responseBufferRef = useRef('')
  const requestRef = useRef(null)
  const [connected, setConnected] = useState(false)

  const startAiEdit = useEditorStore(state => state.startAiEdit)
  const applyAiPatch = useEditorStore(state => state.applyAiPatch)
  const failAiEdit = useEditorStore(state => state.failAiEdit)

  useEffect(() => {
    const finishRequest = () => {
      responseBufferRef.current = ''
      requestRef.current = null
    }

    const sessionId = useChatStore.getState().getSessionId(FORM_BUILDER_CHAT_MODE)
    const session = new ChatSession(sessionId)
    sessionRef.current = session

    session.connect({
      onOpen: () => setConnected(true),
      onChunk: chunk => {
        if (requestRef.current?.phase !== 'answer') return
        responseBufferRef.current += chunk
      },
      onDone: () => {
        const request = requestRef.current
        const responseText = responseBufferRef.current.trim()
        if (!request || request.phase !== 'answer' || !responseText) return

        if (process.env.NODE_ENV !== 'production') {
          console.log('[LandingAI][SSE] final response:', responseText)
        }

        try {
          const result = parseLandingAiResponse(responseText)
          applyAiPatch(result.operations, result.summary)
        } catch (error) {
          failAiEdit(error.message)
        } finally {
          finishRequest()
        }
      },
      onError: error => {
        setConnected(false)
        if (requestRef.current) {
          failAiEdit(error?.message || 'Mất kết nối với AI.')
          finishRequest()
        }
      },
      onClose: () => setConnected(false),
    }).catch(error => failAiEdit(error?.message || 'Không kết nối được AI.'))

    return () => {
      session.destroy()
      sessionRef.current = null
    }
  }, [applyAiPatch, failAiEdit])

  const submit = useCallback(async (prompt, elementId, attachments = []) => {
    const state = useEditorStore.getState()
    if (!sessionRef.current?.isConnected) {
      failAiEdit('AI chưa kết nối. Vui lòng thử lại sau vài giây.')
      return
    }

    responseBufferRef.current = ''
    requestRef.current = { elementId, phase: 'context' }
    startAiEdit()

    try {
      await sessionRef.current.sendContext(buildLandingAiContext({
        schema: state.draftSchema,
        selectedElementId: elementId,
        attachments,
      }))
      responseBufferRef.current = ''
      requestRef.current = { elementId, phase: 'answer' }
      await sessionRef.current.send(prompt)
    } catch (error) {
      requestRef.current = null
      responseBufferRef.current = ''
      failAiEdit(error?.message || 'Không gửi được yêu cầu tới AI.')
    }
  }, [failAiEdit, startAiEdit])

  return {
    connected,
    submit,
  }
}
