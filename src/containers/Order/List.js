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
    payload?.embedded,
    payload?.content,
    payload?.items,
    payload,
  ]

  return candidates.find(Array.isArray) ?? []
}

const copyToClipboard = (text, setCopiedIndex, index) => {
  navigator.clipboard.writeText(text).then(() => {
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    message.success('Đã copy vào lệnh Ctrl+C');
  })
};

const ListOrder = ({ filter, hideQuoteButton, extraActions }) => {

  const navigate = useNavigate();
  const [ copiedIndex, setCopiedIndex ] = useState(null);
  const [ workflowModalOpen, setWorkflowModalOpen ] = useState(false)
  const [ workflowLoading, setWorkflowLoading ] = useState(false)
  const [ workflowAttaching, setWorkflowAttaching ] = useState(false)
  const [ workflows, setWorkflows ] = useState([])
  const [ workflowKeyword, setWorkflowKeyword ] = useState('')
  const [ selectedOrder, setSelectedOrder ] = useState(null)
  const [ selectedWorkflowId, setSelectedWorkflowId ] = useState(null)

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

  const openWorkflowModal = useCallback((order) => {
    setSelectedOrder(order)
    setSelectedWorkflowId(order?.workflowProcessId ?? order?.processId ?? null)
    setWorkflowKeyword('')
    setWorkflowModalOpen(true)
    fetchWorkflows()
  }, [fetchWorkflows])

  const closeWorkflowModal = useCallback(() => {
    setWorkflowModalOpen(false)
    setSelectedOrder(null)
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
        entityType: 'order',
        entityId: selectedOrder.id,
      })

      const ok = response?.success === true || Number(response?.errorCode) === SUCCESS_CODE
      if (!ok) {
        message.error(response?.message || 'Gắn workflow thất bại. Vui lòng thử lại.')
        return
      }

      message.success(response?.message || 'Đã gắn workflow vào đơn hàng.')
      closeWorkflowModal()
    } catch (error) {
      message.error('Gắn workflow thất bại. Vui lòng thử lại.')
    } finally {
      setWorkflowAttaching(false)
    }
  }, [closeWorkflowModal, selectedOrder, selectedWorkflowId])

  const normalizedWorkflowKeyword = workflowKeyword.trim().toLowerCase()
  const filteredWorkflows = normalizedWorkflowKeyword
    ? workflows.filter(item => [
      item?.name,
      item?.processKey,
      item?.process_key,
      item?.code,
    ].some(value => String(value ?? '').toLowerCase().includes(normalizedWorkflowKeyword)))
    : workflows

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
      render: (array, record) => renderArrayColor(array, record.detailstatus)
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
          !hasWorkflowInstance && {
            key: 'attach',
            icon: <ApartmentOutlined />,
            label: 'Gắn workflow',
          },
          {
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
              >
                Báo giá
              </Button>
            )}
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
                    navigate(`/sale/order/progress/${record.id}`, {
                      state: {
                        order: record,
                        workflowInstance: record.workflowInstance,
                      },
                    })
                  }
                },
              }}
            >
              <Tooltip title="Workflow">
                <Button
                  size="small"
                  icon={<ApartmentOutlined />}
                  onClick={(event) => event.stopPropagation()}
                />
              </Tooltip>
            </Dropdown>
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

    if (filter?.type === 'order' && entityIds.length > 0) {
      try {
        const response = await RequestUtils.Post(WORKFLOW_INSTANCE_BY_ENTITY_API, {
          entityName: 'order',
          entityIds,
        })
        const instancesByEntityId = resolveWorkflowInstances(response).reduce((result, item) => {
          if (item?.entityId) {
            result.set(Number(item.entityId), item)
          }
          return result
        }, new Map())

        tableData.embedded = tableData.embedded.map(item => ({
          ...item,
          workflowInstance: instancesByEntityId.get(Number(item.id)) ?? null,
        }))
      } catch (error) {
        console.error('[ListOrder] workflow process instances error', error)
      }
    }

    return tableData;
  }, [filter?.type]);

  return (
    <>
      <RestList
        rowKey="id"
        bordered
        xScroll={1800}
        onData={onData}
        initialFilter={{ limit: 10, page: 1, ...filter }}
        filter={<Filter />}
        hasCreate={false}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={'erp/order/fetch'}
        columns={columns}
      />

      <Modal
        title={`Gắn workflow${selectedOrder?.code ? ` cho đơn ${selectedOrder.code}` : ''}`}
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
