import React, { useEffect, useRef, useState } from 'react'
import { Alert, Spin } from 'antd'

const FRAME_HTML = '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#f3f4f6}.docx-wrapper{padding:16px!important}</style></head><body><div id="styles"></div><div id="document"></div></body></html>'

const DocxPreview = ({ buffer, name }) => {
  const frameRef = useRef(null)
  const [ready, setReady] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!ready) return undefined
    let active = true
    const frame = ready
    const container = frame.getElementById('document')
    const styles = frame.getElementById('styles')
    if (!container || !styles) return undefined
    const render = async () => {
      setLoading(true)
      setError('')
      try {
        const { renderAsync } = await import('docx-preview')
        if (!active) return
        await renderAsync(buffer, container, styles, {
          useBase64URL: true, renderAltChunks: false, ignoreLastRenderedPageBreak: false,
          renderHeaders: true, renderFooters: true, renderFootnotes: true, breakPages: true,
        })
        if (active) setLoading(false)
      } catch {
        if (active) { setLoading(false); setError('Không đọc được nội dung Word.') }
      }
    }
    const preventNavigation = event => { if (event.target.closest('a')) event.preventDefault() }
    frame.addEventListener('click', preventNavigation)
    render()
    return () => {
      active = false
      frame.removeEventListener('click', preventNavigation)
      container.replaceChildren()
      styles.replaceChildren()
    }
  }, [buffer, ready])
  return <div>
    {loading && !error && <div style={{ padding: 16, textAlign: 'center' }}><Spin /></div>}
    {error && <Alert type="error" showIcon message={error} />}
    <iframe ref={frameRef} title={name || 'Xem Word'} sandbox="allow-same-origin"
      srcDoc={FRAME_HTML} onLoad={() => {
        const document = frameRef.current.contentDocument
        if (document?.getElementById('document')) setReady(document)
      }} style={{ width: '100%', height: '80vh', border: 0 }} />
  </div>
}
export default DocxPreview
