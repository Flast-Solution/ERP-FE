import { useState, useEffect, useMemo, useRef } from 'react'
import { Button, Dropdown, Tag, Tooltip, message } from 'antd'
import {
  SettingOutlined,
  DeleteOutlined,
  PlusOutlined,
  CopyOutlined,
  CheckOutlined,
  ApiOutlined,
  SearchOutlined,
  CodeOutlined,
  FileOutlined,
  CloseOutlined,
  BuildOutlined,
  BranchesOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons'
import { useEditorStore } from '@/store/editorStore'
import useChatStore from '@/containers/AIChatbot/useChatStore'
import { LANDING_BLOCKS } from './blockRegistry'
import { compileCustomJsx, createCustomDefinitionId, validateCustomJsxSource } from './customJsx'
import { Dialog } from './Dialog'
import { IconButton } from './IconButton'
import {
  Tabs,
  Tab,
  TabCount,
  ApiCfg,
  ApiSec,
  ApiSecHead,
  ApiSecLabel,
  ApiSecCount,
  ApiList,
  ApiRow,
  KeyInput,
  MethodWrap,
  UrlInput,
  EmptyNote,
  Actions,
  FileChips,
  FileChip,
  FileChipX,
  SeoCfg,
  SeoHead,
  SeoCol,
  SeoList,
  SeoRow,
  SeoInput,
  SeoNameInput,
} from './ApiConfigModal.style'

const METHODS = ['GET', 'POST', 'PUT', 'DELETE']
const METHOD_COLOR = { GET: '#34d399', POST: '#60a5fa', PUT: '#fbbf24', DELETE: '#f87171' }
const META_PRESETS = ['title', 'description', 'keywords', 'og:title', 'og:description', 'og:image', 'twitter:card', 'robots', 'canonical']

const TABS = [
  { id: 'api', label: 'API', icon: <ApiOutlined />, subtitle: (n) => `Gán nguồn dữ liệu cho từng phần tử · ${n} API` },
  { id: 'seo', label: 'SEO', icon: <SearchOutlined />, subtitle: (n) => `Thẻ meta SEO · ${n} thẻ` },
  { id: 'crumb', label: 'Breadcrumb', icon: <BranchesOutlined />, subtitle: (n) => `Đường dẫn điều hướng · ${n} cấp` },
]

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

export function ApiConfigModal() {

  const open = useEditorStore((s) => s.configOpen)
  const setConfigOpen = useEditorStore((s) => s.setConfigOpen)
  const apiConfig = useEditorStore((s) => s.apiConfig)
  const seoConfig = useEditorStore((s) => s.seoConfig)
  const crumbConfig = useEditorStore((s) => s.crumbConfig)
  const sections = useEditorStore((s) => s.draftSchema?.sections ?? [])
  const saveConfig = useEditorStore((s) => s.saveConfig)
  const saveSeo = useEditorStore((s) => s.saveSeo)
  const saveCrumb = useEditorStore((s) => s.saveCrumb)
  const selected = useEditorStore((s) => s.selected)
  const addBlock = useEditorStore((s) => s.addBlock)
  const openCustomJsx = useEditorStore((s) => s.openCustomJsx)
  const replaceBlockWithCustom = useEditorStore((s) => s.replaceBlockWithCustom)

  const [tab, setTab] = useState('api')
  const [draft, setDraft] = useState(apiConfig)
  const [seoDraft, setSeoDraft] = useState(seoConfig)
  const [crumbDraft, setCrumbDraft] = useState(crumbConfig)
  const [codeDraft, setCodeDraft] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [buildingId, setBuildingId] = useState(null)
  const components = useMemo(() => sections.map((section, index) => {
    const definition = LANDING_BLOCKS.find(block => block.type === section.type)
    return {
      id: section.id,
      label: `${index + 1}. ${definition?.label || section.type}`,
    }
  }), [sections])

  const fileInputs = useRef({})
  
  /* Đồng bộ draft với cấu hình đã lưu mỗi khi mở modal */
  useEffect(() => {
    if (!open) return
    setDraft(apiConfig)
    setSeoDraft(seoConfig)
    setCrumbDraft(crumbConfig)
    setCodeDraft({})
    setTab('api')
    setCopiedId(null)
    setBuildingId(null)
  }, [open, apiConfig, seoConfig, crumbConfig])

  /* API */
  const addApi = (componentId) => {
    const api = { id: uid(), key: '', method: 'GET', url: '' }
    setDraft((draft) => {
      const current = draft[componentId] || []
      return { ...draft, [componentId]: [...current, api] }
    })
  }

  const updateApi = (componentId, apiId, patch) => {
    setDraft((draft) => {
      const next = draft[componentId].map((api) =>
        api.id === apiId ? { ...api, ...patch } : api
      )
      return { ...draft, [componentId]: next }
    })
  }

  const removeApi = (componentId, apiId) => {
    setDraft((draft) => {
      const next = draft[componentId].filter((api) => api.id !== apiId)
      return { ...draft, [componentId]: next }
    })
  }

  const copyApi = (api) => {
    const json = JSON.stringify({ key: api.key, method: api.method, url: api.url }, null, 2)
    navigator.clipboard?.writeText(json).catch(() => {})
    setCopiedId(api.id)
    setTimeout(() => setCopiedId((c) => (c === api.id ? null : c)), 1400)
  }

  /* Code JSX (đầu vào cho Build) */
  const pickCode = (cid) => fileInputs.current[cid]?.click()
  const onCodeFiles = async (cid, e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 256 * 1024) {
      message.error('File JSX không được vượt quá 256KB.')
      return
    }
    try {
      const source = await file.text()
      setCodeDraft((draft) => ({
        ...draft,
        [cid]: [{ id: `${uid()}-${file.name}`, name: file.name, source }],
      }))
    } catch (_) {
      message.error('Không đọc được nội dung file JSX.')
    }
  }

  const removeCode = (cid, fid) => {
    setCodeDraft((draft) => {
      const current = draft[cid] || []
      const next = current.filter((file) => file.id !== fid)
      return { ...draft, [cid]: next }
    })
  }

  const buildAndReplace = async (componentId, files) => {
    const sourceFile = files?.[0]
    if (!sourceFile?.source) {
      message.error('Hãy tải một file JSX trước khi build.')
      return
    }
    const sources = draft[componentId] || []
    if (sources.some(source => !String(source.key || '').trim() || !String(source.url || '').trim())) {
      message.error('Mỗi API phải có key và URL trước khi build.')
      return
    }
    const keys = sources.map(source => String(source.key).trim())
    if (new Set(keys).size !== keys.length) {
      message.error('Key API trong cùng một block không được trùng nhau.')
      return
    }
    const errors = validateCustomJsxSource(sourceFile.source)
    if (errors.length) {
      message.error(errors[0])
      return
    }

    const name = sourceFile.name.replace(/\.(?:jsx?|tsx?)$/i, '') || 'Custom JSX block'
    setBuildingId(componentId)
    try {
      const definitionId = createCustomDefinitionId(name)
      const artifact = await compileCustomJsx({
        name,
        source: sourceFile.source,
        definitionId,
        sessionId: useChatStore.getState().getSessionId('form_builder'),
      })
      // Build ngay trong modal cũng phải commit API đang nhập. Nếu không, modal
      // đóng sau khi thay block và cấu hình draft sẽ bị mất.
      saveConfig(draft)
      replaceBlockWithCustom(componentId, {
        name,
        source: sourceFile.source,
        definitionId,
        artifact,
      })
      setCodeDraft((current) => ({ ...current, [componentId]: [] }))
      setConfigOpen(false)
      message.success('Đã build và thay thế block bằng JSX mới.')
    } catch (error) {
      message.error(error?.message || 'Build JSX thất bại.')
    } finally {
      setBuildingId(null)
    }
  }

  /* SEO */
  const addMeta = () => {
    const meta = { id: uid(), name: '', value: '' }
    setSeoDraft((list) => [...list, meta])
  }

  const updateMeta = (id, patch) => {
    setSeoDraft((list) =>
      list.map((meta) => (meta.id === id ? { ...meta, ...patch } : meta))
    )
  }

  const removeMeta = (id) => {
    setSeoDraft((list) => list.filter((meta) => meta.id !== id))
  }

  /* Breadcrumb */
  const addCrumb = () => {
    const crumb = { id: uid(), text: '', url: '' }
    setCrumbDraft((list) => [...list, crumb])
  }

  const updateCrumb = (id, patch) => {
    setCrumbDraft((list) =>
      list.map((crumb) => (crumb.id === id ? { ...crumb, ...patch } : crumb))
    )
  }

  const removeCrumb = (id) => {
    setCrumbDraft((list) => list.filter((crumb) => crumb.id !== id))
  }

  const handleSave = () => {
    saveConfig(draft)
    saveSeo(seoDraft)
    saveCrumb(crumbDraft)
  }

  const total = Object.values(draft || {}).reduce((n, arr) => n + (arr?.length ?? 0), 0)
  const tabCount = { api: total, seo: seoDraft.length, crumb: crumbDraft.length }

  const activeTab = TABS.find((t) => t.id === tab)
  const subtitle = activeTab.subtitle(tabCount[tab])
  const blockMenu = {
    items: LANDING_BLOCKS.map(block => ({
      key: block.type,
      label: `${block.icon || '□'}  ${block.label}`,
    })),
    onClick: ({ key }) => {
      const definition = LANDING_BLOCKS.find(block => block.type === key)
      if (definition?.custom) {
        setConfigOpen(false)
        openCustomJsx({ target: 'block' })
        return
      }
      addBlock(key, selected)
    },
  }

  return (
    <Dialog
      open={open}
      onClose={() => setConfigOpen(false)}
      icon={<SettingOutlined />}
      title="Cấu hình trang"
      subtitle={subtitle}
      size="lg"
      footer={
        <>
          <Button onClick={() => setConfigOpen(false)}>Huỷ</Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={handleSave}>
            Lưu cấu hình
          </Button>
        </>
      }
    >
      <Tabs role="tablist">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <Tab
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              $active={active}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label} <TabCount $active={active}>{tabCount[t.id]}</TabCount>
            </Tab>
          )
        })}
      </Tabs>

      {/* API */}
      {tab === 'api' && (
        <ApiCfg>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <EmptyNote style={{ padding: 0 }}>
              Thêm block trước, sau đó gán một hoặc nhiều API cho block đó.
            </EmptyNote>
            <Dropdown menu={blockMenu} trigger={['click']} placement="bottomRight">
              <Button type="primary" size="small" icon={<AppstoreAddOutlined />}>
                Thêm block
              </Button>
            </Dropdown>
          </div>
          {components.length === 0 && (
            <div style={{ padding: '28px 16px', border: '1px dashed #d9d9e3', borderRadius: 10, textAlign: 'center' }}>
              <EmptyNote style={{ marginBottom: 10 }}>
                Trang chưa có block. Nhấn “Thêm block” để bắt đầu cấu hình.
              </EmptyNote>
              <Dropdown menu={blockMenu} trigger={['click']}>
                <Button icon={<PlusOutlined />}>Chọn block đầu tiên</Button>
              </Dropdown>
            </div>
          )}
          {components.map((c) => {
            const list = draft[c.id] || []
            const files = codeDraft[c.id] || []
            return (
              <ApiSec key={c.id}>
                <ApiSecHead>
                  <Tag color="purple">#{c.id}</Tag>
                  <ApiSecLabel>{c.label}</ApiSecLabel>
                  <ApiSecCount>{list.length} API</ApiSecCount>
                </ApiSecHead>

                {list.length > 0 ? (
                  <ApiList>
                    {list.map((api) => (
                      <ApiRow key={api.id}>
                        <KeyInput
                          value={api.key || ''}
                          placeholder="vd: menuItems"
                          title="JSX nhận kết quả tại data[key], ví dụ data.menuItems"
                          onChange={(e) => updateApi(c.id, api.id, { key: e.target.value })}
                        />
                        <MethodWrap $color={METHOD_COLOR[api.method]}>
                          <select
                            value={api.method}
                            onChange={(e) => updateApi(c.id, api.id, { method: e.target.value })}
                          >
                            {METHODS.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </MethodWrap>
                        <UrlInput
                          value={api.url}
                          placeholder="https://api.example.com/endpoint"
                          onChange={(e) => updateApi(c.id, api.id, { url: e.target.value })}
                        />
                        <Tooltip title="Sao chép định nghĩa API">
                          <IconButton
                            aria-label="Sao chép định nghĩa API"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyApi(api)}
                            icon={copiedId === api.id ? <CheckOutlined /> : <CopyOutlined />}
                          />
                        </Tooltip>
                        <IconButton
                          aria-label="Xoá API"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeApi(c.id, api.id)}
                          icon={<DeleteOutlined />}
                        />
                      </ApiRow>
                    ))}
                  </ApiList>
                ) : (
                  <EmptyNote>Chưa có API — phần tử này dùng dữ liệu tĩnh.</EmptyNote>
                )}

                {files.length > 0 && (
                  <FileChips>
                    {files.map((f) => (
                      <FileChip key={f.id} title={f.name}>
                        <FileOutlined />
                        <span>{f.name}</span>
                        <FileChipX
                          type="button"
                          aria-label={`Xoá ${f.name}`}
                          onClick={() => removeCode(c.id, f.id)}
                        >
                          <CloseOutlined style={{ fontSize: 9 }} />
                        </FileChipX>
                      </FileChip>
                    ))}
                  </FileChips>
                )}

                <Actions>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => addApi(c.id)}>
                    Thêm API
                  </Button>
                  <Button size="small" icon={<CodeOutlined />} onClick={() => pickCode(c.id)}>
                    Tải code JSX
                  </Button>
                  <Button
                    size="small"
                    color="danger"
                    variant="solid"
                    icon={<BuildOutlined />}
                    disabled={files.length === 0}
                    loading={buildingId === c.id}
                    onClick={() => buildAndReplace(c.id, files)}
                  >
                    Build
                  </Button>

                  <input
                    ref={(el) => { fileInputs.current[c.id] = el }}
                    type="file"
                    accept=".js,.jsx,.ts,.tsx"
                    style={{ display: 'none' }}
                    onChange={(e) => onCodeFiles(c.id, e)}
                  />
                </Actions>
              </ApiSec>
            )
          })}
        </ApiCfg>
      )}

      {/* SEO */}
      {tab === 'seo' && (
        <SeoCfg>
          <SeoHead>
            <SeoCol>Thẻ meta</SeoCol>
            <SeoCol>Giá trị</SeoCol>
            <span />
          </SeoHead>
          {seoDraft.length > 0 ? (
            <SeoList>
              {seoDraft.map((m) => (
                <SeoRow key={m.id}>
                  <SeoNameInput
                    list="seo-meta-presets"
                    value={m.name}
                    placeholder="ví dụ: description"
                    onChange={(e) => updateMeta(m.id, { name: e.target.value })}
                  />
                  <SeoInput
                    value={m.value}
                    placeholder="Giá trị thẻ meta"
                    onChange={(e) => updateMeta(m.id, { value: e.target.value })}
                  />
                  <IconButton aria-label="Xoá thẻ" variant="ghost" size="sm" icon={<DeleteOutlined />} onClick={() => removeMeta(m.id)} />
                </SeoRow>
              ))}
            </SeoList>
          ) : (
            <EmptyNote>Chưa có thẻ meta nào.</EmptyNote>
          )}
          <Button size="small" icon={<PlusOutlined />} onClick={addMeta}>Thêm thẻ meta</Button>
          <datalist id="seo-meta-presets">
            {META_PRESETS.map((p) => <option key={p} value={p} />)}
          </datalist>
        </SeoCfg>
      )}

      {/* Breadcrumb */}
      {tab === 'crumb' && (
        <SeoCfg>
          <SeoHead>
            <SeoCol>Văn bản</SeoCol>
            <SeoCol>Đường dẫn (URL)</SeoCol>
            <span />
          </SeoHead>
          {crumbDraft.length > 0 ? (
            <SeoList>
              {crumbDraft.map((m) => (
                <SeoRow key={m.id}>
                  <SeoInput
                    value={m.text}
                    placeholder="ví dụ: Trang chủ"
                    onChange={(e) => updateCrumb(m.id, { text: e.target.value })}
                  />
                  <SeoNameInput
                    value={m.url}
                    placeholder="/duong-dan"
                    onChange={(e) => updateCrumb(m.id, { url: e.target.value })}
                  />
                  <IconButton aria-label="Xoá cấp" variant="ghost" size="sm" icon={<DeleteOutlined />} onClick={() => removeCrumb(m.id)} />
                </SeoRow>
              ))}
            </SeoList>
          ) : (
            <EmptyNote>Chưa có cấp điều hướng nào.</EmptyNote>
          )}
          <Button size="small" icon={<PlusOutlined />} onClick={addCrumb}>Thêm cấp</Button>
        </SeoCfg>
      )}
    </Dialog>
  )
}
