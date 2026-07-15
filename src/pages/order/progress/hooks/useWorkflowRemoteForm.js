import { useCallback, useEffect, useRef, useState } from 'react'
import { message } from 'antd'

import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import { WORKFLOW_SUBMISSION_API } from '../constants'
import {
  buildRemoteAlias,
  buildWorkflowSubmissionPayload,
} from '../workflowHelpers'
import {
  hideDuplicatedRemoteFormTitle,
  useRemoteForm,
} from '../RemoteForm'

export const useWorkflowRemoteForm = ({
  currentForm,
  displayForm,
  currentStep,
  displayStep,
  workflowPreview,
  refreshWorkflow,
  syncWorkflowInstance,
}) => {
  const remoteFormRef = useRef(null)
  const remoteFormContainerRef = useRef(null)
  const [submittingForm, setSubmittingForm] = useState(false)

  const sourceComponent = displayForm?.sourceComponent
  const currentFormName = displayForm?.name ?? displayStep?.name ?? null
  const remoteEntry = sourceComponent?.microFrontendUrl
  const remoteComponentId = sourceComponent?.componentId

  const remoteVersionKey = buildRemoteAlias(
    displayForm?.id,
    sourceComponent?.version,
    sourceComponent?.updatedDate,
    displayStep?.stepCode,
  )

  const remoteRenderKey = buildRemoteAlias(remoteComponentId, remoteEntry, remoteVersionKey)

  const { Component: RemoteForm, loading: loadingRemote, error: remoteError } = useRemoteForm(
    remoteEntry,
    remoteComponentId,
    remoteVersionKey,
  )

  useEffect(() => {
    const container = remoteFormContainerRef.current
    if (!container || !currentFormName) return undefined

    hideDuplicatedRemoteFormTitle(container, currentFormName)

    const observer = new MutationObserver(() => {
      hideDuplicatedRemoteFormTitle(container, currentFormName)
    })
    observer.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      container
        .querySelectorAll('[data-progress-hidden-title="true"]')
        .forEach((element) => {
          element.style.display = ''
          delete element.dataset.progressHiddenTitle
        })
    }
  }, [currentFormName, remoteRenderKey])

  const handleRemoteFormSubmit = useCallback(async (values) => {
    const payload = buildWorkflowSubmissionPayload({
      values,
      currentForm,
      currentStep,
      workflowPreview,
    })

    if (!payload.templateId) {
      message.error('Không tìm thấy templateId của form.')
      return
    }
    if (!payload.processStepId) {
      message.error('Không tìm thấy processStepId của bước hiện tại.')
      return
    }
    if (!payload.entityId) {
      message.error('Không tìm thấy entityId của đơn hàng.')
      return
    }
    if (!payload.instanceId) {
      message.error('Không tìm thấy instanceId của workflow.')
      return
    }
    if (!payload.stepCode) {
      message.error('Không tìm thấy stepCode của bước hiện tại.')
      return
    }

    setSubmittingForm(true)
    try {
      const response = await RequestUtils.Post(WORKFLOW_SUBMISSION_API, payload)
      const ok = response?.success || Number(response?.errorCode) === SUCCESS_CODE
      if (!ok) {
        message.error(response?.message || 'Không lưu được dữ liệu form.')
        return
      }

      message.success(response?.message || 'Đã lưu dữ liệu form.')
      const preview = await refreshWorkflow({ silent: true })
      if (preview?.processInstance) {
        syncWorkflowInstance?.(preview.processInstance)
      }
    } catch (error) {
      message.error(error?.message || 'Không lưu được dữ liệu form.')
    } finally {
      setSubmittingForm(false)
    }
  }, [
    currentForm,
    currentStep,
    workflowPreview,
    refreshWorkflow,
    syncWorkflowInstance,
  ])

  const handleRemoteFormSubmitError = useCallback((error) => {
    if (error?.errorFields) {
      message.warning('Vui lòng nhập đầy đủ thông tin bắt buộc.')
      return
    }
    message.error(error?.message || 'Không lấy được dữ liệu form.')
  }, [])

  const submitCurrentForm = useCallback(async () => {
    if (!RemoteForm) {
      message.error('Remote form chưa sẵn sàng.')
      return
    }

    if (!remoteFormRef.current || typeof remoteFormRef.current.submit !== 'function') {
      message.error('Remote form chưa hỗ trợ submit từ component cha.')
      return
    }

    try {
      await remoteFormRef.current.submit()
    } catch (error) {
      if (error?.remoteFormHandled) {
        return
      }
      handleRemoteFormSubmitError(error)
    }
  }, [RemoteForm, handleRemoteFormSubmitError])

  return {
    remoteFormRef,
    remoteFormContainerRef,
    currentFormName,
    remoteEntry,
    remoteRenderKey,
    RemoteForm,
    loadingRemote,
    remoteError,
    submittingForm,
    handleRemoteFormSubmit,
    handleRemoteFormSubmitError,
    submitCurrentForm,
  }
}
