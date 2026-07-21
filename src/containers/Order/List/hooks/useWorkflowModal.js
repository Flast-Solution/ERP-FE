import { useCallback, useState } from 'react'
import { message } from 'antd'
import { SUCCESS_CODE } from '@/configs'
import {
  ORDER_WORKFLOW_ENTITY_TYPE,
  LOT_WORKFLOW_ENTITY_TYPE,
} from '../constants'
import { attachWorkflow, fetchWorkflowList } from '../services/workflowApi'
import { resolveWorkflowInstances } from '../utils/responseResolvers'
import { normalizeWorkflowInstance } from '../utils/workflowMappers'

const useWorkflowModal = ({ setLotsByOrderId } = {}) => {
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false)
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [workflowAttaching, setWorkflowAttaching] = useState(false)
  const [workflows, setWorkflows] = useState([])
  const [workflowKeyword, setWorkflowKeyword] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedWorkflowEntityType, setSelectedWorkflowEntityType] = useState(ORDER_WORKFLOW_ENTITY_TYPE)
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null)

  const fetchWorkflows = useCallback(async () => {
    setWorkflowLoading(true)
    try {
      const list = await fetchWorkflowList()
      setWorkflows(list)
    } catch (error) {
      message.error('Không tải được danh sách workflow.')
    } finally {
      setWorkflowLoading(false)
    }
  }, [])

  const openWorkflowModal = useCallback((record, entityType = ORDER_WORKFLOW_ENTITY_TYPE) => {
    setSelectedOrder(record)
    setSelectedWorkflowEntityType(entityType)
    setSelectedWorkflowId(record?.workflowProcessId ?? record?.processId ?? null)
    setWorkflowKeyword('')
    setWorkflowModalOpen(true)
    fetchWorkflows()
  }, [fetchWorkflows])

  const closeWorkflowModal = useCallback(() => {
    setWorkflowModalOpen(false)
    setSelectedOrder(null)
    setSelectedWorkflowEntityType(ORDER_WORKFLOW_ENTITY_TYPE)
    setSelectedWorkflowId(null)
    setWorkflowKeyword('')
  }, [])

  const handleAttachWorkflow = useCallback(async () => {
    if (!selectedOrder?.id || !selectedWorkflowId) {
      message.warning('Vui lòng chọn workflow.')
      return
    }

    setWorkflowAttaching(true)
    try {
      const response = await attachWorkflow({
        processId: selectedWorkflowId,
        entityType: selectedWorkflowEntityType,
        entityId: selectedOrder.id,
      })

      const ok = response?.success === true || Number(response?.errorCode) === SUCCESS_CODE
      if (!ok) {
        message.error(response?.message || 'Gắn workflow thất bại. Vui lòng thử lại.')
        return
      }

      message.success(response?.message || 'Đã gắn workflow.')
      if (selectedWorkflowEntityType === LOT_WORKFLOW_ENTITY_TYPE && setLotsByOrderId) {
        const attachedInstance = resolveWorkflowInstances(response)[0]
          ?? normalizeWorkflowInstance(response?.data ?? response)
        setLotsByOrderId(prev => Object.entries(prev).reduce((result, [orderId, lots]) => ({
          ...result,
          [orderId]: (lots ?? []).map(lot => (
            String(lot?.id) === String(selectedOrder.id)
              ? {
                ...lot,
                workflowInstance: attachedInstance?.id ? attachedInstance : lot.workflowInstance,
              }
              : lot
          )),
        }), {}))
      }
      closeWorkflowModal()
    } catch (error) {
      message.error('Gắn workflow thất bại. Vui lòng thử lại.')
    } finally {
      setWorkflowAttaching(false)
    }
  }, [closeWorkflowModal, selectedOrder, selectedWorkflowEntityType, selectedWorkflowId, setLotsByOrderId])

  const normalizedWorkflowKeyword = workflowKeyword.trim().toLowerCase()
  const filteredWorkflows = normalizedWorkflowKeyword
    ? workflows.filter(item => [
      item?.name,
      item?.processKey,
      item?.process_key,
      item?.code,
    ].some(value => String(value ?? '').toLowerCase().includes(normalizedWorkflowKeyword)))
    : workflows

  return {
    workflowModalOpen,
    workflowLoading,
    workflowAttaching,
    workflows,
    workflowKeyword,
    setWorkflowKeyword,
    selectedOrder,
    selectedWorkflowEntityType,
    selectedWorkflowId,
    setSelectedWorkflowId,
    filteredWorkflows,
    openWorkflowModal,
    closeWorkflowModal,
    handleAttachWorkflow,
  }
}

export default useWorkflowModal
