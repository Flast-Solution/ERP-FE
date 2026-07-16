export const buildProcessTypeLabelMap = (processTypes = []) => new Map(
  processTypes
    .filter((item) => item?.id !== undefined && item?.id !== null && item?.name)
    .map((item) => [String(item.id), item.name]),
)

export const buildProcessTypeMetaMap = (processTypes = []) => new Map(
  processTypes
    .filter((item) => item?.id !== undefined && item?.id !== null)
    .map((item) => [String(item.id), {
      id: item.id,
      name: item.name,
      colorCode: item.colorCode,
      orderProcessType: item.orderProcessType,
    }]),
)

export const getStepProcessTypeLabel = (step, processTypeLabelMap = new Map()) => {
  if (step?.label === undefined || step?.label === null || step?.label === '') {
    return null
  }

  return processTypeLabelMap.get(String(step.label)) ?? null
}

export const getStepProcessTypeMeta = (step, processTypeMetaMap = new Map()) => {
  if (step?.label === undefined || step?.label === null || step?.label === '') {
    return null
  }

  return processTypeMetaMap.get(String(step.label)) ?? null
}
