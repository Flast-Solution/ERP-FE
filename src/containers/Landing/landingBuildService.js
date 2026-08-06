import {
  buildMicroFrontend,
  toComponentName,
  toComponentSlug,
} from '@/containers/PreviewModal/buildService'
import { CUSTOM_JSX_TYPE, validateCustomJsxSource } from './customJsx'

const stripEditorSource = schema => {
  const output = JSON.parse(JSON.stringify(schema))
  const clean = item => {
    if (item?.props) delete item.props.source
    delete item.artifact
    return item
  }
  output.sections = (output.sections ?? []).map(clean)
  output.overlays = (output.overlays ?? []).map(clean)
  return output
}

const collectCustomDefinitions = schema => {
  const definitions = new Map()
  ;[...(schema?.sections ?? []), ...(schema?.overlays ?? [])].forEach(item => {
    if (item?.type !== CUSTOM_JSX_TYPE || !item.definitionId || definitions.has(item.definitionId)) return
    const source = String(item.props?.source || '')
    const errors = validateCustomJsxSource(source)
    if (errors.length) throw new Error(`${item.props?.name || item.id}: ${errors[0]}`)
    definitions.set(item.definitionId, { source, name: item.props?.name || item.id })
  })
  return [...definitions.entries()]
}

const createLandingBuildFiles = ({ schema, entryFilename }) => {
  const definitions = collectCustomDefinitions(schema)
  const imports = []
  const registry = []
  const files = {}

  definitions.forEach(([definitionId, definition], index) => {
    const variable = `CustomBlock${index}`
    const filename = `custom-block-${index}.jsx`
    imports.push(`import ${variable} from './${filename}'`)
    registry.push(`${JSON.stringify(definitionId)}: ${variable}`)
    files[filename] = definition.source
  })

  const runtimeSchema = stripEditorSource(schema)
  files[entryFilename] = `import React from 'react'
${imports.join('\n')}

const pageSchema = ${JSON.stringify(runtimeSchema, null, 2)}
const customComponents = {${registry.join(',\n')}}

const LandingPage = () => {
  const LandingPageRenderer = window.__FLAST_WEB_RUNTIME__?.LandingPageRenderer
  if (!LandingPageRenderer) {
    return (
      <div style={{ padding: 24, color: '#b42318', fontFamily: 'sans-serif' }}>
        Không tìm thấy Landing runtime trên ứng dụng host.
      </div>
    )
  }
  return (
    <LandingPageRenderer
      schema={pageSchema}
      customComponents={customComponents}
      mode="runtime"
    />
  )
}

export default LandingPage
`
  return files
}

export const buildLandingPage = async ({ pageId, schema, sessionId }) => {
  const componentId = toComponentSlug(`landing_${pageId}`)
  const entryFilename = `${toComponentName(`landing_${pageId}`)}.jsx`
  const files = createLandingBuildFiles({ schema, entryFilename })
  const result = await buildMicroFrontend({
    sessionId,
    componentId,
    entryFilename,
    files,
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
