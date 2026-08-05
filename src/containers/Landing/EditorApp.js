import { useEffect } from 'react'
import { ConfigProvider, App, theme } from 'antd'
import { useLocation } from 'react-router-dom'
import { useEditorStore } from '@/store/editorStore'
import { EditorChrome } from './EditorChrome'
import { PreviewCanvas } from './PreviewCanvas'
import { ApiConfigModal } from './ApiConfigModal'
import { Root, Workspace, Stage, Frame, Coach, CoachSpark, Toast } from './EditorApp.style'
import { t } from '@/css/landing'
import { EditPromptBar } from './EditPromptBar'
import { useLandingAi } from './useLandingAi'
import { BlockInspector, BlockNavigator } from './EditorPanels'
import { HtmlSourceView } from './HtmlSourceView'

const antdTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary:  t.violet500,
    colorBgBase:   t.surfaceCard,
    colorTextBase: t.textPrimary,
    borderRadius:  6,
    fontFamily:    t.fontSans,
  }
}

function EditorContent() {
  const { submit } = useLandingAi()
  const { search } = useLocation()
  
  const selected = useEditorStore((s) => s.selected)
  const value = useEditorStore((s) => s.value)
  const busy = useEditorStore((s) => s.busy)
  const status = useEditorStore((s) => s.status)
  const files = useEditorStore((s) => s.files)
  const toast = useEditorStore((s) => s.toast)
  const device = useEditorStore((s) => s.device)
  const viewMode = useEditorStore((s) => s.viewMode)
  const draftSchema = useEditorStore((s) => s.draftSchema)
  const apiConfig = useEditorStore((s) => s.apiConfig)

  const setValue = useEditorStore((s) => s.setValue)
  const close = useEditorStore((s) => s.close)
  const addFiles = useEditorStore((s) => s.addFiles)
  const removeFile = useEditorStore((s) => s.removeFile)
  const setConfigOpen = useEditorStore((s) => s.setConfigOpen)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const initializePage = useEditorStore((s) => s.initializePage)

  useEffect(() => {
    const params = new URLSearchParams(search)
    initializePage({
      id: params.get('id') || 'landing-home',
      mode: params.get('mode') || 'edit',
    })
  }, [initializePage, search])

  useEffect(() => {
    const onKey = (e) => {
      if (viewMode === 'edit' && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setConfigOpen(true)
        return
      }
      if (viewMode === 'edit' && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [redo, setConfigOpen, undo, viewMode])

  return (
    <Root>
      <EditorChrome />

      <Workspace>
        {viewMode === 'edit' && <BlockNavigator />}
        <Stage onClick={(e) => { if (e.target === e.currentTarget) close() }}>
          <Frame
            $mobile={device === 'mobile'}
            data-landing-frame="true"
            style={{ display: viewMode !== 'html' ? 'block' : 'none' }}
          >
            <PreviewCanvas />
          </Frame>
          <HtmlSourceView schema={draftSchema} active={viewMode === 'html'} />
        </Stage>
        {viewMode === 'edit' && <BlockInspector />}
      </Workspace>

      {viewMode === 'edit' && selected ? (
        <EditPromptBar
          docked
          elementId={selected}
          value={value}
          onChange={setValue}
          busy={busy}
          status={status}
          onSubmit={submit}
          onClearContext={close}
          attachments={files}
          onAttachFiles={addFiles}
          onRemoveAttachment={removeFile}
          apis={apiConfig[selected] || []}
        />
      ) : viewMode === 'edit' ? (
        <Coach>
          Chọn block để sửa thủ công hoặc nhấn{' '}
          <CoachSpark>✦</CoachSpark> để sửa bằng AI
        </Coach>
      ) : null}

      {toast && <Toast>{toast}</Toast>}

      <ApiConfigModal />
    </Root>
  )
}

export function EditorApp() {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>
        <EditorContent />
      </App>
    </ConfigProvider>
  )
}
