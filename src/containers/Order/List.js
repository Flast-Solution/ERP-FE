/**************************************************************************/
/*  List.js                                                         		  */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import React, { useState, useCallback } from 'react';
import { Button, Dropdown, Input, message, Modal, Space, Table, Tag, Tooltip } from 'antd';
import { ApartmentOutlined, CopyOutlined, EditFilled, EyeOutlined } from '@ant-design/icons';

import { RestList } from "@flast-erp/core/components";
import { useGetList } from "@flast-erp/core/hooks";
import Filter from './Filter';
import {
  dateFormatOnSubmit,
  formatMoney,
  formatTime,
  InAppEvent,
  RequestUtils
} from '@flast-erp/core/utils';
import OrderService from '@/services/OrderService';
import { HASH_MODAL, SUCCESS_CODE } from '@/configs';
import { renderArrayColor } from './utils';
import { useNavigate  } from 'react-router-dom';

const WORKFLOW_FILTER_API = '/workflow/process/filter?limit=50&offset=0'
const ORDER_WORKFLOW_ATTACH_API = '/workflow/process/start'
const WORKFLOW_INSTANCE_BY_ENTITY_API = '/workflow/process/instance/get-entity'
const WORKFLOW_PROCESS_FIND_API = '/workflow/process/find-id'
const WORKFLOW_PREVIEW_API = '/workflow/process/preview'
const ORDER_LOTS_FIND_API = '/qms/warehouse-paracel/find-entity'
const ORDER_WORKFLOW_ENTITY_TYPE = 'order'
const LOT_WORKFLOW_ENTITY_TYPE = 'WAREHOUSE_PARCEL'

const resolveWorkflowList = (response) => {
  const payload = response?.data ?? response
  const candidates = [
    payload?.embedded,
    payload?.data?.embedded,
    payload?.data?.content,
    payload?.content,
    payload?.items,
    payload,
  ]

  return candidates.find(Array.isArray) ?? []
}

const resolveWorkflowInstances = (response) => {
  const payload = response?.data ?? response
  const candidates = [
    payload?.data,
    payload?.data?.embedded,
    payload?.data?.content,
    payload?.data?.items,
    payload?.data?.instances,
    payload?.data?.processInstances,
    payload?.embedded,
    payload?.content,
    payload?.items,
    payload?.instances,
    payload?.processInstances,
    payload,
  ]

  const arrayData = candidates.find(Array.isArray)
  if (arrayData) {
    return arrayData
  }

  const objectData = candidates.find(item => item && typeof item === 'object')
  if (objectData) {
    if (objectData.id || objectData.entityId || objectData.processInstance) {
      return [objectData]
    }

    const values = Object.values(objectData)
    const objectValues = values.filter(item => item && typeof item === 'object')
    if (objectValues.length > 0 && objectValues.length === values.length) {
      return objectValues
    }
  }

  return []
}

const clonePlainData = (value) => {
  if (value === undefined || value === null) {
    return value
  }

  try {
    return JSON.parse(JSON.stringify(value))
  } catch (error) {
    return null
  }
}

const resolveWorkflowProcessDetail = (response) => {
  const payload = response?.data ?? response
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  if (payload?.process && typeof payload.process === 'object' && !Array.isArray(payload.process)) {
    return payload.process
  }
  return payload
}

const resolveWorkflowPreview = (response) => {
  const payload = response?.data ?? response
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  return payload
}

const getWorkflowInstanceEntityId = (instance) => instance?.entityId

const normalizeWorkflowInstance = (instance) => {
  if (!instance?.processInstance) {
    return instance
  }

  return {
    ...instance,
    ...instance.processInstance,
    process: instance?.process ?? instance?.workflowProcess ?? instance?.processInstance?.process,
  }
}

const getWorkflowInstanceProcessId = (instance) => instance?.processId

const getWorkflowCurrentStepLabel = (record) => (
  record?.workflowInstance?.preview?.stepProcesses?.name
)

