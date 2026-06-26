/**
 * FormBuilder/index.js
 *
 * Props:
 *   templateId  {number|null}  — edit mode nếu có, null = create
 *   domain      {string}       — domain mặc định
 *   onSave      {function}     — nhận payload { meta, fields[] }
 *   onCancel    {function}
 *   onPreview   {function}     — (mode: "ui"|"code") => void — App level mở PreviewModal
 *   onOpenAI       {function}  — ({ mode, context }) => void — App level mở AIChatbot
 *   onContextUpdate {function} — (context) => void — silent update context, không mở panel
 *   incomingTemplate {object}  — template AI trả về { fields, code, meta, nonce }
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Button, message, Popconfirm, Dropdown } from 'antd'
import {
  CloseOutlined,
  EditOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  CaretDownOutlined,
} from '@ant-design/icons'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import PreviewModal from '@/containers/PreviewModal'

import useFormBuilderStore from '@/store/useFormBuilderStore'
import { FIELD_TYPE_MAP }  from '@/utils/fieldTypes'
import { buildJSX } from '@/containers/PreviewModal/buildJSX'
import FieldTypeList       from './FieldTypeList'
import FieldCanvas, { CANVAS_DROPPABLE_ID } from './FieldCanvas'
import FieldConfigPanel    from './FieldConfigPanel'
import {
  BuilderLayout,
  Toolbar,
  ToolbarLeft,
  ToolbarRight,
  ToolbarTitle,
  ToolbarTitleInput,
  ToolbarDomain,
  BuilderBody,
  DragGhost,
  DragGhostIcon,
  PreviewSplitBtn,
  PreviewMainBtn,
  PreviewChevronBtn,
  AIAgentBtn,
} from './index.style'

const FieldTypeDragGhost = ({ type }) => {
  const meta = FIELD_TYPE_MAP[type]
  if (!meta) return null
  return (
    <DragGhost>
      <DragGhostIcon>⠿</DragGhostIcon>
      {meta.label}
    </DragGhost>
  )
}


const previewMenuItems = [
  {
    key  : 'ui',
    icon : <PlayCircleOutlined />,
    label: 'Form thực',
  },
  {
    key  : 'code',
    icon : <FileTextOutlined />,
    label: 'JSX code',
  },
]

const PreviewButton = ({ onPreview }) => (
  <PreviewSplitBtn>
    <PreviewMainBtn onClick={() => onPreview('ui')}>
      <PlayCircleOutlined />
      Preview
    </PreviewMainBtn>
    <Dropdown
      menu={{
        items   : previewMenuItems,
        onClick : ({ key }) => onPreview(key),
      }}
      trigger={['click']}
      placement="bottomRight"
    >
      <PreviewChevronBtn>
        <CaretDownOutlined />
      </PreviewChevronBtn>
    </Dropdown>
  </PreviewSplitBtn>
)

const flattenFields = (items = []) => items.flatMap(field => [
  field,
  ...flattenFields(Array.isArray(field.children) ? field.children : []),
])

const isHiddenField = (field) => {
  const type = String(field?.inputType ?? field?.type ?? field?.component ?? '').toLowerCase()
  return type === 'hidden' || type === 'formhidden'
}

const getFieldProvenance = (field) => field?._provenance ?? field?.config?.__provenance ?? null

const isAiGeneratedField = (field) => (
  (getFieldProvenance(field)?.createdBySource ?? getFieldProvenance(field)?.source) === 'ai'
)

const FormBuilder = ({
  templateId = null,
  domain     = '',
  onSave,
  onCancel,
  onOpenAI,
  onContextUpdate,
  incomingTemplate,
}) => {

  const [,             setSaving]       = useState(false)
  const [activeDragId, setActiveDragId] = useState(null)
  const [previewOpen,   setPreviewOpen]   = useState(false)
  const [previewMode,   setPreviewMode]   = useState('ui')
  const [jsxCode,       setJsxCode]       = useState('')
  const appliedIncomingRef = useRef(null)

  const templateMeta  = useFormBuilderStore(s => s.templateMeta)
  const fields        = useFormBuilderStore(s => s.fields)
  const importGeneratedTemplate = useFormBuilderStore(s => s.importGeneratedTemplate)
  const setTemplateMeta = useFormBuilderStore(s => s.setTemplateMeta)
  const addField      = useFormBuilderStore(s => s.addField)
  const moveField     = useFormBuilderStore(s => s.moveField)
  const getParentId   = useFormBuilderStore(s => s.getParentId)
  const getFieldLocation = useFormBuilderStore(s => s.getFieldLocation)
  const toPayload     = useFormBuilderStore(s => s.toPayload)

  const findFieldById = useCallback((items, targetId) => {
    for (const item of items) {
      if (item._id === targetId) return item
      if (Array.isArray(item.children) && item.children.length > 0) {
        const nested = findFieldById(item.children, targetId)
        if (nested) return nested
      }
    }
    return null
  }, [])


  useEffect(() => {
    if (!incomingTemplate?.nonce || appliedIncomingRef.current === incomingTemplate.nonce) {
      return
    }

    appliedIncomingRef.current = incomingTemplate.nonce
    importGeneratedTemplate({
      meta  : incomingTemplate.meta,
      fields: incomingTemplate.fields,
      provenance: {
        source: 'ai',
        action: 'created',
      },
    })
    const nextSchema = {
      meta  : { ...templateMeta, ...(incomingTemplate.meta ?? {}) },
      fields: incomingTemplate.fields ?? [],
    }
    const nextJsxCode = typeof incomingTemplate.code === 'string' && incomingTemplate.code.trim()
      ? incomingTemplate.code
      : buildJSX(nextSchema).plain
    setJsxCode(nextJsxCode)
    if (incomingTemplate.openPreview === true) {
      setPreviewMode('code')
      setPreviewOpen(true)
    }
  }, [incomingTemplate, importGeneratedTemplate, templateMeta])


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const handleDragStart = useCallback(({ active }) => {
    setActiveDragId(active.id)
  }, [])

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveDragId(null)
    if (!over) {
      return
    }

    const activeId = active.id
    const overId   = over.id
    const activeField = typeof activeId === 'string' ? findFieldById(fields, activeId) : null
    const overField = typeof overId === 'string' ? findFieldById(fields, overId) : null
    const hasAiFields = flattenFields(fields).some(isAiGeneratedField)

    if (isAiGeneratedField(activeField) || isAiGeneratedField(overField)) {
      return
    }

    /* Case A: kéo từ sidebar */
    if (typeof activeId === 'string' && activeId.startsWith('type:')) {
      if (hasAiFields) {
        return
      }
      const type = activeId.replace('type:', '')
      if (typeof overId === 'string' && overId.startsWith('block-drop:')) {
        const parentId = overId.replace('block-drop:', '')
        if (!isAiGeneratedField(findFieldById(fields, parentId))) {
          addField(type, undefined, parentId)
        }
        return
      }
      if (overId === CANVAS_DROPPABLE_ID) {
        addField(type)
        return
      }
      if (typeof overId === 'string') {
        const location = getFieldLocation(overId)
        const targetParentId = location?.parentId ?? null
        const atIndex = location?.index
        addField(type, typeof atIndex === 'number' && atIndex !== -1 ? atIndex : undefined, targetParentId)
      }
      return
    }

    /* Case B: move field hiện có */
    if (typeof overId === 'string' && overId.startsWith('block-drop:')) {
      const parentId = overId.replace('block-drop:', '')
      if (!isAiGeneratedField(findFieldById(fields, parentId))) {
        moveField(activeId, null, parentId)
      }
      return
    }

    if (overId === CANVAS_DROPPABLE_ID) {
      moveField(activeId, null, null)
      return
    }

    if (activeId !== overId) {
      moveField(activeId, overId, getParentId(overId))
    }
  }, [addField, moveField, getParentId, getFieldLocation, fields, findFieldById])

  const handleDragCancel = useCallback(() => setActiveDragId(null), [])

  const activeDragType = activeDragId?.startsWith?.('type:')
    ? activeDragId.replace('type:', '')
    : null
  const previewSchema = useMemo(() => ({
    meta: templateMeta,
    fields,
  }), [templateMeta, fields])

  const handleSave = async (previewPayload = null) => {
    if (previewPayload?.syncError) {
      message.error(`Code chưa parse ngược được sang form: ${previewPayload.syncError}`)
      return
    }

    const saveSchema = previewPayload?.schema
      ? {
        meta  : previewPayload.schema.meta ?? templateMeta,
        fields: previewPayload.schema.fields ?? fields,
      }
      : null

    const saveMeta = saveSchema?.meta ?? templateMeta
    const saveFields = saveSchema?.fields ?? fields
    const allFields = flattenFields(saveFields).filter(field => !isHiddenField(field))

    const emptyKey = allFields.find(f => !f.fieldKey)
    if (emptyKey) {
      message.error(`Field "${emptyKey.label || '(chưa có nhãn)'}" chưa có mã field.`)
      return
    }

    const keys   = allFields.map(f => f.fieldKey)
    const hasDup = keys.length !== new Set(keys).size
    if (hasDup) {
      message.error('Có mã field bị trùng trong form. Vui lòng kiểm tra lại.')
      return
    }

    if (!saveMeta.name) {
      message.error('Vui lòng đặt tên cho form.')
      return
    }

    setSaving(true)
    try {
      if (saveSchema) {
        importGeneratedTemplate({
          ...saveSchema,
          provenance: {
            source: 'user',
            action: 'edited',
          },
        })
      }

      const basePayload = saveSchema
        ? useFormBuilderStore.getState().toPayload()
        : toPayload()
      const fallbackJsxCode = buildJSX({
        meta: saveMeta,
        fields: saveFields,
      }).plain
      const saveJsxCode = previewPayload?.jsxCode ?? jsxCode
      const buildMeta = previewPayload?.build?.url
        ? {
          microFrontendUrl: previewPayload.build.url,
          micro_frontend_url: previewPayload.build.url,
          remoteEntryUrl: previewPayload.build.url,
          remote_entry_url: previewPayload.build.url,
          componentId: previewPayload.build.componentId,
          component_id: previewPayload.build.componentId,
          remoteEntry: previewPayload.build.url,
        }
        : {}
      const payload = {
        ...basePayload,
        meta: {
          ...basePayload.meta,
          ...buildMeta,
        },
        jsx_code: saveJsxCode || fallbackJsxCode,
        ...buildMeta,
      }

      if (previewPayload?.jsxCode != null) {
        setJsxCode(previewPayload.jsxCode)
      }

      console.log('[FormBuilder] save payload', payload)
      await onSave?.(payload)
      message.success('Đã lưu form template.')
    } catch (err) {
      message.error('Lưu thất bại. Vui lòng thử lại.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleOpenAI = useCallback(() => {
    onOpenAI?.({
      mode   : 'form_builder',
      context: {
        meta  : templateMeta,
        fields,
        templateId: templateMeta?.id
      }
    })
  }, [templateMeta, fields, onOpenAI])

  /* Khi fields thay đổi → silent update context, không mở panel */
  useEffect(() => {
    onContextUpdate?.({ meta: templateMeta, fields })
    /* eslint-disable-next-line */
  }, [fields])

  const handlePreview = useCallback((mode = 'ui') => {
    const generatedJsxCode = buildJSX({
      meta: templateMeta,
      fields,
    }).plain
    setJsxCode(current => mode === 'code' && current?.trim() ? current : generatedJsxCode)
    setPreviewMode(mode)
    setPreviewOpen(true)
  }, [templateMeta, fields])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <BuilderLayout>

        {/* ── Toolbar ── */}
        <Toolbar>

          {/* Left — tên form + domain */}
          <ToolbarLeft>
            <EditOutlined style={{ color: '#8c8c8c' }} />
            <ToolbarTitleInput
              value={templateMeta.name}
              onChange={e => setTemplateMeta({ name: e.target.value })}
              placeholder="Nhập tên form"
              aria-label="Tên form"
            />
            {!templateMeta.name && (
              <ToolbarTitle>Form chưa đặt tên</ToolbarTitle>
            )}
            {templateMeta.domain && (
              <ToolbarDomain>{templateMeta.domain}</ToolbarDomain>
            )}
          </ToolbarLeft>

          {/* Right — CTAs + Save */}
          <ToolbarRight>

            {/* Preview split button */}
            <PreviewButton onPreview={handlePreview} />

            {/* AI Agent CTA */}
            <AIAgentBtn onClick={handleOpenAI}>
              <ThunderboltOutlined />
              AI Agent
            </AIAgentBtn>

            {/* Divider ngầm — khoảng cách */}
            <div style={{ width: 1, height: 16, background: '#e8e8e8', margin: '0 4px' }} />

            {/* Hủy */}
            <Popconfirm
              title="Hủy thay đổi?"
              description="Các thay đổi chưa lưu sẽ bị mất."
              onConfirm={onCancel}
              okText="Hủy thay đổi"
              cancelText="Tiếp tục chỉnh sửa"
              okButtonProps={{ danger: true }}
              disabled={fields.length === 0}
            >
              <Button
                icon={<CloseOutlined />}
                onClick={fields.length === 0 ? onCancel : undefined}
              >
                Hủy
              </Button>
            </Popconfirm>

          </ToolbarRight>
        </Toolbar>

        {/* ── 3-column body ── */}
        <BuilderBody>
          <FieldTypeList />
          <FieldCanvas />
          <FieldConfigPanel />
        </BuilderBody>

      </BuilderLayout>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeDragType && <FieldTypeDragGhost type={activeDragType} />}
      </DragOverlay>
      
      {/* ── Preview modal ── */}
      <PreviewModal
        open={previewOpen}
        mode={previewMode}
        schema={previewSchema}
        initialJsxCode={jsxCode}
        onJsxCodeChange={setJsxCode}
        onClose={() => setPreviewOpen(false)}
        onSave={(payload) => {
          setPreviewOpen(false); 
          handleSave(payload);
        }}
      />
    </DndContext>
  )
}

export default FormBuilder
