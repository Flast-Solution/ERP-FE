import { useEffect, useMemo, useState } from 'react'

import { RequestUtils } from '@flast-erp/core/utils'
import { FORM_TEMPLATE_DETAIL_API } from '../constants'
import {
  buildInspectionResults,
  getSubmissionValues,
} from '../workflowHelpers'
export const useWorkflowSubmissions = ({
  workflowPreview,
  steps,
  currentStep,
  displayStep,
  stepTransitionList,
}) => {
  const [submissionTemplates, setSubmissionTemplates] = useState({})

  const submissions = useMemo(() => (
    Array.isArray(workflowPreview?.submissions) ? workflowPreview.submissions : []
  ), [workflowPreview?.submissions])

  const previewFormTemplates = useMemo(() => (
    currentStep?.formTemplate ? [currentStep.formTemplate] : []
  ), [currentStep?.formTemplate])

  const formTemplates = useMemo(
    () => [...previewFormTemplates, ...Object.values(submissionTemplates)],
    [previewFormTemplates, submissionTemplates],
  )

  useEffect(() => {
    const availableTemplateIds = new Set(
      previewFormTemplates
        .map((template) => template?.id)
        .filter(Boolean)
        .map(String),
    )

    const missingIds = Array.from(new Set([
      ...submissions
        .map((submission) => submission?.templateId)
        .filter(Boolean)
        .map(String),
    ])).filter((id) => !availableTemplateIds.has(id) && !submissionTemplates[id])

    if (!missingIds.length) return undefined

    let mounted = true

    Promise.all(missingIds.map(async (id) => {
      try {
        const response = await RequestUtils.Get(FORM_TEMPLATE_DETAIL_API, { id })
        const template = response?.data ?? response
        if (template && typeof template === 'object') {
          return [id, template]
        }
      } catch (error) {
        console.warn('[OrderProgress] fetch form template failed', id, error)
      }
      return null
    })).then((entries) => {
      if (!mounted) return
      const validEntries = entries.filter(Boolean)
      if (!validEntries.length) return
      setSubmissionTemplates((prev) => ({
        ...prev,
        ...Object.fromEntries(validEntries),
      }))
    })

    return () => {
      mounted = false
    }
  }, [submissions, previewFormTemplates, submissionTemplates])

  const currentForm = currentStep?.formTemplate ?? null

  const displayForm = useMemo(() => {
    if (displayStep?.stepCode === currentStep?.stepCode) {
      return currentForm
    }

    const submission = submissions.find((item) => item?.stepCode === displayStep?.stepCode)
    return formTemplates.find((template) => (
      Number(template?.id) === Number(submission?.templateId)
    )) ?? null
  }, [displayStep?.stepCode, currentStep?.stepCode, currentForm, formTemplates, submissions])

  const inspectionResults = useMemo(() => buildInspectionResults({
    submissions,
    steps,
    stepTransitionList,
    previewStepProcess: currentStep,
    formTemplates,
  }), [submissions, steps, stepTransitionList, currentStep, formTemplates])

  const currentSubmission = currentStep?.stepCode && currentForm?.id
    ? submissions.find((item) => (
      item?.stepCode === currentStep.stepCode
      && Number(item?.templateId) === Number(currentForm.id)
    ))
    : null

  const displaySubmission = useMemo(() => (
    submissions.find((item) => item?.stepCode === displayStep?.stepCode) ?? null
  ), [submissions, displayStep?.stepCode])

  const displaySubmissionValues = getSubmissionValues(displaySubmission)

  const completedRefs = Array.isArray(workflowPreview?.processInstance?.completedSteps)
    ? workflowPreview.processInstance.completedSteps.map((item) => item?.step_code)
    : []

  const submittedRefs = submissions.map((item) => item.stepCode)

  const hasCurrentSubmission = Boolean(currentSubmission)

  return {
    submissions,
    formTemplates,
    currentForm,
    displayForm,
    currentSubmission,
    displaySubmission,
    displaySubmissionValues,
    inspectionResults,
    completedRefs,
    submittedRefs,
    hasCurrentSubmission,
  }
}
