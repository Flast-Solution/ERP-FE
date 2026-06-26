import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Breadcrumb, Button, Card, Col, Descriptions, Empty, Row, Space, Spin, Tag, Timeline, Typography } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, FormOutlined } from '@ant-design/icons'
import { Helmet } from 'react-helmet'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { formatMoney, formatTime } from '@flast-erp/core/utils'
import OrderService from '@/services/OrderService'
import { loadRemote } from '@/utils/loadRemote'

const { Text, Title } = Typography
const TEST_REMOTE_ENTRY = 'https://micro-frontend.flast.vn/tao-don-hang/remoteEntry.js'

const getFirstArray = (...items) => items.find(Array.isArray) ?? []

const getValue = (...items) => items.find(item => item !== undefined && item !== null && item !== '')

const normalizeRemoteContainerName = (value = '') => value.replace(/[^A-Za-z0-9_$]/g, '_')

const getRemoteConfigFromEntry = (remoteEntry) => {
  if (!remoteEntry) {
    return null
  }

  try {
    const url = new URL(remoteEntry)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const entryIndex = pathParts.findIndex(part => part === 'remoteEntry.js')
    const remoteEntryComponentId = pathParts[entryIndex - 1] ?? pathParts[0]

    if (!remoteEntryComponentId) {
      return null
    }

    return {
      componentId: normalizeRemoteContainerName(remoteEntryComponentId),
      remoteBaseUrl: url.origin,
      remoteEntryComponentId,
    }
  } catch (error) {
    return null
  }
}

