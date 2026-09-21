import { Alert, Spin } from 'antd'

import {
  RemoteFormBoundary,
  RemoteFormHost,
  useRemoteForm,
} from '@/pages/order/progress/RemoteForm'

const RemoteFormPreview = ({ remoteEntry, previewVersion, viewport = 'desktop' }) => {
  const remoteVersionKey = previewVersion || remoteEntry
  const { Component, loading, error } = useRemoteForm(
    remoteEntry,
    remoteVersionKey,
    { forceReload: Boolean(previewVersion) }
  )
  const width = viewport === 'mobile' ? 360 : 720

  return (
    <div
      style={{
        width: '100%',
        maxWidth: width,
        minHeight: 320,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        overflow: 'auto',
        transition: 'max-width 0.2s ease',
      }}
    >
      {loading && (
        <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin tip="Đang tải form thực..." />
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: 20 }}>
          <Alert type="warning" showIcon message="Không tải được form thực" description={error} />
        </div>
      )}

      {!loading && !error && Component && (
        <RemoteFormBoundary remoteKey={remoteVersionKey}>
          <RemoteFormHost
            Component={Component}
            allowSubmit={false}
            initialValues={{}}
            data={{}}
            record={{}}
            order={{}}
            hideTitle={false}
            showTitle
            canSubmit={false}
            showSubmit={false}
            hideSubmit
            submitDisabled
          />
        </RemoteFormBoundary>
      )}
    </div>
  )
}

export default RemoteFormPreview
