import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Alert } from 'antd'
import { loadRemote } from '@/utils/loadRemote'
import { buildRemoteAlias, normalizeRemoteContainerName } from './utils'

export const getRemoteConfigFromEntry = (remoteEntry, remoteComponentId, remoteVersionKey) => {
  if (!remoteEntry) {
    return null
  }

  try {
    const url = new URL(remoteEntry)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const entryIndex = pathParts.findIndex(part => part === 'remoteEntry.js')
    const remoteEntryComponentId = pathParts[entryIndex - 1] ?? pathParts[0]

    if (!remoteEntryComponentId) {
      return null
    }

    const entryGlobalName = normalizeRemoteContainerName(remoteComponentId || remoteEntryComponentId)
    const componentId = buildRemoteAlias(entryGlobalName, remoteVersionKey)

    return {
      componentId,
      entryGlobalName,
      remoteBaseUrl: url.origin,
      remoteEntryComponentId,
    }
  } catch (error) {
    return null
  }
}

export const useRemoteForm = (remoteEntry, remoteComponentId, remoteVersionKey) => {
  const remoteRequestKey = buildRemoteAlias(remoteEntry, remoteComponentId, remoteVersionKey)
  const [ loadedRemote, setLoadedRemote ] = useState({ key: null, Component: null })
  const [ loading, setLoading ] = useState(false)
  const [ error, setError ] = useState('')

  useEffect(() => {
    const remoteConfig = getRemoteConfigFromEntry(remoteEntry, remoteComponentId, remoteVersionKey)
    let mounted = true

    setLoadedRemote({ key: null, Component: null })
    setError('')

    if (!remoteConfig) {
      return () => {
        mounted = false
      }
    }

    setLoading(true)
    loadRemote(
      remoteConfig.componentId,
      'MPage',
      remoteConfig.remoteBaseUrl,
      remoteConfig.remoteEntryComponentId,
      remoteConfig.entryGlobalName,
      remoteVersionKey
    )
      .then(mod => {
        const RemoteComponent = mod?.default ?? mod
        if (typeof RemoteComponent !== 'function' && typeof RemoteComponent !== 'object') {
          throw new Error('Remote module không export component hợp lệ.')
        }

        if (mounted) {
          setLoadedRemote({
            key: remoteRequestKey,
            Component: RemoteComponent,
          })
        }
      })
      .catch((loadError) => {
        if (mounted) {
          setLoadedRemote({ key: null, Component: null })
          setError(loadError?.message || 'Không tải được remote component của form bước hiện tại.')
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [remoteEntry, remoteComponentId, remoteVersionKey, remoteRequestKey])

  return {
    Component: loadedRemote.key === remoteRequestKey ? loadedRemote.Component : null,
    loading,
    error,
  }
}

export const RemoteFormErrorFallback = ({ message }) => (
  <Alert
    type="warning"
    showIcon
    message={message}
  />
)

export const hideDuplicatedRemoteFormTitle = (container, title) => {
  const normalizedTitle = String(title ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
  if (!container || !normalizedTitle) return

  const candidates = Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div,span,label'))
  const duplicateTitleElement = candidates.find((element) => {
    if (element.closest('.ant-card-head')) return false
    if (element.closest('.ant-form-item-control')) return false
    if (element.closest('.ant-radio-wrapper')) return false
    if (element.querySelector('input,textarea,select,button,.ant-radio,.ant-checkbox,.ant-form-item-control')) return false

    const text = String(element.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
    if (!text) return false

    return text === normalizedTitle || text.includes(normalizedTitle) || normalizedTitle.includes(text)
  })

  if (duplicateTitleElement) {
    duplicateTitleElement.dataset.progressHiddenTitle = 'true'
    duplicateTitleElement.style.display = 'none'
  }
}

export const RemoteFormHost = forwardRef(({ Component, allowSubmit = true, ...props }, ref) => {
  const [submitSignal, setSubmitSignal] = useState(null)

  useImperativeHandle(ref, () => (
    allowSubmit
      ? {
          submit: async () => {
            setSubmitSignal((signal) => (signal ?? 0) + 1)
          },
        }
      : {}
  ), [allowSubmit])

  if (!Component) {
    return null
  }

  return (
    <Component
      {...props}
      submitSignal={allowSubmit ? submitSignal : undefined}
    />
  )
})

RemoteFormHost.displayName = 'RemoteFormHost'

export class RemoteFormBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.remoteKey !== this.props.remoteKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return <RemoteFormErrorFallback message="Remote component bị lỗi khi render." />
    }

    return this.props.children
  }
}
