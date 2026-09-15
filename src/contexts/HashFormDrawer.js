import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Drawer, Empty, Modal, Spin, message } from 'antd'
import { useLocation } from 'react-router-dom'

import { RequestUtils } from '@flast-erp/core/utils'
import {
  RemoteFormBoundary,
  RemoteFormErrorFallback,
  RemoteFormHost,
  useRemoteForm,
} from '@/pages/order/progress/RemoteForm'

const FORM_TEMPLATE_DETAIL_API = '/workflow/forms/template/find-id'

// #d_:id mở form được cấu hình DRAWER, #m_:id mở form được cấu hình MODAL.
// Dạng cũ #id không còn được nhận để tránh tự mở form ngoài ý muốn.
export const getFormRequestFromHash = (hash = '') => {
  const matched = String(hash).match(/^#([dm])_(\d+)$/i)
  if (!matched) return null

  return {
    formId: matched[2],
    displayMode: matched[1].toLowerCase() === 'd' ? 'DRAWER' : 'MODAL',
  }
}

export const getFormIdFromHash = (hash = '') => getFormRequestFromHash(hash)?.formId ?? null

export const openFormByHash = (formId, displayMode = 'DRAWER') => {
  if (!/^\d+$/.test(String(formId ?? ''))) return false
  const normalizedMode = String(displayMode).toUpperCase()
  const prefix = normalizedMode === 'DRAWER' ? 'd' : normalizedMode === 'MODAL' ? 'm' : null
  if (!prefix) return false

  window.location.hash = `${prefix}_${formId}`
  return true
}

const removeFormHash = () => {
  const nextUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState(window.history.state, '', nextUrl)
}

const HashFormDrawer = () => {
  const location = useLocation()
  const formRequest = useMemo(() => getFormRequestFromHash(location.hash), [location.hash])
  const formId = formRequest?.formId ?? null
  const requestedDisplayMode = formRequest?.displayMode ?? null
  const requestSequenceRef = useRef(0)
  const [open, setOpen] = useState(false)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [template, setTemplate] = useState(null)
  const [templateError, setTemplateError] = useState('')

  const remoteEntry = template?.sourceComponent?.microFrontendUrl
    ?? template?.microFrontendUrl
    ?? ''
  const remoteVersionKey = [
    template?.id,
    template?.sourceComponent?.id,
    template?.sourceComponent?.version,
    template?.sourceComponent?.updatedDate,
  ].filter(Boolean).join('-')
  const {
    Component: RemoteForm,
    loading: loadingRemote,
    error: remoteError,
  } = useRemoteForm(remoteEntry, remoteVersionKey)

  useEffect(() => {
    if (!formId) {
      requestSequenceRef.current += 1
      setOpen(false)
      setTemplate(null)
      setTemplateError('')
      return undefined
    }

    const requestSequence = requestSequenceRef.current + 1
    requestSequenceRef.current = requestSequence
    setOpen(false)
    setLoadingTemplate(true)
    setTemplate(null)
    setTemplateError('')

    RequestUtils.Get(FORM_TEMPLATE_DETAIL_API, { id: formId })
      .then((response) => {
        if (requestSequenceRef.current !== requestSequence) return

        const nextTemplate = response?.data ?? response
        if (!nextTemplate || typeof nextTemplate !== 'object') {
          throw new Error(response?.message || `Không tìm thấy form có ID ${formId}.`)
        }

        const configuredDisplayMode = String(
          nextTemplate.displayMode
          ?? nextTemplate.displayType
          ?? nextTemplate.viewType
          ?? 'NORMAL',
        ).toUpperCase()

        if (configuredDisplayMode !== requestedDisplayMode) {
          message.warning(
            configuredDisplayMode === 'NORMAL'
              ? `Form #${formId} được cấu hình hiển thị bình thường.`
              : `Form #${formId} được cấu hình kiểu ${configuredDisplayMode}, không phải ${requestedDisplayMode}.`,
          )
          removeFormHash()
          return
        }

        setTemplate(nextTemplate)
        setOpen(true)
      })
      .catch((error) => {
        if (requestSequenceRef.current !== requestSequence) return
        const errorMessage = error?.response?.data?.message
          || error?.message
          || `Không tải được form có ID ${formId}.`
        setTemplateError(errorMessage)
        message.error(errorMessage)
        removeFormHash()
      })
      .finally(() => {
        if (requestSequenceRef.current === requestSequence) {
          setLoadingTemplate(false)
        }
      })

    return () => {
      if (requestSequenceRef.current === requestSequence) {
        requestSequenceRef.current += 1
      }
    }
  }, [formId, requestedDisplayMode])

  const closeOverlay = () => {
    requestSequenceRef.current += 1
    setOpen(false)
    setLoadingTemplate(false)
    setTemplate(null)
    setTemplateError('')
    removeFormHash()
  }

  const remoteRenderKey = `${formId ?? 'form'}-${remoteVersionKey || remoteEntry}`

  const overlayContent = (
    <>
      {loadingTemplate && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin tip="Đang tải cấu hình form..." />
        </div>
      )}

      {!loadingTemplate && templateError && (
        <Alert type="error" showIcon message="Không mở được form" description={templateError} />
      )}

      {!loadingTemplate && template && !remoteEntry && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Form chưa được cấu hình microFrontendUrl."
        />
      )}

      {!loadingTemplate && remoteEntry && loadingRemote && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin tip="Đang tải giao diện form..." />
        </div>
      )}

      {!loadingTemplate && remoteEntry && remoteError && (
        <RemoteFormErrorFallback message={remoteError} />
      )}

      {!loadingTemplate && remoteEntry && RemoteForm && (
        <RemoteFormBoundary key={remoteRenderKey} remoteKey={remoteRenderKey}>
          <RemoteFormHost
            key={remoteRenderKey}
            Component={RemoteForm}
            allowSubmit={false}
            formTemplate={template}
            data={{}}
            record={{}}
            initialValues={{}}
            values={{}}
            defaultValues={{}}
            hideTitle
            showTitle={false}
          />
        </RemoteFormBoundary>
      )}
    </>
  )

  const title = template?.name || (formId ? `Form #${formId}` : 'Biểu mẫu')

  if (requestedDisplayMode === 'MODAL') {
    return (
      <Modal
        title={title}
        open={open}
        width="min(960px, calc(100vw - 32px))"
        footer={null}
        destroyOnHidden
        onCancel={closeOverlay}
      >
        {overlayContent}
      </Modal>
    )
  }

  return (
    <Drawer
      title={title}
      open={open && requestedDisplayMode === 'DRAWER'}
      width="min(960px, 100vw)"
      destroyOnHidden
      onClose={closeOverlay}
    >
      {overlayContent}
    </Drawer>
  )
}

export default HashFormDrawer
