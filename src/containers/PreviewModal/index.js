/**
 * Preview modal orchestration.
 *
 * Domain responsibilities live in:
 * - FormUITab / FieldPreview / FormFileUpload: dynamic form preview and upload
 * - JSXCodeTab: code editor, build event and preview build
 * - usePreviewCode: generated-code synchronization and reverse JSX parsing
 * - useSaveForm: build-before-save workflow
 * - buildService: build request and JSX normalization
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Spin } from 'antd'
import {
  CloseOutlined,
  DesktopOutlined,
  FileTextOutlined,
  HistoryOutlined,
  MobileOutlined,
  PlayCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons'

import useChatStore from '@/containers/AIChatbot/useChatStore'
import FormUITab from './FormUITab'
import RemoteFormPreview from './RemoteFormPreview'
import JSXCodeTab from './JSXCodeTab'
import usePreviewCode from './usePreviewCode'
import useSaveForm from './useSaveForm'
import {
  FooterLeft,
  FooterRight,
  FormUIPane,
  HeaderText,
  ModalFooter,
  ModalHeader,
  ModalSubtitle,
  ModalTitle,
  ModalWrapper,
  PaneWrapper,
  Scrim,
  Tab,
  TabBar,
  TabBarRight,
  ViewportBtn,
  ViewportControl,
} from './index.style'

const PreviewModal = ({
  open,
  mode = 'ui',
  schema,
  initialJsxCode = '',
  onJsxCodeChange,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState(mode)
  const [viewport, setViewport] = useState('desktop')
  const [realPreview, setRealPreview] = useState({
    status: 'idle',
    url: '',
    message: '',
    version: '',
  })
  const getSessionId = useChatStore(state => state.getSessionId)
  const formBuilderSessionId = useMemo(() => getSessionId('form_builder'), [getSessionId])
  const {
    effectiveSchema,
    fieldKeys,
    generatedCode,
    isDirty,
    isEditable,
    jsxCode,
    liveSchema,
    setIsDirty,
    setIsEditable,
    setJsxCode,
    syncError,
  } = usePreviewCode({
    open,
    schema,
    initialJsxCode,
    onJsxCodeChange,
  })
  const { saveAfterBuild, savingAfterBuild } = useSaveForm({
    schema,
    liveSchema,
    syncError,
    sessionId: formBuilderSessionId,
    jsxCode,
    isDirty,
    onSave,
  })
  const handleJsxCodeChange = useCallback((nextCode) => {
    setJsxCode(nextCode)
    setRealPreview({ status: 'idle', url: '', message: '', version: '' })
  }, [setJsxCode])
  const handleBuildStateChange = useCallback((nextState) => {
    setRealPreview(current => ({
      ...current,
      ...nextState,
      url: nextState.url === undefined ? current.url : nextState.url,
      version: nextState.status === 'done'
        ? String(Date.now())
        : current.version,
    }))
    if (nextState.status === 'done' && nextState.url) {
      setActiveTab('ui')
    }
  }, [])

  useEffect(() => {
    setActiveTab(mode)
  }, [mode])

  useEffect(() => {
    if (!open) return
    const existingUrl = schema?.meta?.microFrontendUrl
      ?? ''
    setRealPreview({
      status: existingUrl ? 'done' : 'idle',
      url: existingUrl,
      message: existingUrl ? 'Đang dùng bản build đã lưu.' : '',
      version: '',
    })
  }, [open, schema?.meta?.microFrontendUrl])

  if (!open) return null

  const { meta = {}, fields = [] } = effectiveSchema ?? {}
  const name = meta.name ?? 'Form'
  const total = fields.length
  const required = fields.filter(field => field.isRequired).length

  return (
    <Scrim onClick={event => event.target === event.currentTarget && onClose?.()}>
      <ModalWrapper onClick={event => event.stopPropagation()}>
        <ModalHeader>
          <HeaderText>
            <ModalTitle>Preview · {name}</ModalTitle>
            <ModalSubtitle>
              Xem hình ảnh form khi KTV điền, hoặc lấy JSX để nhúng vào app.
            </ModalSubtitle>
          </HeaderText>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{ color: '#71717a', flexShrink: 0 }}
          />
        </ModalHeader>

        <TabBar>
          <Tab $active={activeTab === 'ui'} onClick={() => setActiveTab('ui')}>
            <PlayCircleOutlined />
            Form thực
          </Tab>
          <Tab $active={activeTab === 'code'} onClick={() => setActiveTab('code')}>
            <FileTextOutlined />
            JSX code
          </Tab>

          {activeTab === 'ui' && (
            <ViewportControl style={{ marginLeft: 12 }}>
              <ViewportBtn $active={viewport === 'desktop'} onClick={() => setViewport('desktop')}>
                <DesktopOutlined />
                Desktop
              </ViewportBtn>
              <ViewportBtn $active={viewport === 'mobile'} onClick={() => setViewport('mobile')}>
                <MobileOutlined />
                Mobile
              </ViewportBtn>
            </ViewportControl>
          )}

          <TabBarRight>
            {total} field · {required} bắt buộc
          </TabBarRight>
        </TabBar>

        <PaneWrapper>
          {activeTab === 'ui' ? (
            <FormUIPane>
              {realPreview.url ? (
                <RemoteFormPreview
                  remoteEntry={realPreview.url}
                  previewVersion={realPreview.version}
                  viewport={viewport}
                />
              ) : realPreview.status === 'building' ? (
                <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin tip={realPreview.message || 'Đang build form thực...'} />
                </div>
              ) : (
                <>
                  {realPreview.status === 'error' && (
                    <Alert
                      type="warning"
                      showIcon
                      message="Chưa thể hiển thị form thực"
                      description={realPreview.message}
                      style={{ width: '100%', maxWidth: viewport === 'mobile' ? 360 : 720 }}
                    />
                  )}
                  {isDirty && (
                    <div
                      style={{
                        width: '100%',
                        maxWidth: viewport === 'mobile' ? 360 : 720,
                        padding: '10px 14px',
                        border: '1px solid #fde68a',
                        borderRadius: 8,
                        background: '#fffbeb',
                        color: '#92400e',
                        fontSize: 12,
                      }}
                    >
                      JSX có CSS/layout tùy chỉnh. Hãy mở tab JSX code và bấm Build preview để Form thực hiển thị đúng giao diện.
                    </div>
                  )}
                  <FormUITab schema={effectiveSchema} viewport={viewport} />
                </>
              )}
            </FormUIPane>
          ) : (
            <JSXCodeTab
              schema={effectiveSchema}
              sessionId={formBuilderSessionId}
              jsxCode={jsxCode}
              setJsxCode={handleJsxCodeChange}
              isEditable={isEditable}
              setIsEditable={setIsEditable}
              isDirty={isDirty}
              setIsDirty={setIsDirty}
              generatedCode={generatedCode}
              fieldKeys={fieldKeys}
              syncError={syncError}
              onBuildStateChange={handleBuildStateChange}
            />
          )}
        </PaneWrapper>

        <ModalFooter>
          <FooterLeft>
            <HistoryOutlined />
            {meta.id
              ? `template_id=${meta.id} · ${meta.domain ?? ''}`
              : 'Chưa lưu'}
          </FooterLeft>
          <FooterRight>
            <Button onClick={onClose}>Đóng</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={savingAfterBuild}
              disabled={savingAfterBuild}
              onClick={saveAfterBuild}
            >
              {savingAfterBuild ? 'Đang build...' : 'Lưu form'}
            </Button>
          </FooterRight>
        </ModalFooter>
      </ModalWrapper>
    </Scrim>
  )
}

export default PreviewModal
