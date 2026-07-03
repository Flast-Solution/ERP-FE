export const BUSINESS_UNIT_API = {
  filter  : '/auth/user-bussiness/filter',
  saveInfo: '/auth/user-bussiness/save-info',
  listUser: '/auth/user-bussiness/list-user',
  listRole: '/auth/list-role',
}

export const getResponseItems = (response = {}) => {
  const payload = response?.data ?? response
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.embedded)) return payload.embedded
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.user)) return payload.user
  return []
}

export const normalizeBusinessUnit = (item = {}) => ({
  ...item,
  id     : item.id ?? item.bizId ?? item.businessId,
  name   : item.name ?? item.businessName ?? item.companyName ?? '',
  code   : item.code ?? item.bizCode ?? item.businessCode ?? '',
  hotline: item.hotline ?? item.phone ?? '',
  email  : item.email ?? '',
  address: item.address ?? '',
  logo   : item.logo ?? '',
  meta   : item.meta ?? item.description ?? '',
  status : item.status ?? (item.enabled === false ? 0 : 1),
  users  : item.user ?? item.users ?? [],
})

export const normalizeUserForForm = (user = {}) => ({
  ...user,
  id          : user.id ?? null,
  bizId       : user.bizId ?? null,
  ssoId       : user.ssoId ?? '',
  password    : user.password ?? '',
  fullName    : user.fullName ?? '',
  phone       : user.phone ?? '',
  email       : user.email ?? '',
  status      : user.status ?? 1,
  avatar      : user.avatar ?? '',
  address     : user.address ?? '',
  userProfiles: user.userProfiles?.map(profile => profile?.id ?? profile) ?? [],
})

export const normalizeStatusValue = (value) => {
  if (value === false || value === 0 || value === '0') return 0
  return 1
}

export const buildSavePayload = (values = {}) => {
  const {
    users = [],
    id,
    bizId,
    ...businessFields
  } = values

  const businessId = id ?? bizId ?? null
  const userBusiness = {
    ...(businessId ? { id: businessId } : {}),
    name   : businessFields.name ?? '',
    code   : businessFields.code ?? '',
    hotline: businessFields.hotline ?? '',
    email  : businessFields.email ?? '',
    address: businessFields.address ?? '',
    logo   : businessFields.logo ?? '',
    meta   : businessFields.meta ?? '',
    status : normalizeStatusValue(businessFields.status ?? 1),
  }

  const user = users.map(item => ({
    ...(item?.id ? { id: item.id } : {}),
    bizId       : item?.bizId ?? businessId,
    ssoId       : item?.ssoId ?? '',
    password    : item?.password ?? '',
    fullName    : item?.fullName ?? '',
    phone       : item?.phone ?? '',
    email       : item?.email ?? '',
    status      : normalizeStatusValue(item?.status ?? 1),
    avatar      : item?.avatar ?? '',
    address     : item?.address ?? '',
    userProfiles: (Array.isArray(item?.userProfiles) ? item.userProfiles : [])
      .map(profile => (
        typeof profile === 'object' && profile != null
          ? { id: profile.id ?? profile.value }
          : { id: profile }
      ))
      .filter(profile => profile.id != null),
  }))

  return { userBusiness, user }
}

export const mapRecordToFormValues = (record = {}) => ({
  ...record,
  status: normalizeStatusValue(record.status ?? 1),
  users : (record.users ?? []).map(normalizeUserForForm),
})
