import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Alert, Button, Checkbox, Input, InputNumber, message, Popconfirm,
  Select, Space, Switch, Tabs, Tag,
} from 'antd'
import {
  ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EyeOutlined,
  PlusOutlined, SaveOutlined,
} from '@ant-design/icons'
import {
  getLandingPage,
  saveWebPage,
  WEB_CONTENT_TYPES,
} from './landingRepository'
import {
  createRemoteComponent,
  createRemoteDrawer,
  DATA_SOURCE_TYPES,
  normalizeMicroFrontendConfig,
  validateMicroFrontendConfig,
} from './microFrontendSchema'
import {
  DataStatus, EditorGrid, EditorHeader, EditorShell, EmptyBox, FieldLabel,
  FormGrid, Panel, RemoteBody, RemoteCard, RemoteHead,
} from './MicroFrontendEditor.style'

const JsonField = ({ label, value, onChange, rows = 5 }) => {
  const serializedValue = JSON.stringify(value ?? {}, null, 2)
  const [text, setText] = useState(serializedValue)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => setText(serializedValue), [serializedValue])

  const applyValue = () => {
    try {
      onChange(JSON.parse(text || '{}'))
      setInvalid(false)
    } catch {
      setInvalid(true)
      message.error(`${label} không phải JSON hợp lệ.`)
    }
  }

  return (
    <div className="span-2">
      <FieldLabel>{label}</FieldLabel>
      <Input.TextArea
        rows={rows}
        status={invalid ? 'error' : undefined}
        value={text}
        onChange={event => {
          setText(event.target.value)
          setInvalid(false)
        }}
        onBlur={applyValue}
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
    </div>
  )
}

const RemoteConfigCard = ({ item, index, total, onChange, onDelete, onMove }) => {
  const update = patch => onChange({ ...item, ...patch })
  const updateRemote = patch => update({ remote: { ...item.remote, ...patch } })
  const updateDataSource = patch => update({ dataSource: { ...item.dataSource, ...patch } })

  const tabItems = [
    {
      key: 'component',
      label: 'Component',
      children: (
        <FormGrid>
          <div>
            <FieldLabel>Tên hiển thị</FieldLabel>
            <Input value={item.name} onChange={event => update({ name: event.target.value })} />
          </div>
          <div>
            <FieldLabel>Key dữ liệu</FieldLabel>
            <Input value={item.key} onChange={event => update({ key: event.target.value })} />
          </div>
          <div className="span-2">
            <FieldLabel>Remote Entry URL</FieldLabel>
            <Input placeholder="https://.../remoteEntry.js" value={item.remote?.url} onChange={event => updateRemote({ url: event.target.value })} />
          </div>
          <div>
            <FieldLabel>Scope</FieldLabel>
            <Input placeholder="product_app" value={item.remote?.scope} onChange={event => updateRemote({ scope: event.target.value })} />
          </div>
          <div>
            <FieldLabel>Module</FieldLabel>
            <Input placeholder="./MPage" value={item.remote?.module} onChange={event => updateRemote({ module: event.target.value })} />
          </div>
        </FormGrid>
      ),
    },
    {
      key: 'data',
      label: 'Nguồn dữ liệu',
      children: (
        <FormGrid>
          <div>
            <FieldLabel>Loại nguồn</FieldLabel>
            <Select
              style={{ width: '100%' }}
              value={item.dataSource?.type}
              options={[
                { value: DATA_SOURCE_TYPES.NONE, label: 'Không có nguồn dữ liệu' },
                { value: DATA_SOURCE_TYPES.API, label: 'API' },
                { value: DATA_SOURCE_TYPES.STATIC, label: 'Dữ liệu tĩnh' },
              ]}
              onChange={value => updateDataSource({ type: value })}
            />
          </div>
          {item.dataSource?.type === DATA_SOURCE_TYPES.API && <>
            <div>
              <FieldLabel>Method</FieldLabel>
              <Select style={{ width: '100%' }} value={item.dataSource?.method} options={['GET', 'POST'].map(value => ({ value, label: value }))} onChange={method => updateDataSource({ method })} />
            </div>
            <div className="span-2">
              <FieldLabel>Endpoint</FieldLabel>
              <Input placeholder="/api/erp/product/fetch" value={item.dataSource?.endpoint} onChange={event => updateDataSource({ endpoint: event.target.value })} />
            </div>
            <div>
              <FieldLabel>Response path</FieldLabel>
              <Input placeholder="data.embedded" value={item.dataSource?.responsePath} onChange={event => updateDataSource({ responsePath: event.target.value })} />
            </div>
            <div>
              <FieldLabel>Tên prop</FieldLabel>
              <Input placeholder="products" value={item.dataSource?.propName} onChange={event => updateDataSource({ propName: event.target.value })} />
            </div>
            <JsonField label="Tham số request (JSON)" value={item.dataSource?.params} onChange={params => updateDataSource({ params })} />
          </>}
          {item.dataSource?.type === DATA_SOURCE_TYPES.STATIC && (
            <JsonField label="Dữ liệu tĩnh (JSON)" value={item.dataSource?.staticData} onChange={staticData => updateDataSource({ staticData })} rows={8} />
          )}
        </FormGrid>
      ),
    },
    {
      key: 'props',
      label: 'Props tĩnh',
      children: <FormGrid><JsonField label="Props truyền trực tiếp vào component" value={item.props} onChange={props => update({ props })} rows={10} /></FormGrid>,
    },
  ]

  return (
    <RemoteCard>
      <RemoteHead>
        <Space>
          <Switch size="small" checked={item.enabled !== false} onChange={enabled => update({ enabled })} />
          <strong>{index + 1}. {item.name || 'Component chưa đặt tên'}</strong>
          <Tag>{item.dataSource?.type || 'NONE'}</Tag>
        </Space>
        <Space>
          <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => onMove(index, index - 1)} />
          <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={index === total - 1} onClick={() => onMove(index, index + 1)} />
          <Popconfirm title="Xóa component này?" onConfirm={onDelete}>
            <Button danger type="text" size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      </RemoteHead>
      <RemoteBody><Tabs size="small" items={tabItems} /></RemoteBody>
    </RemoteCard>
  )
}

