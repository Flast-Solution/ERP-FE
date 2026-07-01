import React, { useEffect, useMemo, useState } from 'react'
import { Button, Empty, Form, Input, Select, Spin, Switch, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import { slugifyFieldKey } from '@/utils/slugify'

const TEMPLATE_FILTER_API = '/workflow/forms/template/filter?limit=10&offset=0&page=1&isFull=true'
const TEMPLATE_SAVE_API = '/workflow/forms/template/save'

const STANDARDS = [
  { label: '- Không -', value: '' },
  { label: 'TCVN 1748:2007', value: 'TCVN 1748:2007' },
  { label: 'TCVN 5793:2009', value: 'TCVN 5793:2009' },
  { label: 'ISO 5077', value: 'ISO 5077' },
  { label: 'ISO 13934-1', value: 'ISO 13934-1' },
]

const STARTERS = [
  {
    id: 'blank',
    label: 'Trống',
    desc: 'Bắt đầu từ form rỗng. Bạn tự kéo field vào.',
    count: 0,
    fields: [],
  },
  {
    id: 'physical',
    label: 'Đo lường vật lý',
    desc: 'Số đo + tiêu chuẩn + ghi chú KTV. Hợp với định lượng / co rút.',
    count: 4,
    fields: [
      { fieldKey: 'measurement_value', label: 'Giá trị đo', inputType: 'decimal', isRequired: true },
      { fieldKey: 'unit', label: 'Đơn vị', inputType: 'text', isRequired: true },
      { fieldKey: 'standard', label: 'Tiêu chuẩn', inputType: 'text', isRequired: false },
      { fieldKey: 'technician_note', label: 'Ghi chú KTV', inputType: 'textarea', isRequired: false },
    ],
  },
  {
    id: 'score',
    label: 'Chấm điểm 1-5',
    desc: 'Radio cấp 1-5 + ảnh + ghi chú. Hợp với bền màu / ngoại quan.',
    count: 5,
    fields: [
      {
        fieldKey: 'score',
        label: 'Điểm',
        inputType: 'radio',
        isRequired: true,
        config: {
          options: [1, 2, 3, 4, 5].map(value => ({ label: String(value), value })),
        },
      },
      { fieldKey: 'result_image', label: 'Ảnh kết quả', inputType: 'image', isRequired: false },
      { fieldKey: 'defect_note', label: 'Ghi chú lỗi', inputType: 'textarea', isRequired: false },
      { fieldKey: 'passed', label: 'Đạt', inputType: 'checkbox', isRequired: false },
      { fieldKey: 'technician_note', label: 'Ghi chú KTV', inputType: 'textarea', isRequired: false },
    ],
  },
  {
    id: 'checklist',
    label: 'Checklist',
    desc: 'Danh sách checkbox + ghi chú. Hợp với kiểm tra trực quan.',
    count: 3,
    fields: [
      {
        fieldKey: 'check_items',
        label: 'Hạng mục kiểm tra',
        inputType: 'checkbox',
        isRequired: true,
        config: {
          options: [
            { label: 'Đúng mẫu', value: 'match_sample' },
            { label: 'Không lỗi ngoại quan', value: 'no_visual_defect' },
            { label: 'Đạt tiêu chuẩn', value: 'match_standard' },
          ],
        },
      },
      { fieldKey: 'result_image', label: 'Ảnh minh chứng', inputType: 'image', isRequired: false },
      { fieldKey: 'technician_note', label: 'Ghi chú KTV', inputType: 'textarea', isRequired: false },
    ],
  },
]

const Shell = styled.div`
  margin: -24px;
  background: #fff;
  color: #111827;
  font-size: 13px;
`

const Header = styled.div`
  padding: 16px 20px 12px;
  border-bottom: 1px solid #e5e7eb;
`

const Title = styled.div`
  font-size: 18px;
  line-height: 1.3;
  font-weight: 700;
  color: #111827;
`

const Subtitle = styled.div`
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`

const Body = styled.div`
  padding: 16px 20px;
  max-height: min(420px, calc(90vh - 200px));
  overflow-y: auto;
`

const Footer = styled.div`
  border-top: 1px solid #e5e7eb;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #f8fafc;
`

const FooterHint = styled.div`
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
`

const CodeChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border: 1px solid #dbe1ea;
  border-radius: 4px;
  background: #f8fafc;
  color: #4b5563;
  font-family: monospace;
  font-size: 11px;
  line-height: 1.4;
`

const SearchRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
`

const CreateLink = styled.button`
  border: 0;
  background: transparent;
  color: #4f46e5;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;

  &:hover {
    color: #4338ca;
  }
`

const FormList = styled.div`
  border: 1px solid #dfe3ea;
  border-radius: 8px;
  overflow: hidden;
  max-height: 320px;
  overflow-y: auto;
`

const FormRow = styled.button`
  width: 100%;
  border: 0;
  border-bottom: 1px solid #e7eaf0;
  background: ${({ $selected }) => ($selected ? '#eef2ff' : '#fff')};
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 11px 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${({ $selected }) => ($selected ? '#eef2ff' : '#fafafa')};
  }

  &:last-child {
    border-bottom: 0;
  }
`

const RadioCircle = styled.span`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${({ $selected }) => ($selected ? '#4f46e5' : '#cbd5e1')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $selected }) => ($selected ? '#4f46e5' : 'transparent')};
  }
`

const FormName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.3;
`

const FormMeta = styled.div`
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.35;
`

const FieldCount = styled.div`
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
  white-space: nowrap;
  flex-shrink: 0;
`

const SearchInput = styled(Input)`
  && {
    height: 36px;
    font-size: 13px;
    border-radius: 8px;
  }
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`

const FieldBlock = styled.div`
  margin-bottom: 12px;

  .ant-input,
  .ant-select-selector {
    min-height: 34px !important;
    border-radius: 8px !important;
    font-size: 13px;
  }
`

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
`

const Help = styled.div`
  margin-top: 5px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
`

const StarterCard = styled.button`
  position: relative;
  min-height: 88px;
  border: 1.5px solid ${({ $active }) => ($active ? '#4f46e5' : '#dfe3ea')};
  background: ${({ $active }) => ($active ? '#eef2ff' : '#fff')};
  border-radius: 8px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
`

const StarterTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
`

const StarterDesc = styled.div`
  font-size: 12px;
  color: #6b7280;
  line-height: 1.35;
`

const StarterCount = styled.div`
  margin-top: 8px;
  color: #6b7280;
  font-family: monospace;
  font-size: 11px;
`

const StarterMark = styled.span`
  position: absolute;
  right: 10px;
  top: 10px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#4f46e5' : '#f8fafc')};
  border: 2px solid ${({ $active }) => ($active ? '#c7d2fe' : '#f8fafc')};
`

const RequiredBox = styled.div`
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid #dfe3ea;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
`

const CreateBody = styled(Body)`
  max-height: min(520px, calc(90vh - 200px));
`

const normalizeTemplateResponse = (res = {}) => {
  const payload = res?.data ?? res
  if (Array.isArray(payload?.embedded)) return payload.embedded
  if (Array.isArray(payload?.data?.embedded)) return payload.data.embedded
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload)) return payload
  return []
}

const normalizeTemplate = (item = {}) => {
  const fields = Array.isArray(item.fields) ? item.fields : []
  const name = (item.description ?? '').trim() || item.name || item.formKey || `Form #${item.id}`
  return {
    ...item,
    id: item.id,
    name,
    formKey: item.name ?? item.formKey ?? item.key ?? '',
    domain: item.domain ?? '',
    fields,
    required: item.required ?? false,
  }
}

