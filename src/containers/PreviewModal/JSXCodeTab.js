import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from 'antd'
import {
  CheckOutlined,
  CopyOutlined,
  DeploymentUnitOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons'

import MonacoCodeEditor from './MonacoCodeEditor'
import {
  BUILD_WAIT_TIMEOUT_MS,
  buildMicroFrontend,
  getBuildPreviewUrl,
  prepareJsxForRemoteBuild,
  toComponentName,
  toComponentSlug,
} from './buildService'
import {
  BuildStatusBar,
  BuildStatusText,
  CodeEditorFallback,
  CodeEditorNotice,
  CodeEditorWrapper,
  CodePane,
  CodePath,
  CodeSubHead,
  CodeTextarea,
  CodeToolbar,
} from './index.style'

const buttonStyle = {
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: '#e2e8f0',
  fontSize: 11,
  height: 24,
}

const JSXCodeTab = ({
  schema,
  sessionId,
  jsxCode,
  setJsxCode,
  isEditable,
  setIsEditable,
  isDirty,
  setIsDirty,
  generatedCode,
  fieldKeys,
  syncError,
}) => {
  const [copied, setCopied] = useState(false)
  const [buildStatus, setBuildStatus] = useState('idle')
  const [buildMsg, setBuildMsg] = useState('')
  const [buildLogs, setBuildLogs] = useState([])
  const [previewUrl, setPreviewUrl] = useState('')
  const copyTimerRef = useRef(null)
  const buildingComponentIdRef = useRef(null)
  const buildTimeoutRef = useRef(null)
  const componentName = toComponentName(schema.meta?.name)
  const domain = schema.meta?.domain ?? 'step'
  const templateSlug = schema.meta?.name
    ? schema.meta.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    : 'form'
  const filePath = `forms/${templateSlug}_${domain}.jsx`

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsxCode)
    setCopied(true)
    clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 1400)
  }, [jsxCode])

  useEffect(() => {
    const clearBuildTimeout = () => {
      clearTimeout(buildTimeoutRef.current)
      buildTimeoutRef.current = null
    }

    const handleBuildEvent = (event) => {
      const payload = event.detail ?? {}
      const payloadComponentId = payload.component_id ?? payload.componentId
      if (!payloadComponentId || payloadComponentId !== buildingComponentIdRef.current) return

      const log = payload.log ?? payload.message ?? ''
      const nextPreviewUrl = getBuildPreviewUrl(payload)
      const status = payload.status ?? ''
      const isSuccess = status === 'done' || status === 'success'
      const isFailure = status === 'error' || status === 'failed'

      if (log) {
        setBuildLogs(current => [...current, log])
        setBuildMsg(log)
      }
      if (nextPreviewUrl) setPreviewUrl(nextPreviewUrl)

      if (isSuccess || nextPreviewUrl) {
        clearBuildTimeout()
        setBuildStatus('done')
        setBuildMsg(log || 'Build thành công')
      } else if (isFailure) {
        clearBuildTimeout()
        setBuildStatus('error')
        setBuildMsg(log || 'Build thất bại')
      } else {
        setBuildStatus('building')
        setBuildMsg(log || 'Đang build preview...')
      }
    }

    window.addEventListener('flast-ai-build', handleBuildEvent)
    return () => {
      clearBuildTimeout()
      window.removeEventListener('flast-ai-build', handleBuildEvent)
    }
  }, [])

  const handleBuild = useCallback(async () => {
    const previewComponentId = toComponentSlug(schema?.meta?.name)
    const buildJsxCode = prepareJsxForRemoteBuild(jsxCode)
    const entryFilename = `${toComponentName(schema?.meta?.name)}.jsx`
    buildingComponentIdRef.current = previewComponentId

    if (!sessionId) {
      setBuildStatus('error')
      setBuildMsg('Thiếu session_id để build preview.')
      return
    }

    setBuildStatus('building')
    setBuildLogs([])
    setPreviewUrl('')
    setBuildMsg('Đang gửi yêu cầu build...')
    clearTimeout(buildTimeoutRef.current)
    buildTimeoutRef.current = setTimeout(() => {
      if (buildingComponentIdRef.current !== previewComponentId) return
      setBuildStatus('error')
      setBuildMsg('Build quá lâu chưa có kết quả. Vui lòng thử lại hoặc kiểm tra log server.')
      buildingComponentIdRef.current = null
    }, BUILD_WAIT_TIMEOUT_MS)

    try {
      const response = await buildMicroFrontend({
        sessionId,
        componentId: previewComponentId,
        entryFilename,
        jsxCode: buildJsxCode,
      })
      const url = response.previewUrl
      const status = response.status ?? ''
      setPreviewUrl(url)
      if (url || status === 'done' || status === 'success') {
        clearTimeout(buildTimeoutRef.current)
        buildTimeoutRef.current = null
        setBuildStatus('done')
        setBuildMsg('Build thành công')
      } else {
        setBuildStatus('building')
        setBuildMsg(response.message ?? 'Đã gửi yêu cầu build. Đang chờ server trả preview...')
      }
    } catch (error) {
      clearTimeout(buildTimeoutRef.current)
      buildTimeoutRef.current = null
      setBuildStatus('error')
      setBuildMsg(error.message)
    }
  }, [sessionId, jsxCode, schema])

  return (
    <CodePane>
      <CodeSubHead>
        <CodePath>{filePath} · component `{componentName}`</CodePath>
        <CodeToolbar>
          <Button
            size="small"
            onClick={() => setIsEditable(current => !current)}
            style={{ ...buttonStyle, color: isEditable ? '#86efac' : '#e2e8f0' }}
          >
            {isEditable ? 'Tắt chỉnh sửa' : 'Bật chỉnh sửa'}
          </Button>
          <Button
            size="small"
            onClick={() => {
              setJsxCode(generatedCode)
              setIsDirty(false)
            }}
            disabled={!isDirty}
            style={buttonStyle}
          >
            Reset schema
          </Button>
          <Button
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            style={{ ...buttonStyle, color: copied ? '#86efac' : '#e2e8f0' }}
          >
            {copied ? 'Đã copy' : 'Copy'}
          </Button>
        </CodeToolbar>
      </CodeSubHead>

      <CodeEditorWrapper>
        <MonacoCodeEditor
          value={jsxCode}
          readOnly={!isEditable}
          fieldKeys={fieldKeys}
          onChange={nextValue => {
            setJsxCode(nextValue)
            setIsDirty(nextValue !== generatedCode)
          }}
          fallback={loadError => (
            <CodeEditorFallback>
              <CodeEditorNotice>
                Monaco khong tai duoc. Dang fallback ve textarea. {loadError}
              </CodeEditorNotice>
              <CodeTextarea
                value={jsxCode}
                onChange={event => {
                  setJsxCode(event.target.value)
                  setIsDirty(event.target.value !== generatedCode)
                }}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                readOnly={!isEditable}
              />
            </CodeEditorFallback>
          )}
        />
      </CodeEditorWrapper>

      <BuildStatusBar>
        <BuildStatusText $status={buildStatus}>
          {buildStatus === 'building' && <LoadingOutlined spin />}
          {buildStatus === 'error' && <WarningOutlined />}
          {buildStatus === 'done' && <CheckOutlined />}
          {buildMsg || (syncError
            ? `Code da duoc luu, nhung chua parse nguoc duoc sang Form thuc: ${syncError}`
            : buildStatus === 'idle'
              ? 'Sua code roi bam Build de xem truoc'
              : '')}
          {buildLogs.length > 0 && buildStatus === 'building' ? ` (${buildLogs.length} log)` : ''}
        </BuildStatusText>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {buildStatus === 'done' && previewUrl && (
            <Button
              size="small"
              style={{ ...buttonStyle, color: '#86efac' }}
              onClick={() => window.open(previewUrl, '_blank')}
            >
              Xem preview ↗
            </Button>
          )}
          <Button
            size="small"
            type="primary"
            icon={buildStatus === 'building' ? <LoadingOutlined spin /> : <DeploymentUnitOutlined />}
            onClick={handleBuild}
            disabled={buildStatus === 'building' || !jsxCode.trim()}
            style={{ height: 24, fontSize: 11 }}
          >
            Build preview
          </Button>
        </div>
      </BuildStatusBar>
    </CodePane>
  )
}

export default JSXCodeTab
