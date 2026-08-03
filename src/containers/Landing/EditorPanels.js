import { useMemo, useState } from 'react'
import axios from 'axios'
import { message } from 'antd'
import JoditEditor from 'jodit-react'
import { useEditorStore } from '@/store/editorStore'
import {
  extractUploadItems,
  resolveUploadUrl,
} from '@/containers/PreviewModal/uploadUtils'
import { LANDING_BLOCKS, createLandingBlock, getLandingBlock } from './blockRegistry'
import {
  Panel, PanelHead, PanelBody, SectionLabel, BlockList, BlockRow, BlockIcon, BlockName,
  Palette, PaletteButton, Divider, Field, TextInput, TextArea, SelectInput, ColorRow,
  ActionGrid, ActionButton, EmptyHint, VersionList, VersionRow,
  Repeater, RepeaterItem, RepeaterHead, CheckRow,
  ImageControl, ImagePreview, ImageActions,
  MultiImageList, MultiImageItem, MultiImageThumb, MultiImageFields, MultiUploadButton,
} from './EditorPanels.style'

const formatTime = value => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('vi-VN')
}

const RichTextControl = ({ value, onChange }) => {
  const config = useMemo(() => ({
    readonly: false,
    height: 260,
    toolbarAdaptive: false,
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|', 'paragraph', 'fontsize', 'brush', '|',
      'link', 'align', '|', 'undo', 'redo', 'eraser', 'source',
    ],
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
  }), [])

  return (
    <JoditEditor
      value={value ?? ''}
      config={config}
      onBlur={nextValue => onChange(nextValue)}
    />
  )
}

