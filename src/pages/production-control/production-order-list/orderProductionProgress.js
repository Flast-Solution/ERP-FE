import { matchesProductionDetail } from '../../../containers/Order/List/utils/productionDetailMatch'

export const getOrderProductionProgress = (order) => {
  const details = order?.details ?? []
  const productionDetails = (order?.manufactureProduct ?? []).flatMap(item => item.details ?? [])
  const pendingDetails = details.filter(detail => !productionDetails.some(production => (
    matchesProductionDetail(production, detail, details)
  )))
  return { total: details.length, planned: details.length - pendingDetails.length, pendingDetails }
}