const resolveOrderLots = (response) => {
  const payload = response?.data ?? response
  const candidates = [
    payload?.data,
    payload?.data?.embedded,
    payload?.data?.content,
    payload?.data?.items,
    payload?.embedded,
    payload?.content,
    payload?.items,
    payload,
  ]

  const arrayData = candidates.find(Array.isArray)
  if (arrayData) {
    return arrayData
  }

  const objectData = candidates.find(item => item && typeof item === 'object')
  if (objectData?.id || objectData?.code || objectData?.entityId) {
    return [objectData]
  }

  return []
}

const mapOrderDetailsForLotPage = (order) => (
  (order?.details || []).map(detail => ({
    orderDetailCode: detail.code,
    orderDetailId: detail.id,
    productId: detail.productId,
    productCode: detail.productCode || detail.product?.code,
    productName: detail.productName,
    name: detail.name,
    quantity: detail.quantity,
    skuId: detail.skuId,
    customerOrder: order,
  }))
)

const getWorkflowInstanceMapByEntityId = (instances = []) => (
  instances.reduce((result, item) => {
    const entityId = getWorkflowInstanceEntityId(item)
    if (entityId !== undefined && entityId !== null && entityId !== '') {
      result.set(String(entityId), normalizeWorkflowInstance(item))
    }
    return result
  }, new Map())
)

const copyToClipboard = (text, setCopiedIndex, index) => {
  navigator.clipboard.writeText(text).then(() => {
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    message.success('Đã copy vào lệnh Ctrl+C');
  })
};

