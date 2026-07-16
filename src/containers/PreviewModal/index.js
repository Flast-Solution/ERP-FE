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

import { useEffect, useMemo, useState } from 'react'
import { Button } from 'antd'
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

  useEffect(() => {
    setActiveTab(mode)
  }, [mode])

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
              <FormUITab schema={effectiveSchema} viewport={viewport} />
            </FormUIPane>
          ) : (
            <JSXCodeTab
              schema={effectiveSchema}
              sessionId={formBuilderSessionId}
              jsxCode={jsxCode}
              setJsxCode={setJsxCode}
              isEditable={isEditable}
              setIsEditable={setIsEditable}
              isDirty={isDirty}
              setIsDirty={setIsDirty}
              generatedCode={generatedCode}
              fieldKeys={fieldKeys}
              syncError={syncError}
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