const useRemoteForm = (remoteEntry) => {
  const [ Component, setComponent ] = useState(null)
  const [ loading, setLoading ] = useState(false)
  const [ error, setError ] = useState('')

  useEffect(() => {
    const remoteConfig = getRemoteConfigFromEntry(remoteEntry)
    let mounted = true

    setComponent(null)
    setError('')

    if (!remoteConfig) {
      return () => {
        mounted = false
      }
    }

    setLoading(true)
    loadRemote(
      remoteConfig.componentId,
      'MPage',
      remoteConfig.remoteBaseUrl,
      remoteConfig.remoteEntryComponentId
    )
      .then(mod => {
        if (mounted) {
          setComponent(() => mod.default ?? mod)
        }
      })
      .catch(() => {
        if (mounted) {
          setError('Không tải được remote component của form bước hiện tại.')
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [remoteEntry])

  return { Component, loading, error }
}

const RemoteFormErrorFallback = ({ message }) => (
  <Alert
    type="warning"
    showIcon
    message={message}
  />
)

class RemoteFormBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.remoteEntry !== this.props.remoteEntry && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return <RemoteFormErrorFallback message="Remote component bị lỗi khi render." />
    }

    return this.props.children
  }
}

const WorkflowStepList = ({ steps, currentStep }) => {
  if (!steps.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu quy trình workflow" />
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {steps.map((step, index) => {
        const active = currentStep?.id === step?.id || currentStep?.stepCode === step?.stepCode
        const completed = Boolean(step?.completed ?? step?.done)

        return (
          <div
            key={step?.id ?? step?.stepCode ?? index}
            style={{
              display: 'flex',
              gap: 12,
              padding: '10px 12px',
              border: active ? '1px solid #597ef7' : '1px solid #eef1f5',
              borderRadius: 8,
              background: active ? '#f0f5ff' : '#fff',
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 24px',
                background: completed ? '#52c41a' : active ? '#597ef7' : '#d9d9d9',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {index + 1}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: active ? '#1d39c4' : '#1f2937' }}>
                {step?.label ?? step?.name ?? step?.stepCode ?? `Bước ${index + 1}`}
              </div>
              <Text type="secondary" ellipsis>
                {step?.description ?? step?.type ?? ''}
              </Text>
            </div>
          </div>
        )
      })}
    </Space>
  )
}

const ResultList = ({ data }) => {
  if (!data.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu kết quả kiểm tra từ BE" />
  }

  return (
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      {data.map((item, index) => (
        <div
          key={item?.id ?? index}
          style={{
            padding: 12,
            border: '1px solid #eef1f5',
            borderRadius: 8,
            background: '#fff',
          }}
        >
          <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>
                {item?.name ?? item?.label ?? item?.title ?? `Kết quả ${index + 1}`}
              </div>
              <Text type="secondary">{item?.description ?? item?.note ?? item?.message ?? ''}</Text>
            </div>
            <Tag color={item?.success === false ? 'red' : 'green'}>
              {item?.statusName ?? item?.status ?? item?.result ?? 'Đạt'}
            </Tag>
          </Space>
        </div>
      ))}
    </Space>
  )
}

const HistoryList = ({ data }) => {
  if (!data.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu lịch sử chuyển bước từ BE" />
  }

  return (
    <Timeline
      items={data.map((item, index) => ({
        color: item?.success === false ? 'red' : 'green',
        dot: item?.success === false ? <ClockCircleOutlined /> : <CheckCircleOutlined />,
        children: (
          <div key={item?.id ?? index}>
            <div style={{ fontWeight: 600 }}>
              {item?.fromStepName ?? item?.fromStep ?? 'Bước trước'} → {item?.toStepName ?? item?.toStep ?? item?.stepName ?? 'Bước tiếp theo'}
            </div>
            <Text type="secondary">
              {formatTime(item?.createdAt ?? item?.createdDate ?? item?.time) || '-'}
              {item?.createdByName || item?.userName ? ` · ${item?.createdByName ?? item?.userName}` : ''}
            </Text>
            {item?.note && <div>{item.note}</div>}
          </div>
        ),
      }))}
    />
  )
}

const OrderProgressPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(location.state?.order ?? null)
  const [loadingOrder, setLoadingOrder] = useState(false)

  const orderId = getValue(order?.id, params.orderId, searchParams.get('orderId'), searchParams.get('id'))

  useEffect(() => {
    if (!orderId) {
      return
    }

    let mounted = true
    if (!location.state?.order) {
      setLoadingOrder(true)
    }
    OrderService.getOrderOnEdit(orderId)
      .then(response => {
        if (mounted) {
          setOrder(pre => ({
            ...(pre ?? {}),
            ...(response?.order ?? {}),
            customer: response?.customer ?? pre?.customer,
            details: response?.data ?? pre?.details,
          }))
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingOrder(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [location.state?.order, orderId])

  const workflow = order?.workflowProcess ?? order?.process ?? order?.workflow ?? {}
  const steps = getFirstArray(workflow?.steps, order?.workflowSteps, order?.steps)
  const currentStep = getValue(
    order?.currentWorkflowStep,
    order?.currentStep,
    steps.find(step => step?.current || step?.active || step?.id === order?.currentStepId || step?.stepCode === order?.currentStepCode),
    steps[0]
  )
  const formTemplates = getFirstArray(
    currentStep?.formTemplates,
    currentStep?.forms,
    order?.currentFormTemplates,
    order?.formTemplates,
    order?.forms
  )
  const currentForm = getValue(order?.currentForm, order?.requiredForm, formTemplates[0])
  const remoteEntry = getValue(
    currentForm?.remoteEntry,
    currentForm?.remoteEntryUrl,
    currentForm?.microFrontendUrl,
    currentStep?.remoteEntry,
    order?.remoteEntry,
    TEST_REMOTE_ENTRY
  )
  const checkResults = getFirstArray(
    order?.checkResults,
    order?.inspectionResults,
    order?.workflowCheckResults,
    currentStep?.checkResults,
    currentStep?.results
  )
  const histories = getFirstArray(
    order?.workflowHistories,
    order?.workflowHistory,
    order?.stepHistories,
    order?.histories,
    workflow?.histories
  )

  const { Component: RemoteForm, loading: loadingRemote, error: remoteError } = useRemoteForm(remoteEntry)

  const orderInfoItems = useMemo(() => [
    {
      key: 'code',
      label: 'Mã đơn',
      children: order?.code ?? '-',
    },
    {
      key: 'customer',
      label: 'Khách hàng',
      children: order?.customerReceiverName ?? order?.customerName ?? order?.customer?.name ?? '-',
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      children: order?.customerMobilePhone ?? order?.phone ?? '-',
    },
    {
      key: 'address',
      label: 'Địa chỉ',
      children: order?.customerAddress ?? order?.address ?? '-',
    },
    {
      key: 'total',
      label: 'Tổng tiền',
      children: formatMoney(order?.total ?? 0),
    },
    {
      key: 'createdAt',
      label: 'Ngày đặt',
      children: formatTime(order?.createdAt ?? order?.createdDate) || '-',
    },
  ], [order])

  return (
    <>
      <Helmet>
        <title>Tiến trình workflow đơn hàng</title>
      </Helmet>
      <Breadcrumb
        style={{ marginBottom: 10 }}
        items={[
          { title: 'Trang chủ' },
          { title: 'Đơn hàng' },
          { title: 'Tiến trình workflow' },
        ]}
      />

      <Spin spinning={loadingOrder}>
        <div style={{ paddingBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/sale/order')}
            style={{ marginBottom: 16 }}
          >
            Quay lại danh sách
          </Button>

          <Row gutter={16} align="top">
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card title="Thông tin đơn hàng">
                  {order ? (
                    <Descriptions
                      bordered
                      size="small"
                      column={{ xs: 1, md: 2 }}
                      items={orderInfoItems}
                    />
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu đơn hàng" />
                  )}
                </Card>

                <Card
                  title={(
                    <Space>
                      <FormOutlined />
                      <span>Form bắt buộc tại bước</span>
                    </Space>
                  )}
                  extra={currentStep?.name || currentStep?.label ? <Tag color="blue">{currentStep?.label ?? currentStep?.name}</Tag> : null}
                >
                  {!remoteEntry && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bước hiện tại chưa có remoteEntry form" />
                  )}
                  {remoteEntry && loadingRemote && <Spin />}
                  {remoteEntry && remoteError && <RemoteFormErrorFallback message={remoteError} />}
                  {remoteEntry && RemoteForm && (
                    <RemoteFormBoundary remoteEntry={remoteEntry}>
                      <RemoteForm
                        order={order}
                        record={order}
                        data={order}
                        step={currentStep}
                        formTemplate={currentForm}
                      />
                    </RemoteFormBoundary>
                  )}
                </Card>

                <Card title="Kết quả kiểm tra">
                  <ResultList data={checkResults} />
                </Card>

                <Card title="Lịch sử chuyển bước">
                  <HistoryList data={histories} />
                </Card>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title="Quy trình workflow"
                style={{
                  minHeight: 420,
                  position: 'fixed',
                  top: 164,
                  width: '25%',
                  maxHeight: 'calc(100vh - 32px)',
                  overflowY: 'auto',
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Title level={4} style={{ marginBottom: 4 }}>
                    {getValue(workflow?.name, order?.workflowProcessName, order?.processName, order?.workflowName, 'Chưa gắn workflow')}
                  </Title>
                  <Text type="secondary">
                    {getValue(workflow?.processKey, workflow?.code, order?.workflowProcessKey, '')}
                    {steps.length ? ` · ${steps.length} bước` : ''}
                  </Text>
                </div>
                <WorkflowStepList steps={steps} currentStep={currentStep} />
              </Card>
            </Col>
          </Row>
        </div>
      </Spin>
    </>
  )
}

export default OrderProgressPage
