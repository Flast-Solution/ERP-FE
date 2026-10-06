import React, { useEffect, useState } from 'react'

const PdfPreview = ({ buffer, name }) => {
  const [preview, setPreview] = useState(null)
  useEffect(() => {
    // A PDF blob lets the browser preview files even when the API forces download.
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }))
    setPreview({ buffer, url })
    return () => URL.revokeObjectURL(url)
  }, [buffer])
  if (preview?.buffer !== buffer) return null
  return <iframe src={preview.url} title={name || 'Xem PDF'}
    style={{ width: '100%', height: '80vh', border: 0 }} />
}
export default PdfPreview
