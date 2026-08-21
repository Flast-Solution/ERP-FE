import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Empty, Skeleton } from 'antd'
import { useParams } from 'react-router-dom'
import { getTokenPayload } from '@/utils/authUtils'
import { loadRemoteFromUrl } from '@/utils/loadRemote'
import WebPageService from '@/services/WebPageService'
import { LandingPageRenderer } from './LandingPageRenderer'
import { getLandingPage, saveWebPage, WEB_CONTENT_TYPES } from './landingRepository'

const LandingPage = ({ page }) => <LandingPageRenderer schema={page.schema} mode="runtime" page={page} />

const normalizeApiPage = item => {
  const landingConfig = (item?.configs ?? []).find(config => config.tag === 'landing-page')
  const buildUrl = item?.microFrontendUrl
    || landingConfig?.urlBuild
    || (item?.configs ?? []).find(config => config.urlBuild)?.urlBuild
    || item?.build?.url
    || null

  return {
    ...item,
    contentType: WEB_CONTENT_TYPES.LANDING,
    remoteId: item.id,
    schema: item.schema ?? (buildUrl ? null : undefined),
    build: buildUrl
      ? { ...item.build, url: buildUrl, component_id: item.component_id }
      : item.build,
    status: item.status || (buildUrl ? 'PUBLISHED' : 'DRAFT'),
  }
}

const getRemoteScope = entry => {
  try {
    const parts = new URL(entry, window.location.origin).pathname.split('/').filter(Boolean)
    const entryIndex = parts.findIndex(part => part === 'remoteEntry.js')
    return entryIndex > 0 ? parts[entryIndex - 1] : ''
  } catch (_) {
    return ''
  }
}

const RemoteLandingPage = ({ page }) => {
  const [RemotePage, setRemotePage] = useState(null)
  const [error, setError] = useState('')
  const entry = page?.build?.url
  const scope = useMemo(() => getRemoteScope(entry), [entry])

  useEffect(() => {
    let active = true
    if (!entry || !scope) {
      setError('Trang chưa có schema hoặc URL build hợp lệ.')
      return () => { active = false }
    }
    setError('')
    setRemotePage(null)
    loadRemoteFromUrl({
      name: `${scope}_page_${page.id}`,
      scope,
      entry,
      module: 'MPage',
      version: page.updatedAt || entry,
    })
      .then(module => {
        if (active) setRemotePage(() => module.default || module)
      })
      .catch(loadError => {
        if (active) setError(loadError?.message || 'Không tải được bản build của trang.')
      })
    return () => { active = false }
  }, [entry, page.id, page.updatedAt, scope])

  if (error) {
    return <Alert style={{ margin: 32 }} type="error" showIcon message="Không mở được trang demo" description={error} />
  }
  if (!RemotePage) return <Skeleton active style={{ padding: 32 }} paragraph={{ rows: 8 }} />
  return <RemotePage />
}

const WebPageRuntime = () => {
  const { pageId } = useParams()
  const [page, setPage] = useState(() => getLandingPage(pageId))
  const [loading, setLoading] = useState(() => !getLandingPage(pageId))
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const cachedPage = getLandingPage(pageId)
    setPage(cachedPage)
    setLoading(!cachedPage)
    setError('')

    WebPageService.find(pageId)
      .then(apiPage => {
        if (!active) return
        const normalizedPage = normalizeApiPage(apiPage)
        const savedPage = saveWebPage(normalizedPage)
        setPage(savedPage || normalizedPage)
      })
      .catch(loadError => {
        if (active && !cachedPage) {
          setError(loadError?.message || 'Không tải được thông tin trang.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [pageId])

  if (loading && !page) return <Skeleton active style={{ padding: 32 }} paragraph={{ rows: 8 }} />
  if (!page) {
    return (
      <Empty
        style={{ marginTop: 80 }}
        description={error || 'Không tìm thấy trang'}
      >
        <Button href="/landing">Quay lại quản lý trang</Button>
      </Empty>
    )
  }
  if (page.authenticationRequired && !getTokenPayload()) {
    const redirectUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
    return (
      <Empty style={{ marginTop: 80 }} description="Trang này yêu cầu đăng nhập">
        <Button type="primary" href={`/login?redirectUrl=${encodeURIComponent(redirectUrl)}`}>Đăng nhập</Button>
      </Empty>
    )
  }
  if (page.schema) return <LandingPage page={page} />
  if (page.build?.url) return <RemoteLandingPage page={page} />
  return <Empty style={{ marginTop: 80 }} description="Trang chưa có schema hoặc bản build"><Button href="/landing">Quay lại quản lý trang</Button></Empty>
}

export default WebPageRuntime
