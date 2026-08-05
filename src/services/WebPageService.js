import { RequestUtils } from '@flast-erp/core/utils'

const WEB_PAGE_VIEW_PATH = '/erp/web-page-view'

const resolveListData = response => {
  const data = response?.data ?? {}
  return {
    items: Array.isArray(data?.embedded) ? data.embedded : [],
    page: data?.page ?? {},
  }
}

const resolveCreatedPage = response => {
  const data = response?.data ?? response
  const page = data?.data && (data.data.id !== undefined || data.data.uuid !== undefined)
    ? data.data
    : data
  const id = page?.id ?? page?.uuid ?? page?.pageId
  if (id === undefined || id === null || id === '') {
    throw new Error(response?.message || 'API tạo trang chưa trả về id.')
  }
  return { ...page, id }
}

const assertSuccess = (response, fallbackMessage) => {
  if (response?.success === false || (response?.errorCode && Number(response.errorCode) !== 200)) {
    throw new Error(response?.message || fallbackMessage)
  }
  return response
}

/**
 * Payload create/update web-page — giống form: sau build phải có url rồi mới gọi API.
 * Form dùng microFrontendUrl; Landing map thêm configs[].urlBuild.
 */
export const buildWebPagePayload = ({
  id,
  name,
  slug,
  title,
  schema,
  build,
  authenticationRequired = false,
}) => {
  const pageName = name || schema?.name || 'Landing page'
  const pageSlug = slug || '/'
  const buildUrl = build?.url || ''
  const componentId = build?.component_id || ''

  if (!buildUrl) {
    throw new Error('Thiếu url build — không gọi API create/update.')
  }

  return {
    ...(id ? { id } : {}),
    name: pageName,
    slug: pageSlug,
    title: title || pageName,
    authenticationRequired: Boolean(authenticationRequired),
    // Giống form builder: đưa url build lên payload gốc
    microFrontendUrl: buildUrl,
    component_id: componentId,
    configs: [{
      titles: pageName,
      tag: 'landing-page',
      apis: [],
      urlJsx: [],
      urlBuild: buildUrl,
    }],
    seos: schema?.seo?.meta ?? [],
    breadcrumds: (schema?.breadcrumbs ?? []).map(item => ({
      page: item.text,
      url: item.url,
    })),
  }
}

const WebPageService = {
  async fetch(params = {}) {
    const response = await RequestUtils.Get(`${WEB_PAGE_VIEW_PATH}/fetch`, params)
    assertSuccess(response, 'Không tải được danh sách trang.')
    return resolveListData(response)
  },

  async create(payload) {
    const response = await RequestUtils.Post(`${WEB_PAGE_VIEW_PATH}/create`, payload)
    assertSuccess(response, 'Không tạo được trang.')
    return resolveCreatedPage(response)
  },

  async update(payload) {
    const response = await RequestUtils.Post(`${WEB_PAGE_VIEW_PATH}/update`, payload)
    assertSuccess(response, 'Không cập nhật được trang.')
    return resolveCreatedPage(response)
  },

  /**
   * Giống form saveAfterBuild → onSave:
   * có url build rồi mới create (chưa có id) hoặc update (đã có id).
   */
  async saveAfterBuild({ id, name, slug, title, schema, build, authenticationRequired }) {
    const payload = buildWebPagePayload({
      id,
      name,
      slug,
      title,
      schema,
      build,
      authenticationRequired,
    })
    return id
      ? this.update(payload)
      : this.create(payload)
  },
}

export default WebPageService
