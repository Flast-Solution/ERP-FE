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

export const buildLandingPage = async ({ pageId, schema, sessionId }) => {
  const html = generateLandingHtml(schema)
  const componentId = toComponentSlug(`landing_${pageId}`)
  const entryFilename = `${toComponentName(`landing_${pageId}`)}.jsx`
  const jsxCode = createLandingBuildCode({ html, title: schema?.name })
  const result = await buildMicroFrontend({
    sessionId,
    componentId,
    entryFilename,
    jsxCode,
  })

  if (!result.previewUrl) {
    throw new Error('Build đã được tiếp nhận nhưng server chưa trả URL Micro Frontend.')
  }

  return {
    componentId: result.componentId ?? componentId,
    remoteEntryUrl: result.previewUrl,
    entryFilename,
    builtAt: new Date().toISOString(),
  }
}