const ListOrder = ({
  filter = {},
  hideQuoteButton,
  extraActions,
  enableLotTree = false,
  disableWorkflowAttach = false,
  apiPath = 'erp/order/fetch',
  orderMode = false,
}) => {

  const navigate = useNavigate();
  const [ copiedIndex, setCopiedIndex ] = useState(null);
  const [ workflowModalOpen, setWorkflowModalOpen ] = useState(false)
  const [ workflowLoading, setWorkflowLoading ] = useState(false)
  const [ workflowAttaching, setWorkflowAttaching ] = useState(false)
  const [ workflows, setWorkflows ] = useState([])
  const [ workflowKeyword, setWorkflowKeyword ] = useState('')
  const [ selectedOrder, setSelectedOrder ] = useState(null)
  const [ selectedWorkflowEntityType, setSelectedWorkflowEntityType ] = useState(ORDER_WORKFLOW_ENTITY_TYPE)
  const [ selectedWorkflowId, setSelectedWorkflowId ] = useState(null)
  const [ expandedRowKeys, setExpandedRowKeys ] = useState([])
  const [ lotsByOrderId, setLotsByOrderId ] = useState({})
  const [ loadingLotsByOrderId, setLoadingLotsByOrderId ] = useState({})
  const isOrderList = orderMode || filter.type === 'order'

  const onClickViewDetail = (customerOrder) => InAppEvent.emit(HASH_MODAL, {
    hash: "#order.tabs",
    title: "Thông tin đơn hàng " + customerOrder.code,
    data: { customerOrder }
  });

  const fetchWorkflows = useCallback(async () => {
    setWorkflowLoading(true)
    try {
      const response = await RequestUtils.Get(WORKFLOW_FILTER_API, {})
      setWorkflows(resolveWorkflowList(response))
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
      const response = await RequestUtils.Post(ORDER_WORKFLOW_ATTACH_API, {
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
      if (selectedWorkflowEntityType === LOT_WORKFLOW_ENTITY_TYPE) {
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
  }, [closeWorkflowModal, selectedOrder, selectedWorkflowEntityType, selectedWorkflowId])

  const normalizedWorkflowKeyword = workflowKeyword.trim().toLowerCase()
  const filteredWorkflows = normalizedWorkflowKeyword
    ? workflows.filter(item => [
      item?.name,
      item?.processKey,
      item?.process_key,
      item?.code,
    ].some(value => String(value ?? '').toLowerCase().includes(normalizedWorkflowKeyword)))
    : workflows

  const fetchLotsByOrder = useCallback(async (order) => {
    const entityId = order?.id
    if (!entityId || lotsByOrderId[entityId] || loadingLotsByOrderId[entityId]) {
      return
    }

    setLoadingLotsByOrderId(prev => ({ ...prev, [entityId]: true }))
    try {
      const response = await RequestUtils.Get(ORDER_LOTS_FIND_API, {
        entity: 'ORDER',
        entityId,
      })
      const lots = resolveOrderLots(response)
      const lotIds = lots.map(lot => lot?.id).filter(Boolean)
      let workflowInstancesByLotId = new Map()

      if (lotIds.length > 0) {
        try {
          const workflowResponse = await RequestUtils.Post(WORKFLOW_INSTANCE_BY_ENTITY_API, {
            entityName: LOT_WORKFLOW_ENTITY_TYPE,
            entityIds: lotIds,
          })
          workflowInstancesByLotId = getWorkflowInstanceMapByEntityId(resolveWorkflowInstances(workflowResponse))
        } catch (error) {
          workflowInstancesByLotId = new Map()
        }
      }

      setLotsByOrderId(prev => ({
        ...prev,
        [entityId]: lots.map(lot => ({
          ...lot,
          workflowInstance: workflowInstancesByLotId.get(String(lot?.id)) ?? lot.workflowInstance ?? null,
        })),
      }))
    } catch (error) {
      message.error('Không tải được danh sách lô của đơn hàng.')
      setLotsByOrderId(prev => ({ ...prev, [entityId]: [] }))
    } finally {
      setLoadingLotsByOrderId(prev => ({ ...prev, [entityId]: false }))
    }
  }, [loadingLotsByOrderId, lotsByOrderId])

  const getLotColumns = (order) => [
    {
      title: 'Mã lô',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: value => value || '-',
    },
    {
      title: 'Tên lô hàng',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: value => value || '-',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: value => value || '-',
    },
    {
      title: 'Số lượng',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      align: 'right',
      render: value => value ?? 0,
    },
    {
      title: 'Ngày dự kiến',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      width: 180,
      render: value => formatTime(value) || '-',
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priorityLevel',
      key: 'priorityLevel',
      width: 130,
      render: value => {
        const priorityColor = {
          HIGH: 'red',
          NORMAL: 'blue',
          LOW: 'default',
        }[value] || 'default'
        return <Tag color={priorityColor}>{value || '-'}</Tag>
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 110,
      fixed: 'right',
      render: (_, lot) => {
        const hasWorkflowInstance = Boolean(lot?.workflowInstance?.id)

        return (
          <Space size={8}>
            <Tooltip title="Chỉnh sửa lô hàng">
              <Button
                size="small"
                icon={<EditFilled />}
                onClick={(event) => {
                  event.stopPropagation()
                  navigate('/sale/production/lots/create', {
                    state: {
                      customerOrder: order,
                      orderDetails: mapOrderDetailsForLotPage(order),
                      editingLot: clonePlainData(lot),
                    },
                  })
                }}
              />
            </Tooltip>
            {!hasWorkflowInstance ? (
              <Tooltip title="Gắn workflow">
                <Button
                  size="small"
                  icon={<ApartmentOutlined />}
                  onClick={(event) => {
                    event.stopPropagation()
                    openWorkflowModal(lot, LOT_WORKFLOW_ENTITY_TYPE)
                  }}
                />
              </Tooltip>
            ) : null}
            {hasWorkflowInstance ? (
              <Tooltip title="Xem tiến trình">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={(event) => {
                    event.stopPropagation()
                    navigate(`/sale/order/progress/${order.id}?instanceId=${lot.workflowInstance.id}`, {
                      state: {
                        order: clonePlainData(order),
                        lot: clonePlainData(lot),
                        workflowInstance: clonePlainData(lot.workflowInstance),
                      },
                    })
                  }}
                />
              </Tooltip>
            ) : null}
          </Space>
        )
      },
    },
  ]

  const orderLotExpandable = enableLotTree ? {
    expandedRowKeys,
    expandRowByClick: true,
    onExpand: (expanded, record) => {
      const recordId = record?.id
      setExpandedRowKeys(prev => (
        expanded
          ? Array.from(new Set([...prev, recordId]))
          : prev.filter(key => key !== recordId)
      ))
      if (expanded) {
        fetchLotsByOrder(record)
      }
    },
    expandedRowRender: (record) => {
      const orderId = record?.id
      const lots = lotsByOrderId[orderId] ?? []
      const loading = loadingLotsByOrderId[orderId]

      return (
        <div style={{ padding: '8px 16px 8px 48px', background: '#fafafa' }}>
          <Table
            rowKey={(item) => item?.id ?? item?.code ?? `${orderId}-${item?.name ?? item?.createdDate ?? item?.expectedDate ?? 'lot'}`}
            size="small"
            columns={getLotColumns(record)}
            dataSource={lots}
            loading={loading}
            pagination={false}
            locale={{ emptyText: loading ? 'Đang tải danh sách lô...' : 'Chưa có lô hàng' }}
            scroll={{ x: 1020 }}
          />
        </div>
      )
    },
  } : undefined

  const actionWidth = (
    filter.type === 'cohoi' ? 260 : 220
  ) + ((extraActions?.length ?? 0) * 44)

  const columns = [
    {
      title: 'Kinh doanh',
      dataIndex: 'userCreateUsername',
      key: 'userCreateUsername',
      width: 120,
      ellipsis: true
    },
    {
      title: 'Mã đơn',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      ellipsis: true,
      render: (text, record, index) => (
        <span
          onClick={() => copyToClipboard(text, setCopiedIndex, index)}
          style={{
            cursor: 'pointer',
            color: copiedIndex === index ? '#52c41a' : 'inherit',
            transition: 'color 0.3s ease',
          }}
        >
          <CopyOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      )
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'products',
      key: 'products',
      width: 150,
      ellipsis: true,
      render: (products, record) => renderArrayColor(products, record.detailstatus)
    },
    {
      title: 'T.Thái',
      dataIndex: 'detailstatus',
      key: 'detailstatus',
      width: 150,
      ellipsis: true,
      render: (array, record) => {
        if (!isOrderList) {
          return renderArrayColor(array, record.detailstatus)
        }

        if (!record?.workflowInstance) {
          return <Tag>Chưa gắn workflow</Tag>
        }

        const currentStepLabel = getWorkflowCurrentStepLabel(record)
        if (currentStepLabel) {
          return <Tag color="blue">{currentStepLabel}</Tag>
        }

        return <Tag color="orange">Chưa xác định bước</Tag>
      }
    },
    {
      title: 'T.G Chốt',
      dataIndex: 'opportunityAt',
      key: 'opportunityAt',
      width: 120,
      ellipsis: true,
      render: (time) => formatTime(time)
    },
    {
      title: 'Họ tên',
      dataIndex: 'customerReceiverName',
      key: 'customerReceiverName',
      width: 130,
      ellipsis: true
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'customerMobilePhone',
      key: 'customerMobilePhone',
      width: 130,
      ellipsis: true
    },
    {
      title: 'Tỉnh/T.P',
      dataIndex: 'customerAddress',
      key: 'customerAddress',
      width: 120,
      ellipsis: true,
      render: (address) => address || '(Chưa có)'
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      ellipsis: true,
      render: (time) => formatTime(time)
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      ellipsis: true,
      render: (total) => formatMoney(total)
    },
    {
      title: 'Giảm giá',
      dataIndex: 'priceOff',
      key: 'priceOff',
      width: 130,
      ellipsis: true,
      render: (priceOff) => formatMoney(priceOff)
    },
    {
      title: 'Phí ship',
      dataIndex: 'shippingCost',
      key: 'shippingCost',
      width: 130,
      ellipsis: true,
      render: (shippingCost) => formatMoney(shippingCost)
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paid',
      key: 'paid',
      width: 130,
      ellipsis: true,
      render: (paid) => formatMoney(paid)
    },
    {
      title: 'Còn lại',
      key: 'remainingAmount',
      width: 130,
      ellipsis: true,
      render: (record) => formatMoney(record.total - record.paid)
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: actionWidth,
      render: (_, record) => {
        const hasWorkflowInstance = Boolean(record?.workflowInstance)
        const workflowMenuItems = [
          !disableWorkflowAttach && !hasWorkflowInstance && {
            key: 'attach',
            icon: <ApartmentOutlined />,
            label: 'Gắn workflow',
          },
          hasWorkflowInstance && {
            key: 'progress',
            icon: <EyeOutlined />,
            label: 'Xem tiến trình',
          },
        ].filter(Boolean)

        return (
          <Space gap={8}>
            <Button
              type="primary"
              size="small"
              onClick={() => onClickViewDetail(record)}
            >
              Chi tiết
            </Button>
            {!hideQuoteButton && (
              <Button
                size="small"
                style={{ color: "#fa8c16" }}
                onClick={(event) => {
                  event.stopPropagation()
                  navigate(`/document-templates/editor/ORDER/${record.id}?documentType=QUOTATION`, {
                    state: { entityData: clonePlainData(record) },
                  })
                }}
              >
                Báo giá
              </Button>
            )}
            {workflowMenuItems.length > 0 ? (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: workflowMenuItems,
                  onClick: ({ key, domEvent }) => {
                    domEvent?.stopPropagation()
                    if (key === 'attach') {
                      openWorkflowModal(record)
                      return
                    }
                    if (key === 'progress') {
                      const instanceId = record.workflowInstance?.id
                      navigate(`/sale/order/progress/${record.id}${instanceId ? `?instanceId=${instanceId}` : ''}`, {
                        state: {
                          order: clonePlainData(record),
                          workflowInstance: clonePlainData(record.workflowInstance),
                        },
                      })
                    }
                  },
                }}
              >
                <Tooltip title={hasWorkflowInstance ? 'Xem tiến trình' : 'Workflow'}>
                  <Button
                    size="small"
                    icon={hasWorkflowInstance ? <EyeOutlined /> : <ApartmentOutlined />}
                    onClick={(event) => event.stopPropagation()}
                  />
                </Tooltip>
              </Dropdown>
            ) : null}
            { record.type === 'cohoi' &&
              <Button
                size="small"
                style={{ color: "#16c5faff" }}
                onClick={() => navigate(String('/sale/ban-hang/').concat(record.id))}
              >
                <EditFilled />
              </Button>
            }
            {extraActions?.map((action, index) => (
              <Button
                key={index}
                size="small"
                {...action}
                onClick={() => action.onClick(record)}
              >
                {action.children}
              </Button>
            ))}
          </Space>
        )
      }
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onData = useCallback(async (response) => {
    const tableData = await OrderService.viewInTable(response);
    const entityIds = (tableData?.embedded ?? [])
      .map(item => item?.id)
      .filter(Boolean)

    if (isOrderList && entityIds.length > 0) {
      try {
        const response = await RequestUtils.Post(WORKFLOW_INSTANCE_BY_ENTITY_API, {
          entityName: 'order',
          entityIds,
        })
        const instancesByEntityId = resolveWorkflowInstances(response).reduce((result, item) => {
          const entityId = getWorkflowInstanceEntityId(item)
          if (entityId) {
            result.set(Number(entityId), normalizeWorkflowInstance(item))
          }
          return result
        }, new Map())

        const processIds = Array.from(new Set(
          Array.from(instancesByEntityId.values())
            .map(getWorkflowInstanceProcessId)
            .filter(Boolean)
            .map(Number)
        ))

        const workflowProcessesById = new Map()
        if (processIds.length > 0) {
          const workflowProcesses = await Promise.all(
            processIds.map(async (processId) => {
              try {
                const detailResponse = await RequestUtils.Get(`${WORKFLOW_PROCESS_FIND_API}/${processId}`, {})
                return resolveWorkflowProcessDetail(detailResponse)
              } catch (error) {
                return { id: processId }
              }
            })
          )

          workflowProcesses.forEach((process) => {
            if (process?.id) {
              workflowProcessesById.set(Number(process.id), process)
            }
          })
        }

        const workflowPreviewsByInstanceId = new Map()
        const previewableInstances = Array.from(instancesByEntityId.values())
          .filter(instance => instance?.id)

        if (previewableInstances.length > 0) {
          const workflowPreviews = await Promise.all(
            previewableInstances.map(async (instance) => {
              try {
                const previewResponse = await RequestUtils.Get(WORKFLOW_PREVIEW_API, { instanceId: instance.id })
                return {
                  instanceId: Number(instance.id),
                  preview: resolveWorkflowPreview(previewResponse),
                }
              } catch (error) {
                return {
                  instanceId: Number(instance.id),
                  preview: null,
                }
              }
            })
          )

          workflowPreviews.forEach(({ instanceId, preview }) => {
            if (instanceId && preview) {
              workflowPreviewsByInstanceId.set(Number(instanceId), preview)
            }
          })
        }

        tableData.embedded = tableData.embedded.map(item => ({
          ...item,
          workflowInstance: instancesByEntityId.get(Number(item.id))
            ? {
              ...instancesByEntityId.get(Number(item.id)),
              preview: workflowPreviewsByInstanceId.get(Number(instancesByEntityId.get(Number(item.id))?.id)) ?? null,
            }
            : null,
          workflowProcess: workflowProcessesById.get(Number(getWorkflowInstanceProcessId(instancesByEntityId.get(Number(item.id))))) ?? null,
        }))
      } catch (error) {
        tableData.embedded = tableData.embedded.map(item => ({
          ...item,
          workflowInstance: null,
          workflowProcess: null,
        }))
      }
    }

    return tableData;
  }, [isOrderList]);

  const workflowTargetTypeLabel = selectedWorkflowEntityType === LOT_WORKFLOW_ENTITY_TYPE ? 'lô' : 'đơn'
  const workflowTargetCode = selectedOrder?.code || selectedOrder?.name

  return (
    <>
      <RestList
        rowKey="id"
        bordered
        xScroll={1800}
        expandable={orderLotExpandable}
        onData={onData}
        initialFilter={{ limit: 10, page: 1, ...filter }}
        filter={<Filter />}
        hasCreate={false}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={apiPath}
        columns={columns}
      />

      <Modal
        title={`Gắn workflow${workflowTargetCode ? ` cho ${workflowTargetTypeLabel} ${workflowTargetCode}` : ''}`}
        open={workflowModalOpen}
        onCancel={closeWorkflowModal}
        onOk={handleAttachWorkflow}
        okText="Gắn workflow"
        cancelText="Đóng"
        confirmLoading={workflowAttaching}
        okButtonProps={{ disabled: !selectedWorkflowId }}
        width={760}
        destroyOnHidden
      >
        <Input.Search
          allowClear
          placeholder="Tìm workflow theo tên hoặc mã..."
          value={workflowKeyword}
          onChange={event => setWorkflowKeyword(event.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Table
          rowKey="id"
          size="small"
          loading={workflowLoading}
          dataSource={filteredWorkflows}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedWorkflowId ? [selectedWorkflowId] : [],
            onChange: ([key]) => setSelectedWorkflowId(key),
          }}
          onRow={(record) => ({
            onClick: () => setSelectedWorkflowId(record.id),
            style: { cursor: 'pointer' },
          })}
          columns={[
            {
              title: 'Tên workflow',
              dataIndex: 'name',
              key: 'name',
              ellipsis: true,
              render: (name) => name || '(Chưa đặt tên)',
            },
            {
              title: 'Mã',
              dataIndex: 'processKey',
              key: 'processKey',
              width: 220,
              ellipsis: true,
              render: (value) => value || '-',
            },
            {
              title: 'Trạng thái',
              dataIndex: 'enabled',
              key: 'enabled',
              width: 120,
              render: (enabled) => (
                <Tag color={enabled === false ? 'default' : 'green'}>
                  {enabled === false ? 'Tắt' : 'Kích hoạt'}
                </Tag>
              ),
            },
          ]}
        />
      </Modal>

    </>
  )
};

export default ListOrder;
