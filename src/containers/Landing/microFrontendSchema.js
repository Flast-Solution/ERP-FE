import { createLandingPageId } from './landingRepository'

export const DATA_SOURCE_TYPES = {
  NONE: 'NONE',
  API: 'API',
  STATIC: 'STATIC',
}

export const createRemoteComponent = () => ({
  key: `component-${createLandingPageId()}`,
  name: 'Component mới',
  order: 1,
  enabled: true,
  remote: {
    url: '',
    scope: '',
    module: './MPage',
  },
  dataSource: {
    type: DATA_SOURCE_TYPES.NONE,
    endpoint: '',
    method: 'GET',
    params: {},
    responsePath: 'data',
    propName: 'data',
  },
  props: {},
})

export const createRemoteDrawer = () => ({
  hashId: `drawer-${Date.now()}`,
  title: 'Drawer mới',
  width: 750,
  components: [],
})

export const normalizeMicroFrontendConfig = config => ({
  components: Array.isArray(config?.components) ? config.components : [],
  drawers: Array.isArray(config?.drawers) ? config.drawers : [],
})

export const validateMicroFrontendConfig = config => {
  const errors = []
  const validateComponents = (components, owner) => {
    components.forEach((item, index) => {
      const label = `${owner} - component ${index + 1}`
      if (!item?.key) errors.push(`${label} thiếu key.`)
      if (!item?.remote?.url) errors.push(`${label} thiếu remoteEntry URL.`)
      if (!item?.remote?.scope) errors.push(`${label} thiếu scope.`)
      if (!item?.remote?.module) errors.push(`${label} thiếu module.`)
      if (item?.dataSource?.type === DATA_SOURCE_TYPES.API && !item?.dataSource?.endpoint) {
        errors.push(`${label} chưa cấu hình endpoint.`)
      }
    })
  }
  validateComponents(config?.components ?? [], 'Trang chính')
  ;(config?.drawers ?? []).forEach((drawer, index) => {
    if (!drawer?.hashId) errors.push(`Drawer ${index + 1} thiếu hash ID.`)
    validateComponents(drawer?.components ?? [], `Drawer ${drawer?.title || index + 1}`)
  })
  return errors
}
