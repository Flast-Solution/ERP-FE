import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Drawer, Empty, Skeleton, Spin } from 'antd'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { getTokenPayload } from '@/utils/authUtils'
import { loadRemoteFromUrl } from '@/utils/loadRemote'
import { useEditorStore } from '@/store/editorStore'
import { PreviewCanvas } from './PreviewCanvas'
import { getLandingPage, WEB_CONTENT_TYPES } from './landingRepository'
import { DATA_SOURCE_TYPES, normalizeMicroFrontendConfig } from './microFrontendSchema'
import { WebDataContext } from './WebDataContext'

const readPath = (source, path) => {
  if (!path) return source
  return String(path).split('.').reduce((value, key) => value?.[key], source)
}

const replaceVariables = (value, context) => {
  if (Array.isArray(value)) return value.map(item => replaceVariables(item, context))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceVariables(item, context)]))
  }
  if (typeof value !== 'string') return value
  return value.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, path) => readPath(context, path.trim()) ?? '')
}

const remoteAlias = item => {
  const source = `${item.key}-${item.remote?.url}`
  let hash = 0
  for (let index = 0; index < source.length; index += 1) hash = ((hash << 5) - hash) + source.charCodeAt(index)
  return `web_${String(item.key || 'component').replace(/[^a-zA-Z0-9_]/g, '_')}_${Math.abs(hash)}`
}

const resolveComponentData = async (item, context) => {
  const source = item.dataSource ?? {}
  if (source.type === DATA_SOURCE_TYPES.STATIC) return source.staticData ?? null
  if (source.type !== DATA_SOURCE_TYPES.API) return undefined

  const endpoint = replaceVariables(source.endpoint, context)
  const params = replaceVariables(source.params ?? {}, context)
  const response = await axios.request({
    url: endpoint,
    method: source.method || 'GET',
    ...(String(source.method || 'GET').toUpperCase() === 'GET' ? { params } : { data: params }),
  })
  return readPath(response.data, source.responsePath)
}

const RemoteSlot = ({ item, resolvedData, runtimeContext }) => {
  const [Component, setComponent] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setComponent(null)
    setError('')
    loadRemoteFromUrl({
      name: remoteAlias(item),
      entry: item.remote?.url,
      scope: item.remote?.scope,
      module: item.remote?.module,
    }).then(module => {
      if (active) setComponent(() => module.default ?? module)
    }).catch(reason => {
      if (active) setError(reason?.message || 'Không tải được Micro Frontend.')
    })
    return () => { active = false }
  }, [item])

  if (error) return <Alert type="error" showIcon message={item.name} description={error} />
  if (!Component) return <div style={{ padding: 28, textAlign: 'center' }}><Spin tip={`Đang tải ${item.name}...`} /></div>

  const dataProp = item.dataSource?.propName
  const props = {
    ...(item.props ?? {}),
    ...(dataProp ? { [dataProp]: resolvedData } : {}),
    dataContext: runtimeContext,
  }
  return <Component {...props} />
}

const RemotePage = ({ page }) => {
  const config = normalizeMicroFrontendConfig(page.mfeConfig)
  const [hash, setHash] = useState(() => window.location.hash.slice(1))
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const query = useMemo(() => Object.fromEntries(new URLSearchParams(window.location.search)), [])
  const drawer = config.drawers.find(item => item.hashId === hash)
  const activeComponents = useMemo(() => [
    ...config.components.filter(item => item.enabled !== false),
    ...(drawer?.components ?? []).filter(item => item.enabled !== false),
  ], [config.components, drawer?.components])
  const baseContext = useMemo(() => ({
    page: { id: page.id, name: page.name },
    route: { pageId: page.id },
    query,
    currentUser: getTokenPayload(),
  }), [page.id, page.name, query])

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash.slice(1))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setDataError('')
    Promise.all(activeComponents.map(async item => [item.key, await resolveComponentData(item, baseContext)]))
      .then(entries => { if (active) setData(Object.fromEntries(entries)) })
      .catch(error => { if (active) setDataError(error?.message || 'Không tải được dữ liệu trang.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [activeComponents, baseContext])

  const runtimeContext = useMemo(() => ({ ...baseContext, components: data }), [baseContext, data])
  const renderComponents = components => components.filter(item => item.enabled !== false).map(item => (
    <RemoteSlot key={item.key} item={item} resolvedData={data[item.key]} runtimeContext={runtimeContext} />
  ))

  if (dataError) return <Alert type="error" showIcon message="Lỗi tải dữ liệu trang" description={dataError} />
  if (loading) return <div style={{ maxWidth: 900, margin: '40px auto' }}><Skeleton active /></div>
  if (!config.components.length) return <Empty style={{ marginTop: 80 }} description="Trang chưa có component" />

  return (
    <WebDataContext.Provider value={runtimeContext}>
      <main>{renderComponents(config.components)}</main>
      <Drawer
        title={drawer?.title}
        width={Math.min(Number(drawer?.width || 750), window.innerWidth)}
        open={Boolean(drawer)}
        onClose={() => {
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
          setHash('')
        }}
      >
        {drawer && renderComponents(drawer.components)}
      </Drawer>
    </WebDataContext.Provider>
  )
}

const LandingPage = ({ page }) => {
  const initializePage = useEditorStore(state => state.initializePage)
  const setViewMode = useEditorStore(state => state.setViewMode)
  useEffect(() => {
    initializePage({ id: page.id, mode: 'edit' })
    setViewMode('preview')
  }, [initializePage, page.id, setViewMode])
  return <PreviewCanvas />
}

const WebPageRuntime = () => {
  const { pageId } = useParams()
  const page = getLandingPage(pageId)
  if (!page) return <Empty style={{ marginTop: 80 }} description="Không tìm thấy trang"><Button href="/landing">Quay lại quản lý trang</Button></Empty>
  if (page.authenticationRequired && !getTokenPayload()) {
    const redirectUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
    return (
      <Empty style={{ marginTop: 80 }} description="Trang này yêu cầu đăng nhập">
        <Button type="primary" href={`/login?redirectUrl=${encodeURIComponent(redirectUrl)}`}>Đăng nhập</Button>
      </Empty>
    )
  }
  return page.contentType === WEB_CONTENT_TYPES.MICRO_FRONTEND
    ? <RemotePage page={page} />
    : <LandingPage page={page} />
}

export default WebPageRuntime
