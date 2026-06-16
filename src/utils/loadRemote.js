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

let initialized = false
const registeredRemotes = new Set()
 
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
    version: "5.21.5",
    scope: "default",
    lib: () => Antd,
    shareConfig: { singleton: true, requiredVersion: "^5.21.5" },
  },
  axios: {
    version: "0.27.2",
    scope: "default",
    lib: () => Axios,
    shareConfig: { singleton: true, requiredVersion: "^0.27.2" },
  },
  dayjs: {
    version: "1.11.13",
    scope: "default",
    lib: () => Dayjs,
    shareConfig: { singleton: true, requiredVersion: "^1.11.13" },
  },
  lodash: {
    version: "4.17.21",
    scope: "default",
    lib: () => Lodash,
    shareConfig: { singleton: true, requiredVersion: "^4.17.21" },
  },
  "styled-components": {
    version: "6.4.2",
    scope: "default",
    lib: () => StyledComponents,
    shareConfig: { singleton: true, requiredVersion: "^6.4.2" },
  },
  i18next: {
    version: "26.3.0",
    scope: "default",
    lib: () => I18next,
    shareConfig: { singleton: true, requiredVersion: "^26.3.0" },
  },
  "react-i18next": {
    version: "17.0.8",
    scope: "default",
    lib: () => ReactI18next,
    shareConfig: { singleton: true, requiredVersion: "^17.0.8" },
  },
  moment: {
    version: "2.30.1",
    scope: "default",
    lib: () => Moment,
    shareConfig: { singleton: true, requiredVersion: "^2.30.1" },
  },
  "jodit-react": {
    version: "5.2.31",
    scope: "default",
    lib: () => JoditReact,
    shareConfig: { singleton: true, requiredVersion: "^5.2.31" },
  },
  "query-string": {
    version: "9.4.0",
    scope: "default",
    lib: () => QueryString,
    shareConfig: { singleton: true, requiredVersion: "^9.4.0" },
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
}

function ensureInit() {
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

function ensureRemoteRegistered(componentId, entry) {
  ensureInit()
  if (registeredRemotes.has(componentId)) {
    return
  }

  registerRemotes(
    [{ name: componentId, entry }]
  )

  registeredRemotes.add(componentId)
}

/**
 * @param {string} componentId   - ID/name của remote container
 * @param {string} exposedModule - Tên module
 * @param {string} remoteBaseUrl - Base URL
 * @param {string} remoteEntryComponentId - ID/path chứa remoteEntry.js nếu khác remote container name
 *Ư
 * @example
 * const mod = await loadRemote("component_001", "MPage", "https://remote.aa.vn")
 * const MPage = mod.default
 */
export async function loadRemote(componentId, exposedModule, remoteBaseUrl, remoteEntryComponentId = componentId) {

  const entry = `${remoteBaseUrl}/${remoteEntryComponentId}/remoteEntry.js`
  ensureRemoteRegistered(componentId, entry)

  const mod = await mfLoadRemote(`${componentId}/${exposedModule}`)
  if (!mod) {
    throw new Error(
      `Module "${exposedModule}" không tìm thấy trong remote "${componentId}". ` +
      `Kiểm tra lại "exposes" trong craco.config.js của remote-app.`
    )
  }

  return mod
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
