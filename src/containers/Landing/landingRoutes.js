const normalizePath = value => {
  const path = `/${String(value || '').trim().replace(/^\/+|\/+$/g, '')}`
  return path === '/' ? '/' : path
}

const safeDecode = value => {
  try { return decodeURIComponent(value) } catch (_) { return value }
}

export const matchLandingRoute = (pattern, pathname) => {
  const routePattern = String(pattern || '').trim()
  if (!routePattern || routePattern === '*') return { params: {} }
  const patternParts = normalizePath(routePattern).split('/').filter(Boolean)
  const pathParts = normalizePath(pathname).split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null

  const params = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index]
    const actual = pathParts[index]
    if (expected.startsWith(':')) params[expected.slice(1)] = safeDecode(actual)
    else if (expected !== actual) return null
  }
  return { params }
}

export const getLandingRelativePath = (pathname, pageId) => {
  const current = normalizePath(pathname)
  const inferredBase = current.match(/^\/m\/[^/]+/)?.[0]
  const base = pageId ? `/m/${pageId}` : inferredBase
  if (!base) return current
  if (current === base) return '/'
  if (current.startsWith(`${base}/`)) return normalizePath(current.slice(base.length))
  return current
}

export const getLandingRouteContext = (schema, pathname) => {
  const matches = (schema?.sections ?? [])
    .map(section => ({ section, match: matchLandingRoute(section.props?.routePath, pathname) }))
    .filter(item => item.section.props?.routePath && item.match)
  return {
    pathname: normalizePath(pathname),
    params: matches.reduce((params, item) => ({ ...params, ...item.match.params }), {}),
  }
}

export const resolveRouteEndpoint = (endpoint, params = {}) => {
  const unresolved = []
  const url = String(endpoint || '').replace(/:([A-Za-z_][\w]*)/g, (_, key) => {
    const value = params[key]
    if (value == null || value === '') {
      unresolved.push(key)
      return `:${key}`
    }
    return encodeURIComponent(value)
  })
  if (unresolved.length) throw new Error(`Thiếu route param: ${unresolved.join(', ')}`)
  return url
}
