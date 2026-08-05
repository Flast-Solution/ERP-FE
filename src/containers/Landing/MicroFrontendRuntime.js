import { useEffect, useState } from 'react'
import { Alert, Spin } from 'antd'
import axios from 'axios'
import { loadRemoteFromUrl } from '@/utils/loadRemote'
import { DATA_SOURCE_TYPES } from './microFrontendSchema'

export const readRuntimePath = (source, path) => {
  if (!path) return source
  return String(path).split('.').reduce((value, key) => value?.[key], source)
}

export const replaceRuntimeVariables = (value, context) => {
  if (Array.isArray(value)) return value.map(item => replaceRuntimeVariables(item, context))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceRuntimeVariables(item, context)])
    )
  }
  if (typeof value !== 'string') return value
  return value.replace(
    /\{\{\s*([^}]+)\s*\}\}/g,
    (_, path) => readRuntimePath(context, path.trim()) ?? ''
  )
}

const createRemoteAlias = item => {
  const source = `${item.key}-${item.remote?.url}`
  let hash = 0
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash) + source.charCodeAt(index)
  }
  return `web_${String(item.key || 'component').replace(/[^a-zA-Z0-9_]/g, '_')}_${Math.abs(hash)}`
}

export const resolveRemoteComponentData = async (item, context) => {
  const source = item.dataSource ?? {}
  if (source.type === DATA_SOURCE_TYPES.STATIC) return source.staticData ?? null
  if (source.type !== DATA_SOURCE_TYPES.API) return undefined

  const endpoint = replaceRuntimeVariables(source.endpoint, context)
  const params = replaceRuntimeVariables(source.params ?? {}, context)
  const method = String(source.method || 'GET').toUpperCase()
  const response = await axios.request({
    url: endpoint,
    method,
    ...(method === 'GET' ? { params } : { data: params }),
  })
  return readRuntimePath(response.data, source.responsePath)
}

export const RemoteComponentSlot = ({ item, resolvedData, runtimeContext }) => {
  const [Component, setComponent] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setComponent(null)
    setError('')
    loadRemoteFromUrl({
      name: createRemoteAlias(item),
      entry: item.remote?.url,
      scope: item.remote?.scope,
      module: item.remote?.module,
    }).then(module => {
      if (active) setComponent(() => module.default ?? module)
    }).catch(reason => {
      if (active) setError(reason?.message || 'Không tải được Micro Frontend.')
    })
    return () => { active = false }
  }, [item])

  if (error) return <Alert type="error" showIcon message={item.name} description={error} />
  if (!Component) {
    return (
      <div style={{ padding: 28, textAlign: 'center' }}>
        <Spin tip={`Đang tải ${item.name}...`} />
      </div>
    )
  }

  const dataProp = item.dataSource?.propName
  const props = {
    ...(item.props ?? {}),
    ...(dataProp ? { [dataProp]: resolvedData } : {}),
    dataContext: runtimeContext,
  }
  return <Component {...props} />
}
