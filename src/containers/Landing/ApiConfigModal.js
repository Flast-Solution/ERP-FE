import { useState, useEffect, useRef } from 'react'
import { Button, Tag, Tooltip } from 'antd'
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
} from '@ant-design/icons'
import { useEditorStore } from '@/store/editorStore'
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

const COMPONENTS = [
  { id: 'nav', label: 'Thanh điều hướng' },
  { id: 'hero', label: 'Khối Hero' },
  { id: 'features', label: 'Lưới tính năng' },
  { id: 'pricing', label: 'Bảng giá' },
]

const TABS = [
  { id: 'api', label: 'API', icon: <ApiOutlined />, subtitle: (n) => `Gán nguồn dữ liệu cho từng phần tử · ${n} API` },
  { id: 'seo', label: 'SEO', icon: <SearchOutlined />, subtitle: (n) => `Thẻ meta SEO · ${n} thẻ` },
  { id: 'crumb', label: 'Breadcrumb', icon: <BranchesOutlined />, subtitle: (n) => `Đường dẫn điều hướng · ${n} cấp` },
]

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

/**
 * @typedef {Object} PageApiConfig
 * @property {string} id
 * @property {string} key
 * @property {string} url
 * @property {'GET'|'POST'|'PUT'|'DELETE'} method
 * @property {unknown} body
 * @property {string|null} enpoint
 */

/**
 * @typedef {Object} PageConfigSection
 * @property {string} titles
 * @property {string} tag
 * @property {PageApiConfig[]} apis
 * @property {string[]} urlJsx
 * @property {string|null} urlBuild
 */

/**
 * @typedef {Object} PageSeoConfig
 * @property {string|null} metaCard
 * @property {string|null} seoTitle
 * @property {string|null} seoDescription
 */

/**
 * @typedef {Object} PageBreadcrumb
 * @property {string} page
 * @property {string} url
 */

/**
 * @typedef {Object} PageConfig
 * @property {number} id
 * @property {number} bizId
 * @property {string} name
 * @property {string} slug
 * @property {string} title
 * @property {PageConfigSection[]} configs
 * @property {PageSeoConfig[]} seos
 * @property {PageBreadcrumb[]} breadcrumds
 */

export function ApiConfigModal({ onBuild, config, onReload }) {

  const open = useEditorStore((s) => s.configOpen)
  const setConfigOpen = useEditorStore((s) => s.setConfigOpen)
  const apiConfig = useEditorStore((s) => s.apiConfig)
  const seoConfig = useEditorStore((s) => s.seoConfig)
  const crumbConfig = useEditorStore((s) => s.crumbConfig)
  const jsxConfig = useEditorStore((s) => s.jsxConfig)
  const saveConfig = useEditorStore((s) => s.saveConfig)
  const saveSeo = useEditorStore((s) => s.saveSeo)
  const saveCrumb = useEditorStore((s) => s.saveCrumb)
  const publishConfigPage = useEditorStore((s) => s.publishConfigPage)      // thêm                 // thêm
  const uploadJsxFiles = useEditorStore((s) => s.uploadJsxFiles)

  const [tab, setTab] = useState('api')
  const [draft, setDraft] = useState(apiConfig)
  const [seoDraft, setSeoDraft] = useState(seoConfig)
  const [crumbDraft, setCrumbDraft] = useState(crumbConfig)
  const [codeDraft, setCodeDraft] = useState({})
  const [copiedId, setCopiedId] = useState(null)

  const fileInputs = useRef({})
  /* Đồng bộ draft với cấu hình đã lưu mỗi khi mở modal */
  useEffect(() => {
    if (!open) return
    setDraft(apiConfig)
    setSeoDraft(seoConfig)
    setCrumbDraft(crumbConfig)
    setCodeDraft(jsxConfig)
    setTab('api')
    setCopiedId(null)
  }, [open, apiConfig, seoConfig, crumbConfig, jsxConfig])

  /* Nhận cấu hình fetch từ PreviewCanvas (props) — bind vào form khi có dữ liệu mới */
  useEffect(() => {
    if (!config) return
    setDraft(config.apiConfig)
    setCodeDraft(config.jsxConfig)
    setCrumbDraft(config.crumbConfig)
    setSeoDraft(config.seoConfig)
  }, [config])

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
    navigator.clipboard?.writeText(json).catch(() => { })
    setCopiedId(api.id)
    setTimeout(() => setCopiedId((c) => (c === api.id ? null : c)), 1400)
  }

  /* Code JSX (đầu vào cho Build) */
  const pickCode = (cid) => {
    fileInputs.current[cid]?.click();
  }
  const onCodeFiles = async (cid, e) => {

    // const selected = Array.from(e.target.files || [])
    // const files = selected.map((file) => ({
    //   id: `${uid()}-${file.name}`,
    //   name: file.name,
    // }))

    // if (files.length > 0) {
    //   setCodeDraft((draft) => {
    //     const current = draft[cid] || []
    //     return { ...draft, [cid]: [...current, ...files] }
    //   })
    // }

    // /* Reset để chọn lại đúng file vừa xoá vẫn kích hoạt onChange */
    // e.target.value = ''
    const selected = Array.from(e.target.files || [])
    e.target.value = '' // reset trước để chọn lại đúng file vừa xoá vẫn kích hoạt onChange

    if (selected.length === 0) return

    try {
      const uploaded = await uploadJsxFiles(cid, selected);
      setCodeDraft((draft) => {
        const current = draft[cid] || []
        return { ...draft, [cid]: [...current, ...uploaded] }
      })
    } catch {
      // toast lỗi đã hiển thị trong store
    } finally {
    }
  }

  const removeCode = (cid, fid) => {
    setCodeDraft((draft) => {
      const current = draft[cid] || []
      const next = current.filter((file) => file.id !== fid)
      return { ...draft, [cid]: next }
    })
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

  // const handleSave = () => {
  //   saveConfig(draft)
  //   saveSeo(seoDraft)
  //   saveCrumb(crumbDraft)
  // }

  const handleSave = async () => {
    const cleanedApi = Object.fromEntries(
      Object.entries(draft).map(([cid, apis]) => [
        cid,
        apis.filter((api) => api.key.trim() && api.url.trim()),
      ])
    )
    const cleanedSeo = seoDraft.filter((m) => m.name.trim() && m.value.trim())
    const cleanedCrumb = crumbDraft.filter((c) => c.text.trim() && c.url.trim())

    saveConfig(cleanedApi)
    saveSeo(cleanedSeo)
    saveCrumb(cleanedCrumb)

    try {
      await publishConfigPage()
      await onReload?.()
      setConfigOpen(false)
    } catch {
      // toast lỗi đã có ở store, không đóng modal để user sửa lại
    }
  }

  const total = Object.values(draft || {}).reduce((n, arr) => n + (arr?.length ?? 0), 0)
  const tabCount = { api: total, seo: seoDraft.length, crumb: crumbDraft.length }

  const activeTab = TABS.find((t) => t.id === tab)
  const subtitle = activeTab.subtitle(tabCount[tab])

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
          {COMPONENTS.map((c) => {
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
                          placeholder="key"
                          title="Khóa xác định dữ liệu lấy từ endpoint này"
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
                    onClick={() => onBuild?.(c.id, files)}
                  >
                    Build
                  </Button>

                  <input
                    ref={(el) => { fileInputs.current[c.id] = el }}
                    type="file"
                    accept=".js,.jsx,.ts,.tsx"
                    multiple
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
