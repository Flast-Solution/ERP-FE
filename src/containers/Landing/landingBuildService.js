import {
  buildMicroFrontend,
  toComponentName,
  toComponentSlug,
} from '@/containers/PreviewModal/buildService'
import { generateLandingHtml } from './landingHtml'

const createLandingBuildCode = ({ html, title }) => `import React from 'react'

const landingHtml = ${JSON.stringify(html)}

const LandingPage = () => (
  <iframe
    title=${JSON.stringify(title || 'Landing page')}
    srcDoc={landingHtml}
    style={{ width: '100%', minHeight: '100vh', border: 0, display: 'block' }}
  />
)

export default LandingPage
`

export const buildLandingPage = async ({ pageId, schema, sessionId, allowHtmlFallback = false }) => {
  const html = generateLandingHtml(schema, { allowFallback: allowHtmlFallback })
  const componentId = toComponentSlug(`landing_${pageId}`)
  const entryFilename = `${toComponentName(`landing_${pageId}`)}.jsx`
  const jsxCode = createLandingBuildCode({ html, title: schema?.name })
  const result = await buildMicroFrontend({
    sessionId,
    componentId,
    entryFilename,
    jsxCode,
  })

  const url = result?.url || result?.data?.url || result?.previewUrl || ''
  const resolvedComponentId = result?.component_id || result?.data?.component_id || result?.componentId || componentId

  if (!url) {
    throw new Error('Build thành công nhưng server chưa trả data.url.')
  }

  return {
    component_id: resolvedComponentId,
    url,
    entryFilename,
    builtAt: new Date().toISOString(),
  }
}
