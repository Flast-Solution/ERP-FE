import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'

import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import {
  PROCESS_TYPE_FIND_API,
  WORKFLOW_PREVIEW_API,
  WORKFLOW_PROCESS_FIND_API,
  WORKFLOW_TRANSITION_API,
} from '../constants'
import {
  buildProcessTypeLabelMap,
  buildStepTransitionOptions,
  buildWorkflowHistoryItems,
  buildWorkflowTransitionPayload,
  findWorkflowStep,
  isSameStepRef,
  resolveWorkflowProcessDetail,
} from '../workflowHelpers'

export const useWorkflowProgress = ({
  workflowInstance,
  order,
  orderId,
  user,
  syncWorkflowInstance,
}) => {
  const [workflowPreview, setWorkflowPreview] = useState(null)
  const [workflowProcessDetail, setWorkflowProcessDetail] = useState(null)
  const [processTypes, setProcessTypes] = useState([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [selectedToStepCode, setSelectedToStepCode] = useState()
  const [viewingStepCode, setViewingStepCode] = useState(null)

  const instanceId = workflowInstance?.id

  const fetchWorkflowPreview = useCallback(async ({ silent = false, keepPrevious = false } = {}) => {
    if (!instanceId) {
      if (!keepPrevious) {
        setWorkflowPreview(null)
      }
      return null
    }

    if (!silent) {
      setLoadingPreview(true)
    }

    try {
      const response = await RequestUtils.Get(WORKFLOW_PREVIEW_API, { instanceId })
      const preview = response?.data ?? null
      setWorkflowPreview(preview)

      const ok = response?.success === true || Number(response?.errorCode) === SUCCESS_CODE
      if (!ok && !preview) {
        message.error(response?.message || 'Không tải được tiến trình workflow.')
      }

      return preview
    } catch (error) {
      if (!keepPrevious) {
        setWorkflowPreview(null)
      }
      message.error(error?.message || 'Không tải được tiến trình workflow.')
      return null
    } finally {
      if (!silent) {
        setLoadingPreview(false)
      }
    }
  }, [instanceId])

  useEffect(() => {
    let mounted = true

    RequestUtils.Get(PROCESS_TYPE_FIND_API, {})
      .then((response) => {
        if (!mounted) return
        setProcessTypes(Array.isArray(response?.data) ? response.data : [])
      })
      .catch((error) => {
        if (!mounted) return
        setProcessTypes([])
        console.error('[OrderProgress] process type error', error)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    fetchWorkflowPreview()
  }, [fetchWorkflowPreview])

  const previewStepProcess = workflowPreview?.stepProcesses
  const workflowProcessId = workflowPreview?.processInstance?.processId

  useEffect(() => {
    if (!workflowProcessId) {
      setWorkflowProcessDetail(null)
      return undefined
    }

    if (isSameStepRef(workflowProcessDetail?.id, workflowProcessId)) {
      return undefined
    }

    let mounted = true

    RequestUtils.Get(`${WORKFLOW_PROCESS_FIND_API}/${workflowProcessId}`, {})
      .then((response) => {
        if (!mounted) return
        setWorkflowProcessDetail(resolveWorkflowProcessDetail(response))
      })
      .catch((error) => {
        if (!mounted) return
        setWorkflowProcessDetail({ id: workflowProcessId })
        console.error('[OrderProgress] workflow process detail error', error)
      })

    return () => {
      mounted = false
    }
  }, [workflowProcessId, workflowProcessDetail?.id])

  const workflow = useMemo(() => (
    workflowProcessDetail
    ?? (workflowProcessId ? { id: workflowProcessId } : {})
  ), [workflowProcessDetail, workflowProcessId])

  const processTypeLabelMap = useMemo(
    () => buildProcessTypeLabelMap(processTypes),
    [processTypes],
  )

  const steps = useMemo(() => (
    Array.isArray(workflowPreview?.stepProcessList)
      ? workflowPreview.stepProcessList
      : []
  ), [workflowPreview?.stepProcessList])

  const stepTransitions = useMemo(() => (
    Array.isArray(workflowPreview?.stepTransitions)
      ? workflowPreview.stepTransitions
      : []
  ), [workflowPreview?.stepTransitions])

  const stepTransitionOptions = useMemo(
    () => buildStepTransitionOptions(stepTransitions, steps),
    [stepTransitions, steps],
  )

  const stepTransitionList = useMemo(() => (
    Array.isArray(workflowPreview?.stepTransitionList)
      ? workflowPreview.stepTransitionList
      : []
  ), [workflowPreview?.stepTransitionList])

  const currentStepCode = workflowPreview?.processInstance?.currentStepCode

  const currentStep = previewStepProcess ?? null

  const displayStep = useMemo(() => {
    if (!viewingStepCode) return currentStep
    return findWorkflowStep(steps, viewingStepCode) ?? currentStep
  }, [viewingStepCode, currentStep, steps])

  const isReviewingSubmission = Boolean(
    viewingStepCode
    && !isSameStepRef(viewingStepCode, currentStep?.stepCode),
  )

  useEffect(() => {
    setViewingStepCode(null)
  }, [currentStepCode, instanceId])

  useEffect(() => {
    if (!stepTransitionOptions.length) {
      setSelectedToStepCode(undefined)
      return
    }

    setSelectedToStepCode((currentValue) => {
      if (stepTransitionOptions.some((option) => option.value === currentValue)) {
        return currentValue
      }
      return stepTransitionOptions.length === 1 ? stepTransitionOptions[0].value : undefined
    })
  }, [stepTransitionOptions])

  const histories = buildWorkflowHistoryItems({
    workflowPreview,
    steps,
  })

  const reviewStep = useCallback((step) => {
    const stepCode = step?.stepCode
    if (!stepCode) return
    setViewingStepCode(String(stepCode))
  }, [])

  const reviewInspectionResult = useCallback((item) => {
    if (!item?.stepCode) return
    setViewingStepCode(String(item.stepCode))
  }, [])

  const backToCurrentStep = useCallback(() => {
    setViewingStepCode(null)
  }, [])

  const advanceWorkflow = useCallback(async ({ currentSubmission, currentForm } = {}) => {
    if (stepTransitionOptions.length > 0 && !selectedToStepCode) {
      message.warning('Vui lòng chọn bước tiếp theo.')
      return
    }

    const payload = buildWorkflowTransitionPayload({
      workflow,
      workflowPreview,
      workflowInstance,
      order,
      orderId,
      instanceId,
      currentSubmission,
      user,
      toStepCode: selectedToStepCode,
    })

    if (!payload.processId) {
      message.error('Không tìm thấy processId của quy trình.')
      return
    }
    if (!payload.processInstanceId) {
      message.error('Không tìm thấy processInstanceId của tiến trình.')
      return
    }
    if (!payload.entityId) {
      message.error('Không tìm thấy entityId của đơn hàng.')
      return
    }
    if (!payload.byUserId) {
      message.error('Không tìm thấy byUserId của người thao tác.')
      return
    }
    if (currentForm && !payload.fromStepSubmissionId) {
      message.error('Bước hiện tại chưa có submission để chuyển bước.')
      return
    }

    setTransitioning(true)
    try {
      const response = await RequestUtils.Post(WORKFLOW_TRANSITION_API, payload)
      const ok = response?.success || Number(response?.errorCode) === SUCCESS_CODE
      if (!ok) {
        message.error(response?.message || 'Không chuyển được bước workflow.')
        return
      }

      message.success(response?.message || 'Đã chuyển bước workflow.')
      const preview = await fetchWorkflowPreview({ silent: true })
      if (preview?.processInstance) {
        syncWorkflowInstance?.(preview.processInstance)
      }
    } catch (error) {
      message.error(error?.message || 'Không chuyển được bước workflow.')
    } finally {
      setTransitioning(false)
    }
  }, [
    stepTransitionOptions,
    selectedToStepCode,
    workflow,
    workflowPreview,
    workflowInstance,
    order,
    orderId,
    instanceId,
    user,
    fetchWorkflowPreview,
    syncWorkflowInstance,
  ])

  return {
    workflowPreview,
    workflow,
    steps,
    currentStep,
    currentStepCode,
    displayStep,
    previewStepProcess,
    stepTransitionList,
    histories,
    processTypeLabelMap,
    stepTransitionOptions,
    selectedToStepCode,
    setSelectedToStepCode,
    viewingStepCode,
    isReviewingSubmission,
    reviewStep,
    reviewInspectionResult,
    backToCurrentStep,
    transitioning,
    advanceWorkflow,
    loadingPreview,
    refreshWorkflow: fetchWorkflowPreview,
    instanceId,
  }
}
