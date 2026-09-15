import { useEffect, useMemo, useRef, useState } from 'react'

import { buildJSX } from './buildJSX'
import { parseJsxToSchema } from './parseJSXSchema'
import { shouldPreferGeneratedCode } from './buildService'

const usePreviewCode = ({ open, schema, initialJsxCode, onJsxCodeChange }) => {
  const generatedCode = useMemo(() => buildJSX(schema).plain, [schema])
  const [jsxCode, setJsxCode] = useState(initialJsxCode || generatedCode)
  const [isEditable, setIsEditable] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [liveSchema, setLiveSchema] = useState(schema)
  const [syncError, setSyncError] = useState('')
  const prevGeneratedCodeRef = useRef(generatedCode)
  const lastParsedKeyRef = useRef('')
  const lastNotifiedJsxRef = useRef(initialJsxCode || generatedCode)
  const lastSchemaKeyRef = useRef(JSON.stringify(schema ?? {}))
  const fieldKeys = useMemo(
    () => (liveSchema?.fields ?? []).map(field => field.fieldKey).filter(Boolean),
    [liveSchema],
  )

  useEffect(() => {
    if (!open) return

    const prevGeneratedCode = prevGeneratedCodeRef.current
    const shouldUpgradeGeneratedCode = shouldPreferGeneratedCode({
      initialCode: initialJsxCode,
      generatedCode,
    })
    const hasCustomCode = Boolean(initialJsxCode)
      && initialJsxCode !== prevGeneratedCode
      && !shouldUpgradeGeneratedCode
    const nextSchemaKey = JSON.stringify(schema ?? {})

    if (!isDirty) {
      const nextJsxCode = hasCustomCode ? initialJsxCode : generatedCode
      setJsxCode(current => current === nextJsxCode ? current : nextJsxCode)
      if (lastSchemaKeyRef.current !== nextSchemaKey) {
        lastSchemaKeyRef.current = nextSchemaKey
        setLiveSchema(schema)
      }
      setSyncError(current => current === '' ? current : '')
    }

    prevGeneratedCodeRef.current = generatedCode
  }, [open, initialJsxCode, generatedCode, schema, isDirty])

  useEffect(() => {
    if (!open) return

    if (!isDirty) {
      setSyncError(current => current === '' ? current : '')
      return
    }

    try {
      const parseKey = `${jsxCode}::${JSON.stringify(schema?.meta ?? {})}`
      if (lastParsedKeyRef.current === parseKey) return
      lastParsedKeyRef.current = parseKey
      const parsed = parseJsxToSchema(jsxCode, schema.meta)
      setLiveSchema(parsed)
      setSyncError(current => current === '' ? current : '')
    } catch (error) {
      const nextError = error.message || 'Khong parse duoc JSX.'
      setSyncError(current => current === nextError ? current : nextError)
    }
  }, [open, jsxCode, schema, isDirty])

  useEffect(() => {
    if (!open || jsxCode === initialJsxCode) return
    if (lastNotifiedJsxRef.current === jsxCode) return
    lastNotifiedJsxRef.current = jsxCode
    onJsxCodeChange?.(jsxCode)
  }, [open, initialJsxCode, jsxCode, onJsxCodeChange])

  return {
    effectiveSchema: liveSchema ?? schema,
    fieldKeys,
    generatedCode,
    isDirty,
    isEditable,
    jsxCode,
    liveSchema,
    setIsDirty,
    setIsEditable,
    setJsxCode,
    syncError,
  }
}

export default usePreviewCode
