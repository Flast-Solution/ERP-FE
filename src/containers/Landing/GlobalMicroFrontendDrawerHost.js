import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Drawer, Empty, Skeleton } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { getTokenPayload } from '@/utils/authUtils'
import { listLandingPages, WEB_CONTENT_TYPES } from './landingRepository'
import { normalizeMicroFrontendConfig } from './microFrontendSchema'
import { WebDataContext } from './WebDataContext'
import { RemoteComponentSlot, resolveRemoteComponentData } from './MicroFrontendRuntime'

const normalizeHash = hash => {
  const value = String(hash || '').replace(/^#/, '')
  try {
    return decodeURIComponent(value)
  } catch (_) {
    return value
  }
}

const findDrawerConfig = hashId => {
  if (!hashId) return null

  for (const page of listLandingPages()) {
    if (page?.contentType !== WEB_CONTENT_TYPES.MICRO_FRONTEND) continue
    const config = normalizeMicroFrontendConfig(page.mfeConfig)
    const drawer = config.drawers.find(item => String(item?.hashId) === String(hashId))
    if (drawer) return { page, drawer }
  }
  return null
}

const GlobalMicroFrontendDrawerHost = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const hashId = normalizeHash(location.hash)
  const matchedConfig = useMemo(() => findDrawerConfig(hashId), [hashId])
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const components = useMemo(() => (
    (matchedConfig?.drawer?.components ?? []).filter(item => item.enabled !== false)
  ), [matchedConfig])
  const query = useMemo(
    () => Object.fromEntries(new URLSearchParams(location.search)),
    [location.search]
  )
  const baseContext = useMemo(() => {
    const page = matchedConfig?.page
    return {
      page: page ? { id: page.id, name: page.name } : null,
      route: {
        pathname: location.pathname,
        hashId,
      },
      query,
      currentUser: getTokenPayload(),
    }
  }, [hashId, location.pathname, matchedConfig?.page, query])

  useEffect(() => {
    let active = true
    if (!matchedConfig) {
      setData({})
      setError('')
      setLoading(false)
      return () => { active = false }
    }

    setLoading(true)
    setError('')
    Promise.all(components.map(async item => [
      item.key,
      await resolveRemoteComponentData(item, baseContext),
    ])).then(entries => {
      if (active) setData(Object.fromEntries(entries))
    }).catch(reason => {
      if (active) setError(reason?.message || 'Không tải được dữ liệu drawer.')
    }).finally(() => {
      if (active) setLoading(false)
    })

    return () => { active = false }
  }, [baseContext, components, matchedConfig])

  const closeDrawer = () => {
    navigate(`${location.pathname}${location.search}`, { replace: true })
  }

  if (!matchedConfig) return null

  const { page, drawer } = matchedConfig
  const requiresLogin = page.authenticationRequired && !getTokenPayload()
  const runtimeContext = { ...baseContext, components: data }
  const drawerWidth = Math.min(Number(drawer.width || 750), 750, window.innerWidth)

  return (
    <Drawer
      title={drawer.title}
      width={drawerWidth}
      open
      onClose={closeDrawer}
      destroyOnClose
    >
      {requiresLogin ? (
        <Empty description="Nội dung này yêu cầu đăng nhập">
          <Button
            type="primary"
            href={`/login?redirectUrl=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`}
          >
            Đăng nhập
          </Button>
        </Empty>
      ) : error ? (
        <Alert type="error" showIcon message="Lỗi tải dữ liệu drawer" description={error} />
      ) : loading ? (
        <Skeleton active />
      ) : components.length === 0 ? (
        <Empty description="Drawer chưa có component" />
      ) : (
        <WebDataContext.Provider value={runtimeContext}>
          {components.map(item => (
            <RemoteComponentSlot
              key={item.key}
              item={item}
              resolvedData={data[item.key]}
              runtimeContext={runtimeContext}
            />
          ))}
        </WebDataContext.Provider>
      )}
    </Drawer>
  )
}

export default GlobalMicroFrontendDrawerHost
