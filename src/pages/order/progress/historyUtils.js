const resolveStepName = (steps, stepCode) => (
  steps.find((step) => step?.stepCode === stepCode)?.name ?? stepCode
)

export const normalizeStepInstanceLog = (log = {}, steps = []) => ({
  id: log?.id,
  success: true,
  fromStepName: resolveStepName(steps, log?.fromStepCode),
  toStepName: resolveStepName(steps, log?.toStepCode),
  createdAt: log?.createdAt,
  createdByName: log?.byUserName,
  note: log?.note,
})

export const buildWorkflowHistoryItems = ({
  workflowPreview,
  steps,
}) => (
  Array.isArray(workflowPreview?.stepInstanceLogs)
    ? workflowPreview.stepInstanceLogs.map((item) => normalizeStepInstanceLog(item, steps))
    : []
)
