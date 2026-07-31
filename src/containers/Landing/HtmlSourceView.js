import { useCallback, useEffect, useState } from 'react'
import { Button, message, Space } from 'antd'
import { CopyOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import { formatLandingHtml, generateLandingHtml } from './landingHtml'

export const HtmlSourceView = ({ schema, active }) => {
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')

  const refresh = useCallback(() => {
    try {
      setHtml(generateLandingHtml(schema))
      setError('')
    } catch (nextError) {
      setError(nextError.message)
    }
  }, [schema])

  useEffect(() => {
    if (!active) return undefined
    const frame = window.requestAnimationFrame(refresh)
    return () => window.cancelAnimationFrame(frame)
  }, [active, refresh])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(html)
      message.success('Đã sao chép HTML.')
    } catch {
      message.error('Không thể sao chép HTML.')
    }
  }

  const download = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${String(schema?.name || 'landing-page').trim().replace(/[^a-zA-Z0-9-_]+/g, '-')}.html`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  if (!active) return null

  return (
    <div style={{ width: '100%', maxWidth: 1280, alignSelf: 'flex-start', background: '#11131a', borderRadius: 10, overflow: 'hidden', boxShadow: '0 16px 44px rgba(0,0,0,.18)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: '#1a1d27', borderBottom: '1px solid #303442' }}>
        <div>
          <strong style={{ color: '#fff' }}>HTML đã sinh</strong>
          <span style={{ color: '#9ea5b5', marginLeft: 10 }}>Chỉ đọc · nguồn chính vẫn là pageSchema</span>
        </div>
        <Space size={6}>
          <Button size="small" icon={<ReloadOutlined />} onClick={refresh}>Làm mới</Button>
          <Button size="small" icon={<CopyOutlined />} disabled={!html} onClick={copy}>Sao chép</Button>
          <Button size="small" type="primary" icon={<DownloadOutlined />} disabled={!html} onClick={download}>Tải HTML</Button>
        </Space>
      </div>
      {error ? (
        <div style={{ padding: 20, color: '#ff8d8d' }}>{error}</div>
      ) : (
        <pre style={{ margin: 0, minHeight: 520, maxHeight: 'calc(100vh - 190px)', overflow: 'auto', padding: 20, color: '#d8deeb', background: '#11131a', font: '12px/1.65 ui-monospace, SFMono-Regular, Menlo, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <code>{formatLandingHtml(html)}</code>
        </pre>
      )}
    </div>
  )
}
