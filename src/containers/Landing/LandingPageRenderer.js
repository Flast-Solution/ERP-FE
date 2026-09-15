import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Helmet } from 'react-helmet'
import { useLocation, useNavigate } from 'react-router-dom'
import { PreviewCanvas } from './PreviewCanvas'
import { WebDataContext } from './WebDataContext'
import { CustomJsxBlockRenderer } from './CustomJsxBlockRenderer'
import { useLandingOverlayStore } from './landingOverlayStore'
import { getLandingOverlayRoot } from './landingOverlayRoot'
import {
  getLandingRelativePath,
  getLandingRouteContext,
  matchLandingRoute,
  resolveRouteEndpoint,
} from './landingRoutes'

const resolvePageData = (schema, pathname) => {
  const jobs = []
  Object.entries(schema?.dataSources ?? {}).forEach(([blockId, sources]) => {
    const section = (schema?.sections ?? []).find(item => item.id === blockId)
    const match = matchLandingRoute(section?.props?.routePath, pathname)
    if (section?.props?.routePath && !match) return
    ;(sources ?? []).forEach(source => {
      if (!source?.url || (source.method || 'GET').toUpperCase() !== 'GET') return
      jobs.push({ blockId, source, params: match?.params || {} })
    })
  })
  return jobs
}

const usePageData = (schema, pathname) => {
  const [data, setData] = useState({})
  useEffect(() => {
    let active = true
    const jobs = resolvePageData(schema, pathname)
    if (!jobs.length) {
      setData({})
      return () => { active = false }
    }
    setData(jobs.reduce((output, { blockId }) => ({
      ...output,
      [blockId]: {
        ...output[blockId],
        $loading: true,
        $errors: {},
      },
    }), {}))
    Promise.all(jobs.map(async ({ blockId, source, params }) => {
      try {
        const endpoint = resolveRouteEndpoint(source.url, params)
        const response = await fetch(endpoint, { method: 'GET' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return {
          blockId,
          key: String(source.key || source.id || '').trim(),
          value: await response.json(),
        }
      } catch (error) {
        return {
          blockId,
          key: String(source.key || source.id || '').trim(),
          value: null,
          error: error.message,
        }
      }
    })).then(results => {
      if (!active) return
      setData(results.reduce((output, item) => ({
        ...output,
        [item.blockId]: {
          ...output[item.blockId],
          [item.key]: item.value,
          $loading: false,
          $errors: {
            ...output[item.blockId]?.$errors,
            ...(item.error ? { [item.key]: item.error } : {}),
          },
        },
      }), {}))
    })
    return () => { active = false }
  }, [pathname, schema])
  return data
}

const PageHead = ({ schema }) => {
  const meta = schema?.seo?.meta ?? []
  const title = meta.find(item => item.name === 'title')?.value || schema?.name || 'Landing page'
  return (
    <Helmet>
      <title>{title}</title>
      {meta.filter(item => item.name && item.name !== 'title').map(item => (
        item.name.startsWith('og:')
          ? <meta key={item.id || item.name} property={item.name} content={item.value || ''} />
          : <meta key={item.id || item.name} name={item.name} content={item.value || ''} />
      ))}
    </Helmet>
  )
}

const OverlayHost = ({ schema }) => {
  const active = useLandingOverlayStore(state => state.active)
  const closeOverlay = useLandingOverlayStore(state => state.closeOverlay)
  const overlay = (schema?.overlays ?? []).find(item => item.id === active?.overlayId)

  useEffect(() => {
    if (!overlay) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = event => { if (event.key === 'Escape') closeOverlay() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [closeOverlay, overlay])

  if (!overlay) return null
  const root = getLandingOverlayRoot()
  if (!root) return null
  return createPortal(
    <div
      data-landing-global-overlay="true"
      style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', justifyContent: 'flex-end' }}
    >
      <button
        type="button"
        aria-label="Đóng drawer"
        onClick={closeOverlay}
        style={{ position: 'absolute', inset: 0, width: '100%', border: 0, background: 'rgba(10, 12, 20, .48)' }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={overlay.props?.name || 'Drawer'}
        style={{ position: 'relative', width: 'min(520px, 92vw)', height: '100%', overflow: 'auto', background: '#fff', boxShadow: '-12px 0 36px rgba(0,0,0,.18)' }}
      >
        <button
          type="button"
          onClick={closeOverlay}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 1, width: 34, height: 34, border: '1px solid #ddd', borderRadius: 999, background: '#fff' }}
        >
          ×
        </button>
        <CustomJsxBlockRenderer
          section={overlay}
          payload={active?.payload || {}}
          sourceBlockId={active?.sourceBlockId || null}
        />
      </aside>
    </div>,
    root,
  )
}

export const LandingPageRenderer = ({
  schema,
  customComponents = {},
  mode = 'runtime',
  page = null,
  currentUser = null,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const relativePath = useMemo(
    () => getLandingRelativePath(location.pathname, page?.id),
    [location.pathname, page?.id],
  )
  const routeContext = useMemo(
    () => getLandingRouteContext(schema, relativePath),
    [relativePath, schema],
  )
  const data = usePageData(schema, relativePath)
  const openOverlay = useLandingOverlayStore(state => state.openOverlay)
  const closeOverlay = useLandingOverlayStore(state => state.closeOverlay)
  const navigateTo = useCallback((url, options = {}) => {
    const target = String(url || '').trim()
    if (!target) return
    if (target.startsWith('#')) {
      window.location.hash = target
      return
    }
    if (/^\/(?!\/)/.test(target)) {
      const pageBase = page?.id && location.pathname.startsWith(`/m/${page.id}`)
        ? `/m/${page.id}`
        : null
      const runtimeBase = pageBase || location.pathname.match(/^\/m\/[^/]+/)?.[0] || ''
      navigate(runtimeBase ? `${runtimeBase}${target === '/' ? '' : target}` : target, options)
      return
    }
    window.location.assign(target)
  }, [location.pathname, navigate, page?.id])
  const actions = useMemo(() => ({
    openOverlay: (overlayId, payload, sourceBlockId) => openOverlay(overlayId, payload, sourceBlockId),
    openDrawer: (overlayId, payload, sourceBlockId) => openOverlay(overlayId, payload, sourceBlockId),
    closeOverlay,
    closeDrawer: closeOverlay,
    navigate: (url, options) => navigateTo(url, options),
    replace: url => navigateTo(url, { replace: true }),
    back: () => navigate(-1),
  }), [closeOverlay, navigate, navigateTo, openOverlay])
  const context = useMemo(() => ({
    components: customComponents,
    customComponents,
    data,
    dataSources: schema?.dataSources ?? {},
    actions,
    mode,
    page,
    currentUser,
    route: {
      pathname: routeContext.pathname,
      params: routeContext.params,
      search: location.search,
      hash: location.hash,
      state: location.state,
    },
    query: Object.fromEntries(new URLSearchParams(window.location.search)),
  }), [actions, currentUser, customComponents, data, location, mode, page, routeContext, schema?.dataSources])

  return (
    <WebDataContext.Provider value={context}>
      <PageHead schema={schema} />
      <PreviewCanvas schema={schema} mode={mode} />
      <OverlayHost schema={schema} />
    </WebDataContext.Provider>
  )
}
