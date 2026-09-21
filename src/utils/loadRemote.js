import {
  init,
  loadRemote as mfLoadRemote,
  registerRemotes
} from "@module-federation/runtime"

import * as React           from "react"
import * as ReactDOM        from "react-dom"
import * as ReactRouterDom  from "react-router-dom"
import * as Antd            from "antd"
import * as Axios           from "axios"
import * as Dayjs           from "dayjs"
import * as Lodash          from "lodash"
import * as StyledComponents from "styled-components"
import * as I18next         from "i18next"
import * as ReactI18next    from "react-i18next"
import * as Moment          from "moment"
import * as JoditReact      from "jodit-react"
import * as QueryString     from "query-string"
import * as ReactWaypoint   from "react-waypoint"
import * as FlastErpCore    from "@flast-erp/core"
import * as FlastWebRuntime from "@/containers/Landing/LandingRuntime"

let initialized = false
const registeredRemotes = new Set()
const loadedRemoteContainers = new Set()
let remoteLoadQueue = Promise.resolve()

// Các remote form hiện tại đều được build với cùng chunkLoadingGlobal
// `webpackChunkremote_app`. Cần cô lập lần khởi tạo từng container để chunk của
// remote đã tải trước không bị replay vào webpack runtime của remote tiếp theo.
function resetLegacyRemoteChunkScope() {
  if (typeof window !== "undefined") {
    window.webpackChunkremote_app = []
  }
}
 
const SHARED_DEPS = {
  react: {
    version: "18.3.1",
    scope: "default",
    lib: () => React,
    shareConfig: { singleton: true, requiredVersion: "^18.3.1" },
  },
  "react-dom": {
    version: "18.3.1",
    scope: "default",
    lib: () => ReactDOM,
    shareConfig: { singleton: true, requiredVersion: "^18.3.1" },
  },
  "react-router-dom": {
    version: "6.27.0",
    scope: "default",
    lib: () => ReactRouterDom,
    shareConfig: { singleton: true, requiredVersion: "^6.27.0" },
  },
  antd: {
    version: "5.29.3",
    scope: "default",
    lib: () => Antd,
    shareConfig: { singleton: true, requiredVersion: "^5.21.0" },
  },
  axios: {
    version: "0.27.2",
    scope: "default",
    lib: () => Axios,
    shareConfig: { singleton: true, requiredVersion: "^0.27.2" },
  },
  dayjs: {
    version: "1.11.21",
    scope: "default",
    lib: () => Dayjs,
    shareConfig: { singleton: true, requiredVersion: "^1.11.13" },
  },
  lodash: {
    version: "4.18.1",
    scope: "default",
    lib: () => Lodash,
    shareConfig: { singleton: true, requiredVersion: "^4.17.0" },
  },
  "styled-components": {
    version: "5.3.11",
    scope: "default",
    lib: () => StyledComponents,
    shareConfig: { singleton: true, requiredVersion: "^5.3.5" },
  },
  i18next: {
    version: "21.10.0",
    scope: "default",
    lib: () => I18next,
    shareConfig: { singleton: true, requiredVersion: "^21.9.1" },
  },
  "react-i18next": {
    version: "11.18.6",
    scope: "default",
    lib: () => ReactI18next,
    shareConfig: { singleton: true, requiredVersion: "^11.18.5" },
  },
  moment: {
    version: "2.30.1",
    scope: "default",
    lib: () => Moment,
    shareConfig: { singleton: true, requiredVersion: "^2.30.1" },
  },
  "jodit-react": {
    version: "5.3.21",
    scope: "default",
    lib: () => JoditReact,
    shareConfig: { singleton: true, requiredVersion: "^5.2.31" },
  },
  "query-string": {
    version: "7.1.3",
    scope: "default",
    lib: () => QueryString,
    shareConfig: { singleton: true, requiredVersion: "^7.1.1" },
  },
  "react-waypoint": {
    version: "10.3.0",
    scope: "default",
    lib: () => ReactWaypoint,
    shareConfig: { singleton: true, requiredVersion: "^10.3.0" },
  },
  "@flast-erp/core": {
    version: "1.0.23",
    scope: "default",
    lib: () => FlastErpCore,
    shareConfig: { singleton: true, requiredVersion: "^1.0.23" },
  },
  "@flast-erp/core/components": {
    version: "1.0.23",
    scope: "default",
    lib: () => FlastErpCore,
    shareConfig: { singleton: true, requiredVersion: "^1.0.23" },
  },
}