const ComponentListEditor = ({ value, onChange }) => {
  const components = Array.isArray(value) ? value : []
  const updateAt = (index, nextItem) => onChange(components.map((item, itemIndex) => itemIndex === index ? nextItem : item))
  const move = (from, to) => {
    const next = [...components]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next.map((entry, index) => ({ ...entry, order: index + 1 })))
  }

  return <>
    {!components.length && <EmptyBox>Chưa có component. Thêm component để bắt đầu cấu hình trang.</EmptyBox>}
    {components.map((item, index) => (
      <RemoteConfigCard
        key={`${item.key}-${index}`}
        item={item}
        index={index}
        total={components.length}
        onChange={nextItem => updateAt(index, nextItem)}
        onDelete={() => onChange(components.filter((_, itemIndex) => itemIndex !== index))}
        onMove={move}
      />
    ))}
    <Button block type="dashed" icon={<PlusOutlined />} onClick={() => onChange([...components, { ...createRemoteComponent(), order: components.length + 1 }])}>
      Thêm component
    </Button>
  </>
}

export const MicroFrontendEditor = ({ pageId }) => {
  const navigate = useNavigate()
  const [page, setPage] = useState(null)
  const [activeTab, setActiveTab] = useState('main')

  useEffect(() => {
    const current = getLandingPage(pageId)
    if (!current) return
    setPage({ ...current, mfeConfig: normalizeMicroFrontendConfig(current.mfeConfig) })
  }, [pageId])

  const config = page?.mfeConfig ?? normalizeMicroFrontendConfig()
  const errors = useMemo(() => validateMicroFrontendConfig(config), [config])
  const updateConfig = patch => setPage(current => ({ ...current, mfeConfig: { ...current.mfeConfig, ...patch } }))
  const updateDrawer = (index, values) => updateConfig({
    drawers: config.drawers.map((drawer, drawerIndex) => drawerIndex === index ? { ...drawer, ...values } : drawer),
  })

  const save = status => {
    if (!page?.name?.trim()) return message.error('Vui lòng nhập tên trang.')
    if (status === 'PUBLISHED' && errors.length) return message.error(errors[0])
    const saved = saveWebPage({ ...page, contentType: WEB_CONTENT_TYPES.MICRO_FRONTEND, status })
    setPage(saved)
    message.success(status === 'PUBLISHED' ? 'Đã xuất bản trang.' : 'Đã lưu cấu hình trang.')
  }

  if (!page) return <EditorShell><Alert type="error" message="Không tìm thấy cấu hình trang." /></EditorShell>

  const tabItems = [
    {
      key: 'main',
      label: `Trang chính (${config.components.length})`,
      children: <ComponentListEditor value={config.components} onChange={components => updateConfig({ components })} />,
    },
    ...config.drawers.map((drawer, index) => ({
      key: `drawer-${index}`,
      label: drawer.title || `Drawer ${index + 1}`,
      children: <>
        <FormGrid style={{ marginBottom: 16 }}>
          <div><FieldLabel>Hash ID</FieldLabel><Input addonBefore="#" value={drawer.hashId} onChange={event => updateDrawer(index, { hashId: event.target.value.replace(/^#/, '') })} /></div>
          <div><FieldLabel>Tiêu đề drawer</FieldLabel><Input value={drawer.title} onChange={event => updateDrawer(index, { title: event.target.value })} /></div>
          <div><FieldLabel>Chiều rộng</FieldLabel><InputNumber min={320} max={1600} addonAfter="px" value={drawer.width} onChange={width => updateDrawer(index, { width })} /></div>
          <div style={{ alignSelf: 'end' }}><Popconfirm title="Xóa drawer này?" onConfirm={() => updateConfig({ drawers: config.drawers.filter((_, drawerIndex) => drawerIndex !== index) })}><Button danger icon={<DeleteOutlined />}>Xóa drawer</Button></Popconfirm></div>
        </FormGrid>
        <ComponentListEditor value={drawer.components} onChange={components => updateDrawer(index, { components })} />
      </>,
    })),
  ]

  return (
    <EditorShell>
      <EditorHeader>
        <div>
          <Button type="link" style={{ padding: 0 }} onClick={() => navigate('/landing')}>← Quản lý trang</Button>
          <h1>Cấu hình trang Micro Frontend</h1>
          <p>Mỗi component nhận dữ liệu đã được host xử lý trước khi render.</p>
        </div>
        <Space wrap>
          <Button icon={<EyeOutlined />} onClick={() => window.open(`/m/${page.id}`, '_blank')}>Xem trước</Button>
          <Button icon={<SaveOutlined />} onClick={() => save('DRAFT')}>Lưu cấu hình</Button>
          <Button type="primary" onClick={() => save('PUBLISHED')}>Xuất bản</Button>
        </Space>
      </EditorHeader>

      <EditorGrid>
        <Panel>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong>Thành phần trang</strong>
            <Button icon={<PlusOutlined />} onClick={() => {
              const drawer = createRemoteDrawer()
              updateConfig({ drawers: [...config.drawers, drawer] })
              setActiveTab(`drawer-${config.drawers.length}`)
            }}>Thêm drawer</Button>
          </Space>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        </Panel>

        <div>
          <Panel style={{ marginBottom: 16 }}>
            <strong>Thông tin trang</strong>
            <div style={{ marginTop: 14 }}><FieldLabel>Tên trang</FieldLabel><Input value={page.name} onChange={event => setPage(current => ({ ...current, name: event.target.value }))} /></div>
            <div style={{ marginTop: 12 }}><FieldLabel>Đường dẫn</FieldLabel><Input value={`/m/${page.id}`} disabled /></div>
            <div style={{ marginTop: 12 }}><Checkbox checked={page.authenticationRequired} onChange={event => setPage(current => ({ ...current, authenticationRequired: event.target.checked }))}>Yêu cầu đăng nhập</Checkbox></div>
            <div style={{ marginTop: 12 }}><FieldLabel>Trạng thái</FieldLabel><Tag color={page.status === 'PUBLISHED' ? 'green' : 'gold'}>{page.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}</Tag></div>
          </Panel>
          <Panel>
            <strong>Dữ liệu trang</strong>
            <p style={{ color: '#7b8799', fontSize: 12 }}>Dữ liệu API/static được gom vào DataContext và đồng thời truyền vào prop đã cấu hình.</p>
            {[...config.components, ...config.drawers.flatMap(drawer => drawer.components)].map(item => (
              <DataStatus key={item.key}><span>{item.key}</span><Tag>{item.dataSource?.type || 'NONE'}</Tag></DataStatus>
            ))}
            {!config.components.length && !config.drawers.length && <span style={{ color: '#9aa4b4' }}>Chưa có nguồn dữ liệu.</span>}
          </Panel>
          {!!errors.length && <Alert style={{ marginTop: 16 }} type="warning" showIcon message={`${errors.length} cấu hình chưa hoàn tất`} description={errors[0]} />}
        </div>
      </EditorGrid>
    </EditorShell>
  )
}

export const MicroFrontendEditorRoute = () => {
  const { search } = useLocation()
  return <MicroFrontendEditor pageId={new URLSearchParams(search).get('id')} />
}
