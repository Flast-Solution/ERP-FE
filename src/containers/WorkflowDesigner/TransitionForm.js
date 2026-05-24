import React, { useEffect } from 'react'
import {
  Form,
  Input,
  Switch,
  Button,
  Divider,
  Select,
  InputNumber,
  Typography,
} from 'antd'
import {
  DeleteOutlined,
  PlusOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import {
  GUARD_TYPES,
  GUARD_TYPE_OPTIONS,
  ACTION_TYPE_OPTIONS,
  ACTION_TRIGGER_OPTIONS,
} from '@/store/workflowConstants'
import {
  useNodes,
  useUpdateEdgeData,
} from '@/hooks/useWorkflowStore'
import { GuardCard, ActionCard, SectionLabel } from './styles'
import styled from 'styled-components'

const { Text } = Typography
const { TextArea } = Input

// ─── Styled ───────────────────────────────────────────────────────────────────

const StepInfoCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;
`

const StepBox = styled.div`
  flex: 1;
  min-width: 0;
`

const StepBoxLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
`

const StepBoxName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const StepBoxCode = styled.div`
  font-size: 10px;
  font-family: monospace;
  color: #8c8c8c;
  margin-top: 1px;
`

const GuardsEmpty = styled.div`
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;
  color: #8c8c8c;
  font-size: 12px;
  margin-bottom: 12px;

  .link {
    color: #1677ff;
    cursor: pointer;
    margin-top: 4px;
    display: block;

    &:hover {
      text-decoration: underline;
    }
  }
`

// ─── Dynamic config fields ────────────────────────────────────────────────────

const ConfigFields = ({ fields = [], namePrefix }) =>
  fields.map((f) => {
    const name = [...namePrefix, f.name]
    const rules = f.required ? [{ required: true, message: `Nhập ${f.label}` }] : []

    if (f.type === 'textarea')
      return (
        <Form.Item key={f.name} name={name} label={f.label} rules={rules}>
          <TextArea rows={2} />
        </Form.Item>
      )

    if (f.type === 'number')
      return (
        <Form.Item key={f.name} name={name} label={f.label} rules={rules}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
      )

    if (f.type === 'select')
      return (
        <Form.Item key={f.name} name={name} label={f.label} rules={rules}>
          <Select options={f.options} />
        </Form.Item>
      )

    return (
      <Form.Item key={f.name} name={name} label={f.label} rules={rules}>
        <Input />
      </Form.Item>
    )
  })

// ─── TransitionForm ───────────────────────────────────────────────────────────

const TransitionForm = ({ edge }) => {
  const [form] = Form.useForm()
  const nodes = useNodes()
  const updateEdgeData = useUpdateEdgeData()

  // Tìm tên step từ / đến
  const fromNode = nodes.find((n) => n.id === edge.source)
  const toNode = nodes.find((n) => n.id === edge.target)

  useEffect(() => {
    form.setFieldsValue({
      label: edge.data?.label ?? '',
      allowed_roles: edge.data?.allowed_roles ?? [],
      require_note: edge.data?.require_note ?? false,
      guards: edge.data?.guards ?? [],
      actions: edge.data?.actions ?? [],
    })
  }, [edge.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync store real-time mỗi khi form thay đổi
  const handleValuesChange = (_, allValues) => {
    updateEdgeData(edge.id, allValues)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      size="small"
      onValuesChange={handleValuesChange}
    >

      {/* ── Từ bước → Đến bước ── */}
      <SectionLabel>Transition</SectionLabel>

      <StepInfoCard>
        <StepBox>
          <StepBoxLabel>Từ bước</StepBoxLabel>
          <StepBoxName>{fromNode?.data?.label ?? edge.source}</StepBoxName>
          <StepBoxCode>{fromNode?.data?.code ?? ''}</StepBoxCode>
        </StepBox>

        <ArrowRightOutlined style={{ color: '#8c8c8c', flexShrink: 0 }} />

        <StepBox>
          <StepBoxLabel>Đến bước</StepBoxLabel>
          <StepBoxName>{toNode?.data?.label ?? edge.target}</StepBoxName>
          <StepBoxCode>{toNode?.data?.code ?? ''}</StepBoxCode>
        </StepBox>
      </StepInfoCard>

      {/* ── Vai trò được phép ── */}
      <Form.Item name="allowed_roles" label="Vai trò được phép">
        <Select
          mode="tags"
          placeholder="+ Thêm"
          style={{ width: '100%' }}
          tokenSeparators={[',']}
          open={false} // tags mode — gõ tự do, không dropdown
        />
      </Form.Item>

      {/* ── Bắt buộc ghi chú ── */}
      <Form.Item
        name="require_note"
        label="Bắt buộc ghi chú"
        valuePropName="checked"
        style={{ marginBottom: 8 }}
      >
        <Switch size="small" />
      </Form.Item>

      <Divider style={{ margin: '8px 0 12px' }} />

      {/* ── Guards ── */}
      <Form.List name="guards">
        {(fields, { add, remove }) => (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <SectionLabel style={{ margin: 0 }}>
                Guards {fields.length > 0 && <span style={{ color: '#1677ff' }}>{fields.length}</span>}
              </SectionLabel>
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                style={{ padding: 0, fontSize: 12 }}
                onClick={() => add({ type: 'form_field', config: {} })}
              >
                Thêm guard
              </Button>
            </div>

            {fields.length === 0 ? (
              <GuardsEmpty>
                <div>Không có guard. Transition luôn cho phép chuyển bước.</div>
                <span
                  className="link"
                  onClick={() => add({ type: 'form_field', config: {} })}
                >
                  Thêm guard...
                </span>
              </GuardsEmpty>
            ) : (
              fields.map(({ key, name: listName, ...restField }) => {
                const guardType = form.getFieldValue(['guards', listName, 'type'])
                const configFields = GUARD_TYPES[guardType]?.configFields ?? []

                return (
                  <GuardCard key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: 600, color: '#d46b08' }}>
                        Guard #{listName + 1}
                      </Text>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(listName)}
                      />
                    </div>

                    <Form.Item
                      {...restField}
                      name={[listName, 'type']}
                      label="Loại guard"
                    >
                      <Select
                        options={GUARD_TYPE_OPTIONS}
                        onChange={() => {
                          const guards = form.getFieldValue('guards')
                          guards[listName].config = {}
                          form.setFieldValue('guards', guards)
                        }}
                      />
                    </Form.Item>

                    <ConfigFields
                      fields={configFields}
                      namePrefix={[listName, 'config']}
                    />
                  </GuardCard>
                )
              })
            )}
          </>
        )}
      </Form.List>

      <Divider style={{ margin: '4px 0 12px' }} />

      {/* ── Actions ── */}
      <Form.List name="actions">
        {(fields, { add, remove }) => (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <SectionLabel style={{ margin: 0 }}>
                Actions {fields.length > 0 && <span style={{ color: '#1677ff' }}>{fields.length}</span>}
              </SectionLabel>
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                style={{ padding: 0, fontSize: 12 }}
                onClick={() => add({ type: 'send_email', trigger: 'on_enter', config: {} })}
              >
                Thêm action
              </Button>
            </div>

            {fields.map(({ key, name: listName, ...restField }) => (
              <ActionCard key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: 600, color: '#389e0d' }}>
                    Action #{listName + 1}
                  </Text>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(listName)}
                  />
                </div>

                <Form.Item {...restField} name={[listName, 'type']} label="Loại action">
                  <Select options={ACTION_TYPE_OPTIONS} />
                </Form.Item>

                <Form.Item {...restField} name={[listName, 'trigger']} label="Trigger">
                  <Select options={ACTION_TRIGGER_OPTIONS} />
                </Form.Item>
              </ActionCard>
            ))}
          </>
        )}
      </Form.List>

    </Form>
  )
}

export default TransitionForm