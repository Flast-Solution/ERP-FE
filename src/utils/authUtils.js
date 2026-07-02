const getRoleValue = (role) => {
  if (!role) return null
  if (typeof role === 'string') return role
  return role.type ?? role.role ?? role.name ?? role.authority ?? role.code ?? null
}

const parseJwtPayload = (token = '') => {
  try {
    const payload = token.split('.')[1]
    if (!payload) return {}

    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=')

    return JSON.parse(window.atob(base64))
  } catch (_) {
    return {}
  }
}

export const getTokenPayload = () => {
  if (typeof window === 'undefined') return {}
  return parseJwtPayload(window.localStorage.getItem('jwt_access_token') ?? '')
}

const splitRoleString = (value) => {
  if (typeof value !== 'string') return [value]
  return value
    .split(/[,\s]+/)
    .map(item => item.trim())
    .filter(Boolean)
}

export const getUserRoles = (user = {}) => {
  const tokenPayload = getTokenPayload()
  const roleSources = [
    user.roles,
    user.authorities,
    user.userProfiles,
    user.profiles,
    user.role,
    user.type,
    tokenPayload.roles,
    tokenPayload.authorities,
    tokenPayload.userProfiles,
    tokenPayload.profiles,
    tokenPayload.role,
    tokenPayload.type,
    tokenPayload.scope,
    tokenPayload.scopes,
    tokenPayload.permissions,
  ]

  return Array.from(new Set(roleSources
    .flatMap(source => Array.isArray(source) ? source : [source])
    .flatMap(splitRoleString)
    .map(getRoleValue)
    .filter(Boolean)))
}

export const hasUserRole = (user, role) => getUserRoles(user).includes(role)

export const isSuperAdmin = (user) => hasUserRole(user, 'ROLE_SUPER_ADMIN')
