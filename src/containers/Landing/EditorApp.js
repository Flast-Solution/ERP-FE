import { useEffect } from 'react'
import { ConfigProvider, App, theme } from 'antd'
import { useEditorStore } from '@/store/editorStore'
import { EditorChrome } from './EditorChrome'
import { PreviewCanvas } from './PreviewCanvas'
import { Root, Stage, Frame, Coach, CoachSpark, Toast } from './EditorApp.style'
import { t } from '@/css/landing'
import { EditPromptBar } from './EditPromptBar'

const antdTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: t.violet500,
    colorBgBase: t.surfaceCard,
    colorTextBase: t.textPrimary,
    borderRadius: 6,
    fontFamily: t.fontSans,
  }
}

function EditorContent() {

  const selected = useEditorStore((s) => s.selected)
  const value = useEditorStore((s) => s.value)
  const busy = useEditorStore((s) => s.busy)
  const status = useEditorStore((s) => s.status)
  const files = useEditorStore((s) => s.files)
  const toast = useEditorStore((s) => s.toast)
  const device = useEditorStore((s) => s.device)
  const apiConfig = useEditorStore((s) => s.apiConfig)

  const setValue = useEditorStore((s) => s.setValue)
  const close = useEditorStore((s) => s.close)
  const submit = useEditorStore((s) => s.submit)
  const addFiles = useEditorStore((s) => s.addFiles)
  const removeFile = useEditorStore((s) => s.removeFile)
  const setConfigOpen = useEditorStore((s) => s.setConfigOpen)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setConfigOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setConfigOpen])

  return (
    <Root>
      <EditorChrome />

      <Stage onClick={(e) => { if (e.target === e.currentTarget) close() }}>
        <Frame $mobile={device === 'mobile'}>
          <PreviewCanvas />
        </Frame>
      </Stage>

      {selected ? (
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
      ) : (
        <Coach>
          Di chuột vào một khối trong bản xem trước, rồi nhấn biểu tượng{' '}
          <CoachSpark>✦</CoachSpark> để sửa bằng AI
        </Coach>
      )}

      {toast && <Toast>{toast}</Toast>}
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