const PropertyControl = ({ field, value, onChange }) => {
  const [uploading, setUploading] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)

  if (field.control === 'repeater') {
    return <RepeaterControl field={field} value={value} onChange={onChange} />
  }

  if (field.control === 'nestedBlocks') {
    return <NestedBlocksControl value={value} onChange={onChange} />
  }

  if (field.control === 'richtext') {
    return <RichTextControl value={value} onChange={onChange} />
  }

  if (field.control === 'multiImage') {
    const images = Array.isArray(value) ? value : []

    const uploadImages = async event => {
      const files = Array.from(event.target.files ?? [])
      event.target.value = ''
      if (!files.length) return

      const invalidFile = files.find(file => !file.type?.startsWith('image/'))
      if (invalidFile) {
        message.error(`${invalidFile.name} không phải file ảnh.`)
        return
      }
      const oversizedFile = files.find(file => file.size > 8 * 1024 * 1024)
      if (oversizedFile) {
        message.error(`${oversizedFile.name} vượt quá 8MB.`)
        return
      }

      setUploading(true)
      try {
        const formData = new FormData()
        files.forEach(file => formData.append('files', file))
        formData.append('folder', field.uploadFolder || 'landing/banner')
        const response = await axios.post('/upload/folder/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const uploaded = extractUploadItems(response.data)
        const nextImages = uploaded
          .map((item, index) => ({
            url: resolveUploadUrl(item),
            alt: files[index]?.name ?? `Banner ${images.length + index + 1}`,
            link: '',
            openInNewTab: false,
            caption: '',
            focalX: 50,
            focalY: 50,
          }))
          .filter(item => item.url)

        if (!nextImages.length) throw new Error('API upload không trả về đường dẫn ảnh.')
        onChange([...images, ...nextImages])
        message.success(`Đã tải lên ${nextImages.length} ảnh.`)
      } catch (error) {
        message.error(error?.response?.data?.message || error.message || 'Upload ảnh thất bại.')
      } finally {
        setUploading(false)
      }
    }

    const updateImage = (index, values) => {
      onChange(images.map((image, imageIndex) => (
        imageIndex === index ? { ...image, ...values } : image
      )))
    }

    const moveImage = (fromIndex, toIndex) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= images.length) return
      const nextImages = [...images]
      const [moved] = nextImages.splice(fromIndex, 1)
      nextImages.splice(toIndex, 0, moved)
      onChange(nextImages)
    }

    return (
      <ImageControl>
        <MultiUploadButton>
          {uploading ? 'Đang tải ảnh...' : '+ Chọn nhiều ảnh'}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={uploadImages}
          />
        </MultiUploadButton>
        <MultiImageList>
          {images.map((image, index) => (
            <MultiImageItem
              key={`${image.url}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={event => event.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) moveImage(dragIndex, index)
                setDragIndex(null)
              }}
              onDragEnd={() => setDragIndex(null)}
            >
              <div>
                <MultiImageThumb
                  src={image.url}
                  alt={image.alt || `Banner ${index + 1}`}
                  style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }}
                />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 5 }}>
                  <button type="button" disabled={index === 0} onClick={() => moveImage(index, index - 1)}>↑</button>
                  <button type="button" disabled={index === images.length - 1} onClick={() => moveImage(index, index + 1)}>↓</button>
                </div>
              </div>
              <MultiImageFields>
                <TextInput
                  value={image.alt ?? ''}
                  placeholder="Mô tả ảnh"
                  onChange={event => updateImage(index, { alt: event.target.value })}
                />
                <TextInput
                  value={image.caption ?? ''}
                  placeholder="Chú thích ảnh"
                  onChange={event => updateImage(index, { caption: event.target.value })}
                />
                <TextInput
                  value={image.link ?? ''}
                  placeholder="URL khi click"
                  onChange={event => updateImage(index, { link: event.target.value })}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <TextInput
                    type="number"
                    min="0"
                    max="100"
                    value={image.focalX ?? 50}
                    title="Điểm lấy nét ngang (%)"
                    onChange={event => updateImage(index, { focalX: event.target.value })}
                  />
                  <TextInput
                    type="number"
                    min="0"
                    max="100"
                    value={image.focalY ?? 50}
                    title="Điểm lấy nét dọc (%)"
                    onChange={event => updateImage(index, { focalY: event.target.value })}
                  />
                </div>
                <CheckRow>
                  <input
                    type="checkbox"
                    checked={Boolean(image.openInNewTab)}
                    onChange={event => updateImage(index, { openInNewTab: event.target.checked })}
                  />
                  <span>Mở tab mới</span>
                </CheckRow>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}
                >
                  Xóa ảnh
                </button>
              </MultiImageFields>
            </MultiImageItem>
          ))}
        </MultiImageList>
      </ImageControl>
    )
  }

  if (field.control === 'image') {
    const uploadImage = async event => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      if (!file.type?.startsWith('image/')) {
        message.error('Chỉ hỗ trợ tải lên file ảnh.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        message.error('Dung lượng ảnh không được vượt quá 5MB.')
        return
      }

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('files', file)
        formData.append('folder', field.uploadFolder || 'landing/image')
        const response = await axios.post('/upload/folder/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const uploaded = extractUploadItems(response.data)
        const imageUrl = resolveUploadUrl(uploaded[0])
        if (!imageUrl) throw new Error('API upload không trả về đường dẫn ảnh.')
        onChange(imageUrl)
        message.success('Đã tải ảnh lên.')
      } catch (error) {
        message.error(error?.response?.data?.message || error.message || 'Upload ảnh thất bại.')
      } finally {
        setUploading(false)
      }
    }

    return (
      <ImageControl>
        <ImagePreview>
          {value
            ? <img src={value} alt={`Xem trước ${field.label.toLowerCase()}`} />
            : <span>Chưa chọn ảnh</span>
          }
        </ImagePreview>
        <TextInput
          value={value ?? ''}
          placeholder="https://.../logo.png"
          onChange={event => onChange(event.target.value)}
        />
        <ImageActions>
          <label>
            {uploading ? 'Đang tải lên...' : 'Chọn ảnh từ máy'}
            <input type="file" accept="image/*" disabled={uploading} onChange={uploadImage} />
          </label>
          <button type="button" disabled={!value || uploading} onClick={() => onChange('')}>Xóa</button>
        </ImageActions>
      </ImageControl>
    )
  }

  if (field.control === 'checkbox') {
    return (
      <CheckRow>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={event => onChange(event.target.checked)}
        />
        <span>{field.label}</span>
      </CheckRow>
    )
  }

  if (field.control === 'textarea') {
    return (
      <TextArea
        value={value ?? ''}
        onChange={event => onChange(event.target.value)}
      />
    )
  }

  if (field.control === 'select') {
    return (
      <SelectInput
        value={value ?? ''}
        onChange={event => onChange(event.target.value)}
      >
        {(field.options ?? []).map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </SelectInput>
    )
  }

  if (field.control === 'color') {
    return (
      <ColorRow>
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={event => onChange(event.target.value)}
        />
        <TextInput
          value={value ?? ''}
          onChange={event => onChange(event.target.value)}
        />
      </ColorRow>
    )
  }

  return (
    <TextInput
      type={field.control === 'number' ? 'number' : 'text'}
      value={value ?? ''}
      onChange={event => onChange(event.target.value)}
    />
  )
}

const RepeaterControl = ({ field, value, onChange }) => {
  const items = Array.isArray(value) ? value : []

  const updateItem = (index, name, nextValue) => {
    onChange(items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [name]: nextValue } : item
    )))
  }

  return (
    <Repeater>
      {items.map((item, index) => (
        <RepeaterItem key={`${field.name}-${index}`}>
          <RepeaterHead>
            <span>Mục {index + 1}</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              Xóa
            </button>
          </RepeaterHead>
          {(field.itemFields ?? []).map(itemField => (
            itemField.control === 'checkbox' ? (
              <PropertyControl
                key={itemField.name}
                field={itemField}
                value={item?.[itemField.name]}
                onChange={nextValue => updateItem(index, itemField.name, nextValue)}
              />
            ) : (
              <Field key={itemField.name}>
                <span>{itemField.label}</span>
                <PropertyControl
                  field={itemField}
                  value={item?.[itemField.name]}
                  onChange={nextValue => updateItem(index, itemField.name, nextValue)}
                />
              </Field>
            )
          ))}
        </RepeaterItem>
      ))}
      <ActionButton
        type="button"
        onClick={() => onChange([...items, { ...field.itemDefaults }])}
      >
        + Thêm mục
      </ActionButton>
    </Repeater>
  )
}

const NESTED_BLOCK_TYPES = new Set([
  'heading', 'text', 'image', 'button', 'features', 'pricing', 'divider', 'spacer',
  'richText', 'cta', 'contactForm', 'leadForm', 'video', 'gallery', 'faq',
  'testimonials', 'logos', 'stats', 'map', 'social', 'productList', 'postList',
  'teamList', 'countdown', 'tabs', 'timeline', 'customHtml',
])

const NestedBlocksControl = ({ value, onChange }) => {
  const blocks = Array.isArray(value) ? value : []
  const definitions = LANDING_BLOCKS.filter(block => NESTED_BLOCK_TYPES.has(block.type))
  const [type, setType] = useState(definitions[0]?.type || 'heading')
  const [dragIndex, setDragIndex] = useState(null)

  const updateBlockProps = (index, name, nextValue) => {
    onChange(blocks.map((block, blockIndex) => blockIndex === index
      ? { ...block, props: { ...block.props, [name]: nextValue } }
      : block))
  }

  const moveBlock = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= blocks.length) return
    const nextBlocks = [...blocks]
    const [moved] = nextBlocks.splice(fromIndex, 1)
    nextBlocks.splice(toIndex, 0, moved)
    onChange(nextBlocks)
  }

  return (
    <Repeater>
      {blocks.map((block, index) => {
        const definition = getLandingBlock(block.type)
        return (
          <RepeaterItem
            key={block.id || `${block.type}-${index}`}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={event => event.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) moveBlock(dragIndex, index)
              setDragIndex(null)
            }}
            onDragEnd={() => setDragIndex(null)}
          >
            <RepeaterHead>
              <strong>{index + 1}. {definition?.label || block.type}</strong>
              <span style={{ display: 'flex', gap: 5 }}>
                <button type="button" disabled={index === 0} onClick={() => moveBlock(index, index - 1)}>↑</button>
                <button type="button" disabled={index === blocks.length - 1} onClick={() => moveBlock(index, index + 1)}>↓</button>
                <button type="button" onClick={() => onChange(blocks.filter((_, blockIndex) => blockIndex !== index))}>Xóa</button>
              </span>
            </RepeaterHead>
            <details>
              <summary style={{ cursor: 'pointer', marginBottom: 10 }}>Cấu hình block</summary>
              {(definition?.fields ?? []).map(field => (
                <Field key={field.name}>
                  <span>{field.label}</span>
                  <PropertyControl
                    field={field}
                    value={block.props?.[field.name]}
                    onChange={nextValue => updateBlockProps(index, field.name, nextValue)}
                  />
                </Field>
              ))}
            </details>
          </RepeaterItem>
        )
      })}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 7 }}>
        <SelectInput value={type} onChange={event => setType(event.target.value)}>
          {definitions.map(definition => <option key={definition.type} value={definition.type}>{definition.label}</option>)}
        </SelectInput>
        <ActionButton type="button" onClick={() => {
          const block = createLandingBlock(type)
          if (block) onChange([...blocks, block])
        }}>+ Thêm</ActionButton>
      </div>
    </Repeater>
  )
}

export function BlockNavigator() {
  const schema = useEditorStore(state => state.draftSchema)
  const selected = useEditorStore(state => state.selected)
  const openEdit = useEditorStore(state => state.openEdit)
  const addBlock = useEditorStore(state => state.addBlock)

  return (
    <Panel $width="230px">
      <PanelHead>
        <h3>Cấu trúc trang</h3>
        <p>Chọn block để sửa hoặc thêm thành phần mới.</p>
      </PanelHead>
      <PanelBody>
        <SectionLabel>Blocks trên trang</SectionLabel>
        <BlockList>
          {(schema?.sections ?? []).map((section, index) => {
            const definition = getLandingBlock(section.type)
            return (
              <BlockRow
                type="button"
                key={section.id}
                $active={selected === section.id}
                onClick={() => openEdit(section.id)}
              >
                <BlockIcon>{definition?.icon ?? '?'}</BlockIcon>
                <BlockName>{index + 1}. {definition?.label ?? section.type}</BlockName>
              </BlockRow>
            )
          })}
        </BlockList>

        <Divider />
        <SectionLabel>Thêm block</SectionLabel>
        <Palette>
          {LANDING_BLOCKS.map(block => (
            <PaletteButton
              type="button"
              key={block.type}
              onClick={() => addBlock(block.type, selected)}
              title={`Thêm ${block.label}`}
            >
              <BlockIcon>{block.icon}</BlockIcon>
              <BlockName>{block.label}</BlockName>
            </PaletteButton>
          ))}
        </Palette>
      </PanelBody>
    </Panel>
  )
}

export function BlockInspector() {
  const schema = useEditorStore(state => state.draftSchema)
  const selected = useEditorStore(state => state.selected)
  const versions = useEditorStore(state => state.versions)
  const updatePageMeta = useEditorStore(state => state.updatePageMeta)
  const currentPageSlug = useEditorStore(state => state.currentPageSlug)
  const updatePageSlug = useEditorStore(state => state.updatePageSlug)
  const updateTheme = useEditorStore(state => state.updateTheme)
  const updateBlockProps = useEditorStore(state => state.updateBlockProps)
  const duplicateBlock = useEditorStore(state => state.duplicateBlock)
  const removeBlock = useEditorStore(state => state.removeBlock)
  const moveBlock = useEditorStore(state => state.moveBlock)
  const restoreVersion = useEditorStore(state => state.restoreVersion)

  const section = useMemo(
    () => schema?.sections?.find(item => item.id === selected) ?? null,
    [schema, selected],
  )
  const definition = getLandingBlock(section?.type)
  const sectionIndex = schema?.sections?.findIndex(item => item.id === selected) ?? -1

  return (
    <Panel $right $width="285px">
      <PanelHead>
        <h3>{section ? (definition?.label ?? 'Thuộc tính block') : 'Cài đặt trang'}</h3>
        <p>
          {section
            ? 'Thay đổi được cập nhật trực tiếp vào bản xem trước.'
            : 'Chọn một block trong trang để chỉnh nội dung.'}
        </p>
      </PanelHead>
      <PanelBody>
        {section ? (
          <>
            <Field>
              <span>Tiêu đề của block (không bắt buộc)</span>
              <PropertyControl
                field={{ name: 'blockTitle', label: 'Tiêu đề của block', control: 'text' }}
                value={section.props?.blockTitle}
                onChange={value => updateBlockProps(section.id, { blockTitle: value })}
              />
            </Field>

            {(definition?.fields ?? []).length > 0 ? (
              definition.fields.map(field => (
                <Field key={field.name}>
                  <span>{field.label}</span>
                  {field.control === 'repeater' ? (
                    <RepeaterControl
                      field={field}
                      value={section.props?.[field.name]}
                      onChange={value => updateBlockProps(section.id, { [field.name]: value })}
                    />
                  ) : (
                    <PropertyControl
                      field={field}
                      value={section.props?.[field.name]}
                      onChange={value => updateBlockProps(section.id, { [field.name]: value })}
                    />
                  )}
                </Field>
              ))
            ) : (
              <EmptyHint>
                Block này đang chứa dữ liệu dạng danh sách. Bạn có thể dùng AI để sửa nhanh nội dung chi tiết.
              </EmptyHint>
            )}

            <Divider />
            <SectionLabel>Thao tác block</SectionLabel>
            <ActionGrid>
              <ActionButton
                type="button"
                disabled={sectionIndex <= 0}
                onClick={() => moveBlock(section.id, 'up')}
              >
                Đưa lên
              </ActionButton>
              <ActionButton
                type="button"
                disabled={sectionIndex >= schema.sections.length - 1}
                onClick={() => moveBlock(section.id, 'down')}
              >
                Đưa xuống
              </ActionButton>
              <ActionButton type="button" onClick={() => duplicateBlock(section.id)}>
                Nhân bản
              </ActionButton>
              <ActionButton type="button" $danger onClick={() => removeBlock(section.id)}>
                Xóa block
              </ActionButton>
            </ActionGrid>
          </>
        ) : (
          <>
            <Field>
              <span>Tên trang</span>
              <TextInput
                value={schema?.name ?? ''}
                onChange={event => updatePageMeta({ name: event.target.value })}
              />
            </Field>
            <Field>
              <span>Đường dẫn trang</span>
              <TextInput
                value={currentPageSlug}
                placeholder="/gioi-thieu"
                onChange={event => updatePageSlug(event.target.value)}
              />
            </Field>
            <Field>
              <span>Màu thương hiệu</span>
              <ColorRow>
                <input
                  type="color"
                  value={schema?.theme?.primaryColor || '#7c5cff'}
                  onChange={event => updateTheme({ primaryColor: event.target.value })}
                />
                <TextInput
                  value={schema?.theme?.primaryColor ?? ''}
                  onChange={event => updateTheme({ primaryColor: event.target.value })}
                />
              </ColorRow>
            </Field>
            <Field>
              <span>Font chữ</span>
              <TextInput
                value={schema?.theme?.fontFamily ?? ''}
                onChange={event => updateTheme({ fontFamily: event.target.value })}
              />
            </Field>

            <Divider />
            <SectionLabel>Phiên bản đã xuất bản</SectionLabel>
            {versions.length ? (
              <VersionList>
                {versions.map(version => (
                  <VersionRow key={version.id}>
                    <span>{formatTime(version.publishedAt)}</span>
                    <button type="button" onClick={() => restoreVersion(version.id)}>Khôi phục</button>
                  </VersionRow>
                ))}
              </VersionList>
            ) : (
              <EmptyHint>Chưa có phiên bản nào được xuất bản.</EmptyHint>
            )}
          </>
        )}
      </PanelBody>
    </Panel>
  )
}
