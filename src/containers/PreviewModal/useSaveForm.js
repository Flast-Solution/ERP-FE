import { useState } from 'react'
import { message } from 'antd'

import {
  buildMicroFrontend,
  prepareJsxForRemoteBuild,
  toComponentName,
  toComponentSlug,
} from './buildService'

const useSaveForm = ({
  schema,
  liveSchema,
  syncError,
  sessionId,
  jsxCode,
  isDirty,
  onSave,
}) => {
  const [savingAfterBuild, setSavingAfterBuild] = useState(false)

  const saveAfterBuild = async () => {
    const effectiveSchema = liveSchema ?? schema

    if (syncError) {
      message.error(syncError)
      return
    }
    if (!sessionId) {
      message.error('Thiếu session_id để build preview.')
      return
    }

    const buildJsxCode = prepareJsxForRemoteBuild(jsxCode)
    const buildComponentId = toComponentSlug(effectiveSchema?.meta?.name)
    const entryFilename = `${toComponentName(effectiveSchema?.meta?.name)}.jsx`

    setSavingAfterBuild(true)
    try {
      const buildResult = await buildMicroFrontend({
        sessionId,
        componentId: buildComponentId,
        entryFilename,
        jsxCode: buildJsxCode,
      })

      if (!buildResult.previewUrl) {
        message.error('Build thành công nhưng server chưa trả URL micro-frontend.')
        return
      }

      await onSave?.({
        schema: effectiveSchema,
        jsxCode,
        syncError: '',
        isDirty,
        build: {
          componentId: buildResult.componentId ?? buildComponentId,
          url: buildResult.previewUrl,
          entryFilename,
        },
      })
    } catch (error) {
      if (!error?.formSaveHandled) message.error(error.message)
    } finally {
      setSavingAfterBuild(false)
    }
  }

  return { saveAfterBuild, savingAfterBuild }
}

export default useSaveForm
