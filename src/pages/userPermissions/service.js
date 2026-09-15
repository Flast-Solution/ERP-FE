import { RequestUtils } from '@flast-erp/core/utils'

// Cùng API đang được RestList sử dụng tại trang /user/list-system.
export const USER_SYSTEM_LIST_API = '/user/list'
export const USER_ACCOUNT_UPDATE_API = '/auth/user-bussiness/save-user'

const unwrapUsers = response => {
  const value = response?.data ?? response ?? {}
  const nested = value?.data ?? value
  const items = Array.isArray(nested)
    ? nested
    : nested?.embedded ?? nested?.items ?? nested?.content ?? nested?.records ?? []

  return Array.isArray(items) ? items : []
}

export const findSystemUsers = async (keyword = '') => {
  const search = keyword.trim()
  const baseParams = {
    page: 1,
    limit: 100,
  }
  if (!search) {
    return unwrapUsers(await RequestUtils.Get(USER_SYSTEM_LIST_API, baseParams))
  }

  // Backend hiện tách hai filter như màn danh sách tài khoản. Gọi cùng endpoint
  // cho từng field rồi hợp nhất kết quả để ô tìm kiếm hỗ trợ cả tên và tài khoản.
  const [byName, bySsoId] = await Promise.all([
    RequestUtils.Get(USER_SYSTEM_LIST_API, { ...baseParams, fullName: search }),
    RequestUtils.Get(USER_SYSTEM_LIST_API, { ...baseParams, ssoId: search }),
  ])
  const users = [...unwrapUsers(byName), ...unwrapUsers(bySsoId)]
  return Array.from(new Map(users.map(item => [item.id ?? item.userId ?? item.ssoId, item])).values())
}

const normalizeUserProfiles = profiles => (
  Array.isArray(profiles)
    ? profiles
      .map(profile => ({ id: typeof profile === 'object' ? profile?.id ?? profile?.value : profile }))
      .filter(profile => profile.id !== undefined && profile.id !== null)
    : []
)

export const updateSystemUserPermissions = (user, permissionsClient) => {
  const userId = user?.id ?? user?.userId
  const {
    permissionOverrides: _permissionOverrides,
    permissionsClient: _permissionsClient,
    permissions: _permissions,
    ...userFields
  } = user ?? {}
  const payload = {
    ...userFields,
    ...(Array.isArray(user?.userProfiles)
      ? { userProfiles: normalizeUserProfiles(user.userProfiles) }
      : {}),
    permissionsClient,
  }

  return RequestUtils.Post(USER_ACCOUNT_UPDATE_API, payload, { id: userId })
}
