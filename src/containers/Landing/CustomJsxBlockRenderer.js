import { useEffect, useState } from 'react'
import { Alert, Skeleton } from 'antd'
import { useWebData } from './WebDataContext'
import { resolveRouteEndpoint } from './landingRoutes'

const remoteCache = new Map()

const loadArtifact = artifact => {
  const cacheKey = `${artifact?.componentId}:${artifact?.version}`
  if (!remoteCache.has(cacheKey)) {
    const versionAlias = String(artifact?.version || 'latest').replace(/[^a-zA-Z0-9]/g, '').slice(-20)
    const remoteAlias = `${artifact.componentId}_${versionAlias}`
    remoteCache.set(cacheKey, import('@/utils/loadRemote').then(({ loadRemoteFromUrl }) => (
      loadRemoteFromUrl({
        name: remoteAlias,
        scope: artifact.componentId,
        entry: artifact.entryUrl,
        module: artifact.exposedModule || 'MPage',
        version: artifact.version,
      })
    )).then(module => module.default || module))
  }
  return remoteCache.get(cacheKey)
}

export const CustomJsxBlockRenderer = ({ section, payload = {}, sourceBlockId = null }) => {
  const runtime = useWebData()
  const inlineComponent = runtime.customComponents?.[section.definitionId]
  const [remoteComponent, setRemoteComponent] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (inlineComponent || !section.artifact?.entryUrl) {
      setRemoteComponent(null)
      setError('')
      return () => { active = false }
    }
    setError('')
    loadArtifact(section.artifact)
      .then(component => { if (active) setRemoteComponent(() => component) })
      .catch(loadError => { if (active) setError(loadError?.message || 'Không tải được JSX block.') })
    return () => { active = false }
  }, [inlineComponent, section.artifact])

  const Component = inlineComponent || remoteComponent
  if (error) return <Alert type="error" showIcon message="Custom JSX không tải được" description={error} />
  if (!Component) {
    return section.artifact?.entryUrl
      ? <Skeleton active paragraph={{ rows: 3 }} />
      : <Alert type="warning" showIcon message="Custom JSX chưa được build" />
  }

  const pageData = runtime.data || {}
  const hasDirectData = Object.prototype.hasOwnProperty.call(pageData, section.id)
  const dataGroups = Object.values(pageData)
  // Tương thích các trang đã lưu trong giai đoạn Custom JSX từng thay block
  // nhưng dataSources vẫn còn gắn với ID cũ. Chỉ fallback khi toàn trang có
  // đúng một nhóm API để không truyền nhầm dữ liệu giữa nhiều block.
  const componentData = hasDirectData
    ? pageData[section.id]
    : dataGroups.length === 1
      ? dataGroups[0]
      : {}

  const requestApi = async (key, options = {}) => {
    const source = (runtime.dataSources?.[section.id] ?? []).find(item => item.key === key)
    if (!source) throw new Error(`Không tìm thấy API binding với key “${key}”.`)
    const endpoint = resolveRouteEndpoint(source.url, runtime.route?.params || {})
    const method = String(options.method || source.method || 'GET').toUpperCase()
    const headers = { ...(options.headers || {}) }
    let body = options.body
    if (body != null && typeof body === 'object' && !(body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'
      body = JSON.stringify(body)
    }
    const response = await fetch(endpoint, { ...options, method, headers, body })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (response.status === 204) return null
    const contentType = response.headers.get('content-type') || ''
    return contentType.includes('application/json') ? response.json() : response.text()
  }

  return (
    <Component
      {...(section.props || {})}
      props={section.props || {}}
      data={componentData || {}}
      actions={{
        ...runtime.actions,
        sourceBlockId: section.id,
        openOverlay: (overlayId, payload) => runtime.actions?.openOverlay?.(overlayId, payload, section.id),
        openDrawer: (overlayId, payload) => runtime.actions?.openDrawer?.(overlayId, payload, section.id),
        requestApi,
        callApi: requestApi,
      }}
      mode={runtime.mode || 'runtime'}
      payload={payload}
      sourceBlockId={sourceBlockId}
      route={runtime.route || {}}
      params={runtime.route?.params || {}}
      categoryLabel={runtime.route?.params?.category}
      id={runtime.route?.params?.id}
    />
  )
}
