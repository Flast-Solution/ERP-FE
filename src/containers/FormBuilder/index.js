/**
 * FormBuilder/index.js
 *
 * Props:
 *   templateId  {number|null}  — edit mode nếu có, null = create
 *   domain      {string}       — domain mặc định
 *   onSave      {function}     — nhận payload { meta, fields[] }
 *   onCancel    {function}
 *   onPreview   {function}     — (mode: "ui"|"code") => void — App level mở PreviewModal
 *   onOpenAI    {function}     — ({ mode, context }) => void — App level mở AIChatbot
 */

import { useState, useEffect, useCallback } from 'react'
import { Button, Spin, message, Popconfirm, Dropdown } from 'antd'
import {
  SaveOutlined,
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
import { arrayMove } from '@dnd-kit/sortable'

import RequestUtils from '@flast-erp/core/utils/RequestUtils';
import useFormBuilderStore from '@/store/useFormBuilderStore'
import { FIELD_TYPE_MAP }  from '@/utils/fieldTypes'
import FieldTypeList       from './FieldTypeList'
import FieldCanvas, { CANVAS_DROPPABLE_ID } from './FieldCanvas'
import FieldConfigPanel    from './FieldConfigPanel'
import {
  BuilderLayout,
  Toolbar,
  ToolbarLeft,
  ToolbarRight,
  ToolbarTitle,
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


const FormBuilder = ({
  templateId = null,
  domain     = '',
  onSave,
  onCancel,
  onPreview,
  onOpenAI,
}) => {
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [activeDragId, setActiveDragId] = useState(null)

  const templateMeta  = useFormBuilderStore(s => s.templateMeta)
  const fields        = useFormBuilderStore(s => s.fields)
  const loadFromApi   = useFormBuilderStore(s => s.loadFromApi)
  const setTemplateMeta = useFormBuilderStore(s => s.setTemplateMeta)
  const addField      = useFormBuilderStore(s => s.addField)
  const reorderFields = useFormBuilderStore(s => s.reorderFields)
  const toPayload     = useFormBuilderStore(s => s.toPayload)
  const reset         = useFormBuilderStore(s => s.reset)


  useEffect(() => {
    reset()
    if (templateId) {
      setLoading(true)
      RequestUtils.Get('/form-templates', { templateId })
      .then(res => loadFromApi(res.data))
      .finally(() => setLoading(false))
      setLoading(false)
    } else if (domain) {
      setTemplateMeta({ domain })
    }
    return () => reset()
    /* eslint-disable-next-line */
  }, [templateId])


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const handleDragStart = useCallback(({ active }) => {
    setActiveDragId(active.id)
  }, [])

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveDragId(null)
    if (!over) return

    const activeId = active.id
    const overId   = over.id

    /* Case A: kéo từ sidebar */
    if (typeof activeId === 'string' && activeId.startsWith('type:')) {
      const type = activeId.replace('type:', '')
      if (overId === CANVAS_DROPPABLE_ID || fields.some(f => f._id === overId)) {
        const atIndex = fields.findIndex(f => f._id === overId)
        addField(type, atIndex !== -1 ? atIndex : undefined)
      }
      return
    }

    /* Case B: reorder trong canvas */
    if (activeId !== overId) {
      const oldIndex = fields.findIndex(f => f._id === activeId)
      const newIndex = fields.findIndex(f => f._id === overId)
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderFields(arrayMove(fields, oldIndex, newIndex).map(f => f._id))
      }
    }
  }, [fields, addField, reorderFields])

  const handleDragCancel = useCallback(() => setActiveDragId(null), [])

  const activeDragType = activeDragId?.startsWith?.('type:')
    ? activeDragId.replace('type:', '')
    : null

  const handleSave = async () => {
    const emptyKey = fields.find(f => !f.fieldKey)
    if (emptyKey) {
      message.error(`Field "${emptyKey.label || '(chưa có nhãn)'}" chưa có mã field.`)
      return
    }

    const keys   = fields.map(f => f.fieldKey)
    const hasDup = keys.length !== new Set(keys).size
    if (hasDup) {
      message.error('Có mã field bị trùng trong form. Vui lòng kiểm tra lại.')
      return
    }

    if (!templateMeta.name) {
      message.error('Vui lòng đặt tên cho form.')
      return
    }

    setSaving(true)
    try {
      await onSave?.(toPayload())
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
        fields : fields,
      },
    })
  }, [templateMeta, fields, onOpenAI])

  if (loading) {
    return (
      <BuilderLayout style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </BuilderLayout>
    )
  }

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
            <ToolbarTitle>
              {templateMeta.name || 'Form chưa đặt tên'}
            </ToolbarTitle>
            {templateMeta.domain && (
              <ToolbarDomain>{templateMeta.domain}</ToolbarDomain>
            )}
          </ToolbarLeft>

          {/* Right — CTAs + Save */}
          <ToolbarRight>

            {/* Preview split button */}
            <PreviewButton onPreview={mode => onPreview?.(mode)} />

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

            {/* Lưu */}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
            >
              {templateId ? 'Cập nhật' : 'Lưu form'}
            </Button>

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

    </DndContext>
  )
}

export default FormBuilder