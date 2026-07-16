const resolveStepName = (steps, stepCode) => (
  steps.find((step) => step?.stepCode === stepCode)?.name ?? stepCode
)

export const normalizeStepInstanceLog = (log = {}, steps = []) => ({
  id: log?.id,
  success: true,
  fromStepCode: log?.fromStepCode,
  toStepCode: log?.toStepCode,
  fromStepName: resolveStepName(steps, log?.fromStepCode),
  toStepName: resolveStepName(steps, log?.toStepCode),
  createdAt: log?.createdAt,
  createdById: log?.byUserId,
  createdByName: log?.byUserName,
  note: log?.note,
  actionResults: Array.isArray(log?.actionResults) ? log.actionResults : [],
})

export const buildWorkflowHistoryItems = ({
  workflowPreview,
  steps,
}) => (
  Array.isArray(workflowPreview?.stepInstanceLogs)
    ? workflowPreview.stepInstanceLogs.map((item) => normalizeStepInstanceLog(item, steps))
    : []
)
