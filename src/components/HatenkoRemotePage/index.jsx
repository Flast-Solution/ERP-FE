import React, { Component, Suspense, lazy, useMemo, useState } from 'react'
import { Result, Button } from 'antd'
import { Loading } from '@flast-erp/core/components'
import { loadRemoteFromUrl } from '@/utils/loadRemote'
import { loadRemote, registerRemoteList } from '@/utils/loadRemote'
import { useNavigate } from 'react-router-dom'
import { RequestUtils, InAppEvent } from '@flast-erp/core/utils'
import { TenantRuntimeProvider, TENANT_RUNTIME_VERSION } from '@erp/tenant-runtime'
import useGetMe from '@/hooks/useGetMe'
import { useWorkflowDrawer } from '@/contexts/WorkflowDrawerContext'
import { GATEWAY } from '@/configs'

function RemoteUnavailable({ onRetry, onHome }) {
  return <Result status="warning" title="Không tải được màn hình Hatenko"
    subTitle="Màn hình hiện chưa sẵn sàng. Bạn có thể thử lại hoặc về trang chủ để tiếp tục sử dụng ERP."
    extra={[
      <Button type="primary" key="retry" onClick={onRetry}>Thử lại</Button>,
      <Button key="home" onClick={onHome}>Về trang chủ</Button>,
    ]} />
}

class RemoteErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return <RemoteUnavailable onRetry={this.props.onRetry} onHome={this.props.onHome} />
    }
    return this.props.children
  }
}

export default function HatenkoRemotePage({ page, ...props }) {
  const session = useGetMe()
  const workflows = useWorkflowDrawer()
  const navigate = useNavigate()
  const runtime = useMemo(() => ({
    version: TENANT_RUNTIME_VERSION,
    session,
    request: RequestUtils,
    events: InAppEvent,
    remotes: { loadRemote, loadRemoteFromUrl, registerRemoteList },
    workflows,
    navigation: { navigate },
    config: { apiBaseUrl: GATEWAY },
  }), [session, workflows, navigate])
  const [attempt, setAttempt] = useState(0)
  const RemotePage = useMemo(() => lazy(async () => {
    try {
      const version = process.env.REACT_APP_HATENKO_REMOTE_VERSION || ''
      const remote = await loadRemoteFromUrl({
        name: `hatenko${version ? `_${version}` : ''}`,
        scope: 'hatenko',
        entry: process.env.REACT_APP_HATENKO_REMOTE_ENTRY || '/remotes/hatenko/remoteEntry.js',
        module: page,
        version,
        force: attempt > 0,
      })
      if (!remote?.default) throw new Error(`Remote Hatenko thiếu export default: ${page}`)
      return remote
    } catch {
      // Resolve failed loads to UI instead of throwing during React rendering.
      // Rejected lazy imports otherwise trigger the development error overlay.
      return { default: () => <RemoteUnavailable
        onRetry={() => setAttempt(value => value + 1)} onHome={() => navigate('/')} /> }
    }
  }), [page, attempt, navigate])

  return <RemoteErrorBoundary key={`${page}-${attempt}`} onRetry={() => setAttempt(value => value + 1)}
    onHome={() => navigate('/')}>
    <TenantRuntimeProvider runtime={runtime}>
      <Suspense fallback={<Loading />}><RemotePage {...props} /></Suspense>
    </TenantRuntimeProvider>
  </RemoteErrorBoundary>
}