function ensureInit() {
  // Landing artifact được build ở môi trường độc lập, vì vậy không thể import
  // một package nội bộ chưa publish như @flast/web-runtime. Cung cấp runtime
  // trực tiếp từ host trước khi Module Federation thực thi remote component.
  if (typeof window !== "undefined") {
    window.__FLAST_WEB_RUNTIME__ = FlastWebRuntime
  }
  if (initialized) {
    return
  }
  initialized = true

  init({
    name: "hostApp",
    remotes: [],
    shared: SHARED_DEPS
  })
}

function ensureRemoteRegistered(componentId, entry, entryGlobalName = componentId, force = false) {
  ensureInit()
  if (registeredRemotes.has(componentId) && !force) {
    return
  }

  registerRemotes(
    [{
      name: componentId,
      entry,
      type: "global",
      entryGlobalName
    }],
    force ? { force: true } : undefined
  )

  registeredRemotes.add(componentId)
  if (force) loadedRemoteContainers.delete(componentId)
}

/**
 * @param {string} componentId   - ID/name của remote container
 * @param {string} exposedModule - Tên module
 * @param {string} remoteBaseUrl - Base URL
 * @param {string} remoteEntryComponentId - ID/path chứa remoteEntry.js nếu khác remote container name
 * @param {string} remoteEntryGlobalName - Global name thật của remote nếu componentId là alias nội bộ
 * @param {string} remoteEntryVersion - Version/cache key để tránh dùng remoteEntry cũ
 *Ư
 * @example
 * const mod = await loadRemote("component_001", "MPage", "https://remote.aa.vn")
 * const MPage = mod.default
 */
export async function loadRemote(
  componentId,
  exposedModule,
  remoteBaseUrl,
  remoteEntryComponentId = componentId,
  remoteEntryGlobalName = componentId,
  remoteEntryVersion = ''
) {
  const load = async () => {
    const entryVersion = String(remoteEntryVersion || '').trim()
    const entry = `${remoteBaseUrl}/${remoteEntryComponentId}/remoteEntry.js${entryVersion ? `?v=${encodeURIComponent(entryVersion)}` : ''}`
    ensureRemoteRegistered(
      componentId,
      entry,
      remoteEntryGlobalName,
      Boolean(entryVersion)
    )

    if (!loadedRemoteContainers.has(componentId)) {
      resetLegacyRemoteChunkScope()
    }

    const mod = await mfLoadRemote(`${componentId}/${exposedModule}`)
    if (!mod) {
      throw new Error(
        `Module "${exposedModule}" không tìm thấy trong remote "${componentId}". ` +
        `Kiểm tra lại "exposes" trong craco.config.js của remote-app.`
      )
    }

    loadedRemoteContainers.add(componentId)
    return mod
  }

  const request = remoteLoadQueue.then(load, load)
  remoteLoadQueue = request.catch(() => undefined)
  return request
}

/** Tải remote từ URL remoteEntry đầy đủ, dùng cho trang WEB cấu hình động. */
export async function loadRemoteFromUrl({
  name,
  entry,
  scope,
  module = 'MPage',
  version = '',
}) {
  const remoteName = String(name || scope || '').trim()
  const remoteEntry = String(entry || '').trim()
  const exposedModule = String(module || 'MPage').replace(/^\.\//, '')
  if (!remoteName || !remoteEntry) throw new Error('Thiếu tên hoặc URL remoteEntry.')

  const load = async () => {
    const entryUrl = version
      ? `${remoteEntry}${remoteEntry.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`
      : remoteEntry
    ensureRemoteRegistered(remoteName, entryUrl, String(scope || remoteName).trim())
    if (!loadedRemoteContainers.has(remoteName)) resetLegacyRemoteChunkScope()
    const mod = await mfLoadRemote(`${remoteName}/${exposedModule}`)
    if (!mod) throw new Error(`Không tìm thấy module "${module}" trong remote "${scope || remoteName}".`)
    loadedRemoteContainers.add(remoteName)
    return mod
  }

  const request = remoteLoadQueue.then(load, load)
  remoteLoadQueue = request.catch(() => undefined)
  return request
}

/**
 * @param {Array<{ name: string, entry: string }>} remoteList
 *
 * @example
 * const remotes = await fetch("/api/remotes").then(r => r.json())
 * registerRemoteList(remotes)
 */
export function registerRemoteList(remoteList) {
  ensureInit()

  const newRemotes = remoteList.filter((r) => !registeredRemotes.has(r.name))
  if (newRemotes.length === 0) {
    return
  }

  registerRemotes(newRemotes)
  newRemotes.forEach((r) => registeredRemotes.add(r.name))
}
