import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Empty, Skeleton } from 'antd'
import { useParams } from 'react-router-dom'
import { getTokenPayload } from '@/utils/authUtils'
import { useEditorStore } from '@/store/editorStore'
import { PreviewCanvas } from './PreviewCanvas'
import { getLandingPage, WEB_CONTENT_TYPES } from './landingRepository'
import { normalizeMicroFrontendConfig } from './microFrontendSchema'
import { WebDataContext } from './WebDataContext'
import { RemoteComponentSlot, resolveRemoteComponentData } from './MicroFrontendRuntime'

const RemotePage = ({ page }) => {
  const config = normalizeMicroFrontendConfig(page.mfeConfig)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const query = useMemo(() => Object.fromEntries(new URLSearchParams(window.location.search)), [])
  const activeComponents = useMemo(
    () => config.components.filter(item => item.enabled !== false),
    [config.components]
  )
  const baseContext = useMemo(() => ({
    page: { id: page.id, name: page.name },
    route: { pageId: page.id },
    query,
    currentUser: getTokenPayload(),
  }), [page.id, page.name, query])

  useEffect(() => {
    let active = true
    setLoading(true)
    setDataError('')
    Promise.all(activeComponents.map(async item => [item.key, await resolveRemoteComponentData(item, baseContext)]))
      .then(entries => { if (active) setData(Object.fromEntries(entries)) })
      .catch(error => { if (active) setDataError(error?.message || 'Không tải được dữ liệu trang.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [activeComponents, baseContext])

  const runtimeContext = useMemo(() => ({ ...baseContext, components: data }), [baseContext, data])
  const renderComponents = components => components.filter(item => item.enabled !== false).map(item => (
    <RemoteComponentSlot key={item.key} item={item} resolvedData={data[item.key]} runtimeContext={runtimeContext} />
  ))

  if (dataError) return <Alert type="error" showIcon message="Lỗi tải dữ liệu trang" description={dataError} />
  if (loading) return <div style={{ maxWidth: 900, margin: '40px auto' }}><Skeleton active /></div>
  if (!config.components.length) return <Empty style={{ marginTop: 80 }} description="Trang chưa có component" />

  return (
    <WebDataContext.Provider value={runtimeContext}>
      <main>{renderComponents(config.components)}</main>
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