const makeField = (field, index) => ({
  id: null,
  fieldKey: field.fieldKey,
  label: field.label,
  inputType: field.inputType,
  isRequired: field.isRequired ?? false,
  isSearchable: false,
  isIndexed: true,
  sortOrder: index,
  enabled: true,
  config: field.config ?? {},
  refDomain: null,
  autoGenerate: null,
  colSpan: 24,
  fieldRole: null,
})

const mergeAttachedForm = (attachedForms, form) => {
  const next = attachedForms.filter(item => String(item.id) !== String(form.id))
  return [...next, form]
}

const ModalAttachForm = ({
  attachedForms = [],
  onSave,
  closeModal,
  stepCode,
  stepLabel,
}) => {
  
  const navigate = useNavigate()
  const [view, setView] = useState('list')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createForm] = Form.useForm()
  const [starterId, setStarterId] = useState('blank')
  const [required, setRequired] = useState(true)

  const selectedTemplate = useMemo(
    () => templates.find(item => String(item.id) === String(selectedId)),
    [selectedId, templates],
  )

  const stepTitle = stepLabel || 'bước hiện tại'
  const stepCodeText = stepCode || ''

  useEffect(() => {
    if (view !== 'list') return undefined
    let mounted = true

    setLoading(true)
    RequestUtils.Get(TEMPLATE_FILTER_API, search ? { name: search } : {})
      .then((res) => {
        if (!mounted) return
        const data = normalizeTemplateResponse(res).map(normalizeTemplate)
        setTemplates(data)
      })
      .catch((error) => {
        console.error('[ModalAttachForm] fetch templates', error)
        if (mounted) {
          setTemplates([])
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [search, view])

  const handleAttachSelected = () => {
    if (!selectedTemplate) return
    const nextForm = {
      ...selectedTemplate,
      required: selectedTemplate.required ?? true,
    }
    onSave(mergeAttachedForm(attachedForms, nextForm))
    closeModal?.()
  }

  const handleNameChange = (event) => {
    const name = event.target.value
    const currentKey = createForm.getFieldValue('formKey')
    const prevKey = slugifyFieldKey(createForm.__lastName ?? '')
    if (!currentKey || currentKey === prevKey) {
      createForm.setFieldValue('formKey', slugifyFieldKey(name))
    }
    createForm.__lastName = name
  }

  const buildTemplateDraft = (values) => {
    const starter = STARTERS.find(item => item.id === starterId) ?? STARTERS[0]
    return {
      id: null,
      name: values.formKey,
      description: values.name,
      domain: values.domain ?? '',
      enabled: true,
      fields: starter.fields.map(makeField),
      required,
    }
  }

  const createTemplate = async () => {
    const values = await createForm.validateFields()
    const draft = buildTemplateDraft(values)
    const payload = {
      meta: {
        name: draft.name,
        description: draft.description,
        domain: draft.domain,
        enabled: draft.enabled,
      },
      fields: draft.fields,
    }

    setCreating(true)
    try {
      const response = await RequestUtils.Post(TEMPLATE_SAVE_API, payload)
      const ok = response?.success || response?.errorCode === SUCCESS_CODE
      if (!ok) {
        throw new Error(response?.message || 'Không tạo được form mới.')
      }

      const templateId = response?.data?.id
        ?? response?.data?.templateId
        ?? response?.data?.meta?.id
        ?? response?.id
      const created = normalizeTemplate({
        ...draft,
        id: templateId,
      })

      onSave(mergeAttachedForm(attachedForms, created))
      message.success('Đã tạo và gắn form vào bước.')
      return created
    } finally {
      setCreating(false)
    }
  }

  const handleCreateAndAttach = async () => {
    try {
      await createTemplate()
      closeModal?.()
    } catch (error) {
      message.error(error?.message || 'Không tạo được form mới.')
    }
  }

  const handleCreateAndOpenBuilder = async () => {
    try {
      const values = await createForm.validateFields()
      const template = buildTemplateDraft(values)
      closeModal?.()
      navigate('/workflow-form', {
        state: {
          template,
          fromWorkflowDesigner: true,
        },
      })
    } catch (error) {
      if (error?.errorFields) return
      message.error(error?.message || 'Vui lòng nhập đủ thông tin form.')
    }
  }

  if (view === 'create') {
    const starter = STARTERS.find(item => item.id === starterId) ?? STARTERS[0]
    return (
      <Shell>
        <Header>
          <Title>Tạo form mới</Title>
          <Subtitle>Form template dùng cho KTV điền kết quả tại một bước trong quy trình.</Subtitle>
        </Header>
        <CreateBody>
          <Form form={createForm} layout="vertical" initialValues={{ domain: '', formKey: '', name: '' }}>
            <FieldBlock>
              <Label>Tên form <span style={{ color: '#ef4444' }}>*</span></Label>
              <Form.Item name="name" rules={[{ required: true, message: 'Nhập tên form.' }]} noStyle>
                <Input autoFocus onChange={handleNameChange} placeholder="Form kết quả thử mới" />
              </Form.Item>
            </FieldBlock>

            <FieldBlock>
              <Label>Mã form <span style={{ color: '#ef4444' }}>*</span></Label>
              <Form.Item
                name="formKey"
                rules={[
                  { required: true, message: 'Nhập mã form.' },
                  { pattern: /^[a-z0-9_]+$/, message: 'Chỉ dùng chữ thường, số, dấu _.' },
                ]}
                noStyle
              >
                <Input style={{ fontFamily: 'monospace' }} placeholder="form_ket_qua_thu_moi" />
              </Form.Item>
              <Help>Tự sinh từ tên. Dùng làm <span style={{ fontFamily: 'monospace' }}>form_key</span> trong API. Không đổi sau khi xuất bản.</Help>
            </FieldBlock>

            <FieldBlock>
              <Label>Tiêu chuẩn áp dụng</Label>
              <Form.Item name="domain" noStyle>
                <Select options={STANDARDS} />
              </Form.Item>
              <Help>Hiện trên form và trong audit log để truy nguyên phương pháp thử.</Help>
            </FieldBlock>

            <FieldBlock>
              <Label>Bắt đầu từ</Label>
              <FormGrid>
                {STARTERS.map(item => (
                  <StarterCard
                    key={item.id}
                    type="button"
                    $active={starterId === item.id}
                    onClick={() => setStarterId(item.id)}
                  >
                    <StarterMark $active={starterId === item.id} />
                    <StarterTitle>{item.label}</StarterTitle>
                    <StarterDesc>{item.desc}</StarterDesc>
                    <StarterCount>{item.count} field mẫu</StarterCount>
                  </StarterCard>
                ))}
              </FormGrid>
            </FieldBlock>

            <FieldBlock>
              <Label>Gắn vào bước</Label>
              <Select
                value={`${stepTitle}${stepCodeText ? ` (${stepCodeText})` : ''}`}
                disabled
              />
            </FieldBlock>

            <RequiredBox>
              <div>
                <StarterTitle style={{ marginBottom: 4 }}>Bắt buộc khi rời bước</StarterTitle>
                <StarterDesc>KTV phải điền form trước khi chuyển sang bước tiếp.</StarterDesc>
              </div>
              <Switch checked={required} onChange={setRequired} size="small" />
            </RequiredBox>
          </Form>
        </CreateBody>
        <Footer>
          <FooterHint>
            «Tạo & gắn» lưu ngay vào bước <CodeChip>{stepCodeText || stepTitle}</CodeChip>.
            «Tạo & mở Form Builder» chỉ mở builder, không gọi API.
            {starter.count > 0 ? ` Bắt đầu với ${starter.count} field mẫu.` : ''}
          </FooterHint>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Button size="small" htmlType="button" onClick={() => setView('list')}>Hủy</Button>
            <Button size="small" htmlType="button" loading={creating} onClick={handleCreateAndAttach}>Tạo & gắn</Button>
            <Button size="small" type="primary" htmlType="button" onClick={handleCreateAndOpenBuilder}>
              Tạo & mở Form Builder
            </Button>
          </div>
        </Footer>
      </Shell>
    )
  }

  return (
    <Shell>
      <Header>
        <Title>Gắn form vào bước</Title>
        <Subtitle>
          Bước <strong style={{ color: '#111827' }}>{stepTitle}</strong>{' '}
          {stepCodeText && <CodeChip>{stepCodeText}</CodeChip>}
        </Subtitle>
      </Header>
      <Body>
        <SearchRow>
          <SearchInput
            prefix={<SearchOutlined style={{ color: '#9ca3af', fontSize: 13 }} />}
            placeholder="Tìm form theo tên hoặc form_key..."
            allowClear
            onChange={(event) => setSearch(event.target.value)}
          />
          <CreateLink type="button" onClick={() => setView('create')}>
            <PlusOutlined /> Tạo form mới
          </CreateLink>
        </SearchRow>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}><Spin size="small" /></div>
        ) : templates.length === 0 ? (
          <Empty description="Không có form nào" style={{ margin: '24px 0' }} />
        ) : (
          <FormList>
            {templates.map((template, index) => {
              const selected = String(selectedId) === String(template.id)
              const fieldCount = template.fields?.length ?? 0
              return (
                <FormRow
                  key={`${template.id ?? template.formKey ?? template.name ?? 'form'}-${index}`}
                  type="button"
                  $selected={selected}
                  onClick={() => setSelectedId(template.id)}
                >
                  <RadioCircle $selected={selected} />
                  <div style={{ minWidth: 0 }}>
                    <FormName>{template.name}</FormName>
                    <FormMeta>
                      {template.formKey && <CodeChip>{template.formKey}</CodeChip>}
                      {template.domain && <span>{template.domain}</span>}
                      <span>· Đang dùng ở 1 bước khác</span>
                    </FormMeta>
                  </div>
                  <FieldCount>{fieldCount} field</FieldCount>
                </FormRow>
              )
            })}
          </FormList>
        )}
      </Body>
      <Footer>
        <FooterHint>Chọn 1 form từ danh sách hoặc tạo mới.</FooterHint>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Button size="small" onClick={closeModal}>Hủy</Button>
          <Button
            size="small"
            type="primary"
            disabled={!selectedTemplate}
            onClick={handleAttachSelected}
          >
            Gắn form
          </Button>
        </div>
      </Footer>
    </Shell>
  )
}

export default ModalAttachForm
