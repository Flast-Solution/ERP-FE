import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Button, DatePicker, Form, Input, Radio, Select, Tag, message } from 'antd'

import {
  FormContextCustom,
  FormHidden,
  FormSelectAPI,
  FormSelectInfiniteProduct,
} from '@flast-erp/core/components'
import { RequestUtils } from '@flast-erp/core/utils'
import { CHANNEL_SOURCE } from '@/configs/localData'
import FormFileUpload from '@/containers/PreviewModal/FormFileUpload'

import { LeadFormShell } from './styles'

const WORKFLOW_FILTER_API = '/workflow/process/filter'
const WORKFLOW_PAGE_SIZE = 10

const getResponseItems = (response) => {
  const payload = response?.data ?? response
  return [
    payload?.embedded,
    payload?.items,
    payload?.content,
    payload?.records,
    payload?.data?.embedded,
    payload?.data?.items,
    payload?.data?.content,
    payload?.data,
    payload,
  ].find(Array.isArray) ?? []
}

const getResponsePage = (response) => {
  const payload = response?.data ?? response
  return payload?.page ?? payload?.data?.page ?? {}
}

const mergeById = (currentItems, nextItems) => {
  const itemsById = new Map()
  ;[...currentItems, ...nextItems].forEach((item) => {
    if (item?.id !== undefined && item?.id !== null) {
      itemsById.set(String(item.id), item)
    }
  })
  return Array.from(itemsById.values())
}

const ASSET_BASE_URL = 'http://view.user.flast.vn/assets/icons'

const LeadLabel = ({ children, required = false }) => (
  <span className="label">
    {children}
    {required ? <span className="req">*</span> : null}
  </span>
)

const LeadSection = ({ number, title, children }) => (
  <section className="pl-section">
    <div className="pl-section__head">
      <span className="pl-section__num">{number}</span>
      <h2 className="t-h3" style={{ margin: 0 }}>{title}</h2>
    </div>
    {children}
  </section>
)

const LeadInput = ({ name, label, code, required, fieldClassName = '', ...props }) => (
  <Form.Item
    name={name}
    label={<LeadLabel code={code} required={required}>{label}</LeadLabel>}
    required={false}
    className={`pl-field ${fieldClassName}`.trim()}
    rules={required && !props.disabled ? [{ required: true, message: `Vui lòng nhập ${String(label).toLowerCase()}` }] : []}
  >
    <Input className="pl-input" {...props} />
  </Form.Item>
)

const LeadSelect = ({
  name,
  label,
  code,
  required,
  options = [],
  fieldClassName = '',
  normalize,
  extra,
  ...props
}) => (
  <Form.Item
    name={name}
    label={<LeadLabel code={code} required={required}>{label}</LeadLabel>}
    required={false}
    className={`pl-field ${fieldClassName}`.trim()}
    rules={required && !props.disabled ? [{ required: true, message: `Vui lòng chọn ${String(label).toLowerCase()}` }] : []}
    normalize={normalize}
    extra={extra}
  >
    <Select className="pl-select" options={options} optionFilterProp="label" showSearch allowClear {...props} />
  </Form.Item>
)

const LeadDatePicker = ({
  name,
  label,
  code,
  required,
  fieldClassName = '',
  ...props
}) => (
  <Form.Item
    name={name}
    label={<LeadLabel code={code} required={required}>{label}</LeadLabel>}
    required={false}
    className={`pl-field ${fieldClassName}`.trim()}
    rules={required ? [{ required: true, message: `Vui lòng chọn ${String(label).toLowerCase()}` }] : []}
  >
    <DatePicker
      className="pl-input pl-date-picker"
      format="YYYY-MM-DD HH:mm:ss"
      showTime={{ format: 'HH:mm:ss' }}
      allowClear
      {...props}
    />
  </Form.Item>
)

const LeadForm = ({ listSale = [], submitting = false }) => {
  const { form, record } = useContext(FormContextCustom)
  const [provinces, setProvinces] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [loadingWorkflows, setLoadingWorkflows] = useState(false)
  const workflowOffsetRef = useRef(0)
  const workflowLoadingRef = useRef(false)
  const workflowHasMoreRef = useRef(true)
  const workflowItemsRef = useRef([])
  const customerType = Form.useWatch('customerType', form) ?? record?.customerType ?? 'INDIVIDUAL'

  const attachedWorkflowIds = useMemo(() => Array.from(new Set([
    ...(Array.isArray(record?.workflowInstances)
      ? record.workflowInstances.map(instance => instance?.processId)
      : []),
    record?.workflowProcessId,
  ].filter(id => id !== undefined && id !== null && id !== ''))), [record])
  const attachedWorkflowIdSet = useMemo(
    () => new Set(attachedWorkflowIds.map(String)),
    [attachedWorkflowIds],
  )

  useEffect(() => {
    RequestUtils.GetAsList('/province/find', { id: 0 }).then(setProvinces).catch(() => setProvinces([]))
  }, [])

  const loadWorkflows = useCallback(async ({ reset = false } = {}) => {
    if (workflowLoadingRef.current || (!reset && !workflowHasMoreRef.current)) return

    const offset = reset ? 0 : workflowOffsetRef.current
    workflowLoadingRef.current = true
    setLoadingWorkflows(true)

    try {
      const response = await RequestUtils.Get(WORKFLOW_FILTER_API, {
        limit: String(WORKFLOW_PAGE_SIZE),
        offset: String(offset),
        type: 'LEAD',
      })
      const nextItems = getResponseItems(response)
      const pageInfo = getResponsePage(response)
      const mergedItems = mergeById(
        reset ? [] : workflowItemsRef.current,
        nextItems,
      )
      workflowItemsRef.current = mergedItems
      setWorkflows(mergedItems)

      const totalElements = Number(pageInfo?.totalElements ?? pageInfo?.total_elements ?? 0)
      const hasMore = totalElements > 0
        ? mergedItems.length < totalElements
        : nextItems.length >= WORKFLOW_PAGE_SIZE

      workflowHasMoreRef.current = hasMore
      workflowOffsetRef.current = offset + nextItems.length
    } catch (_) {
      if (reset) {
        workflowItemsRef.current = []
        setWorkflows([])
      }
      workflowHasMoreRef.current = false
      message.error('Không tải được danh sách workflow.')
    } finally {
      workflowLoadingRef.current = false
      setLoadingWorkflows(false)
    }
  }, [])

  useEffect(() => {
    workflowOffsetRef.current = 0
    workflowHasMoreRef.current = true
    workflowItemsRef.current = []
    loadWorkflows({ reset: true })
  }, [loadWorkflows])

  const normalizeLeadStatuses = useCallback((response) => {
    const statuses = getResponseItems(response)
    const currentStatus = form?.getFieldValue('status')
    if (
      form
      && statuses.length
      && (currentStatus === undefined || currentStatus === null || currentStatus === '')
    ) {
      const initialStatus = statuses.find(status => (
        ['NEW', 'CREATE_DATA'].includes(
          String(status?.code ?? status?.value ?? '').toUpperCase(),
        )
      )) ?? statuses[0]
      form.setFieldValue('status', initialStatus?.id ?? initialStatus?.value ?? initialStatus?.code)
    }
    return statuses
  }, [form])

  const provinceOptions = useMemo(
    () => provinces.map(item => ({ value: item.name, label: item.name })),
    [provinces],
  )
  const leadSourceOptions = useMemo(
    () => CHANNEL_SOURCE.map(item => ({ value: item.id, label: item.name })),
    [],
  )
  const saleOptions = useMemo(() => listSale.map(item => ({
    value: item.id,
    label: item.fullName ?? item.name ?? item.username ?? `Nhân viên #${item.id}`,
  })), [listSale])
  const workflowOptions = useMemo(() => mergeById([
    ...(Array.isArray(record?.workflowInstances)
      ? record.workflowInstances.map(instance => instance?.process ?? {
        id: instance?.processId,
        name: instance?.processName,
      })
      : []),
    record?.workflowProcess,
  ].filter(Boolean), workflows).map(item => ({
    value: item.id,
    label: item.name ?? item.processKey ?? item.code ?? `Workflow #${item.id}`,
    disabled: item.enabled === false,
  })), [record, workflows])

  const handleWorkflowPopupScroll = useCallback((event) => {
    const target = event.currentTarget
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
      loadWorkflows()
    }
  }, [loadWorkflows])

  const handleSave = async () => {
    try {
      await form.validateFields()
      form.submit()
    } catch (validationError) {
      const firstInvalidField = validationError?.errorFields?.[0]?.name
      if (firstInvalidField) {
        form.scrollToField(firstInvalidField, { behavior: 'smooth', block: 'center' })
      }
      message.warning('Vui lòng kiểm tra các trường bắt buộc.')
    }
  }

  return (
    <LeadFormShell>
      <link rel="stylesheet" href="http://view.user.flast.vn/colors_and_type.css" />
      <link rel="stylesheet" href="http://view.user.flast.vn/pipe_lead.css" />
      <FormHidden name="id" />

      <LeadSection number="1" title="Thông tin Lead">
        <Form.Item
          name="customerType"
          label={<LeadLabel code="customer_type">Loại khách hàng</LeadLabel>}
          initialValue="INDIVIDUAL"
          required={false}
          className="pl-customer-type"
        >
          <Radio.Group className="pl-seg">
            <Radio value="INDIVIDUAL" className={`pl-seg__opt ${customerType === 'INDIVIDUAL' ? 'is-active' : ''}`}>
              <span className="" />
              <img src={`${ASSET_BASE_URL}/user.svg`} alt="" />
              <span className={customerType === 'INDIVIDUAL' ? 't-body-strong' : 't-body'}>Cá nhân</span>
            </Radio>
            <Radio value="BUSINESS" className={`pl-seg__opt ${customerType === 'BUSINESS' ? 'is-active' : ''}`}>
              <span className="" />
              <img src={`${ASSET_BASE_URL}/users.svg`} alt="" />
              <span className={customerType === 'BUSINESS' ? 't-body-strong' : 't-body'}>Doanh nghiệp</span>
            </Radio>
          </Radio.Group>
        </Form.Item>
        <div className="pl-grid">
          <LeadInput required name="customerName" label="Họ và tên" code="contact_name" placeholder="Trần Thị Mai" />
          <LeadInput required name="customerMobile" label="Điện thoại" code="phone" placeholder="0901 234 567" />
          <LeadInput name="customerEmail" label="Email" code="email" placeholder="tranthimai@gmail.com" />
          <LeadDatePicker name="birthday" label="Ngày sinh (tùy chọn)" code="birthday" placeholder="Chọn ngày sinh" />
          <LeadSelect name="provinceName" label="Tỉnh / Thành phố" code="province" placeholder="Chọn Tỉnh / Thành phố" options={provinceOptions} />
          <LeadInput name="customerFacebook" label="Facebook" code="facebook" placeholder="Nhập Facebook" />
          <LeadInput name="address" label="Địa chỉ" code="address" placeholder="123 Nguyễn Văn Cừ, P. An Hòa, Q. Ninh Kiều, TP. Cần Thơ" fieldClassName="full" />
        </div>

        <div className="t-caption lead-business-caption">
          Doanh nghiệp — hiện khi chọn Doanh nghiệp ở trên
        </div>
        <div className={`pl-grid lead-business-grid ${customerType !== 'BUSINESS' ? 'is-disabled' : ''}`}>
          <LeadInput required name={['business', 'companyName']} label="Tên doanh nghiệp" code="company_name" placeholder="Công ty TNHH Thực phẩm Sạch" disabled={customerType !== 'BUSINESS'} fieldClassName="full" />
          <LeadInput name={['business', 'taxCode']} label="Mã số thuế" code="tax_code" placeholder="0315123456" disabled={customerType !== 'BUSINESS'} />
          <LeadInput required name={['business', 'contactName']} label="Người liên hệ" code="contact_name" placeholder="Nguyễn Văn Hùng" disabled={customerType !== 'BUSINESS'} />
          <LeadInput name={['business', 'jobTitle']} label="Chức vụ" code="job_title" placeholder="Giám đốc" disabled={customerType !== 'BUSINESS'} />
          <LeadInput name={['business', 'website']} label="Website" code="website" placeholder="https://sachfood.vn" disabled={customerType !== 'BUSINESS'} />
        </div>
      </LeadSection>

      <LeadSection number="2" title="Nhu cầu khách hàng">
        <div className="pl-grid">
          <div className="pl-field full lead-products-field">
            <FormSelectInfiniteProduct
              required
              mode="multiple"
              name="productIds"
              label="Sản phẩm quan tâm"
              placeholder="Chọn một hoặc nhiều sản phẩm"
              valueProp="id"
              titleProp="name"
            />
          </div>
          <div className="pl-field lead-service-field">
            <FormSelectAPI
              showSearch
              allowClear
              className="pl-select"
              apiPath="erp/service/list"
              apiAddNewItem="erp/service/create"
              onData={getResponseItems}
              label="Dịch vụ"
              name="serviceId"
              valueProp="id"
              titleProp="name"
              placeholder="Chọn dịch vụ"
            />
          </div>
          <LeadSelect required name="source" label="Nguồn Lead" code="source" placeholder="Chọn nguồn Lead" options={leadSourceOptions} />
          <LeadInput name="quantityRange" label="Số lượng dự kiến" code="quantity_range" placeholder="200 - 500 kg" />
          <LeadInput name="budgetRange" label="Giá trị dự kiến" code="budget_range" placeholder="50.000.000 - 100.000.000 đ" />
          <LeadSelect name="buyingTimeline" label="Thời gian mua dự kiến" code="buying_timeline" placeholder="Chọn thời gian" options={[
            { value: 'NOW', label: 'Ngay' },
            { value: 'ONE_TO_THREE_MONTHS', label: 'Trong 1 - 3 tháng' },
            { value: 'UNDEFINED', label: 'Chưa xác định' },
          ]} />
          <Form.Item
            name="noted"
            label={<LeadLabel code="notes">Ghi chú</LeadLabel>}
            className="pl-field full pl-field--counted"
          >
            <Input.TextArea className="pl-textarea" rows={4} maxLength={500} showCount placeholder="Nhập ghi chú" />
          </Form.Item>
        </div>

        <div className="pl-field full lead-upload-field">
          <FormFileUpload
            name="fileUrls"
            label="Hình ảnh thông tin khách hàng"
            accept="image/*"
            folder="lead/images"
            image
            maxSizeMB={8}
          />
        </div>
      </LeadSection>

      <LeadSection number="3" title="Thông tin phụ trách & trạng thái">
        <div className="pl-grid pl-grid--3">
          <div>
            <LeadSelect required name="saleId" label="Nhân viên phụ trách" code="owner_id" placeholder="Chọn nhân viên" options={saleOptions} />
          </div>
          <div className="lead-workflow-column">
            <LeadSelect
              name="workflowProcessIds"
              label="Work flow"
              code="workflow_process_ids"
              placeholder="Chọn một hoặc nhiều workflow"
              options={workflowOptions}
              loading={loadingWorkflows}
              onPopupScroll={handleWorkflowPopupScroll}
              mode="multiple"
              maxTagCount="responsive"
              fieldClassName="lead-workflow-field"
              normalize={(values = []) => Array.from(new Set([
                ...attachedWorkflowIds,
                ...values,
              ]))}
              tagRender={({ label, value, closable, onClose }) => {
                const attached = attachedWorkflowIdSet.has(String(value))
                return (
                  <Tag
                    className={`lead-workflow-tag${attached ? ' is-attached' : ''}`}
                    closable={!attached && closable}
                    onClose={attached ? undefined : onClose}
                  >
                    {label}
                  </Tag>
                )
              }}
            />
          </div>
          <div className="pl-field lead-service-field">
            <FormSelectAPI
              showSearch
              allowClear
              className="pl-select"
              apiPath="entity-status/list-by-type?type=LEAD"
              apiAddNewItem="entity-status/save-application-status"
              createDefaultValues={{ entityType: 'LEAD' }}
              onData={normalizeLeadStatuses}
              label="Trạng thái Lead"
              name="status"
              valueProp="id"
              titleProp="name"
              placeholder="Chọn trạng thái Lead"
            />
          </div>
          <LeadSelect name="interestLevel" label="Mức độ quan tâm" code="interest_level" placeholder="Chọn mức độ" options={[
            { value: 'HIGH', label: 'Cao' },
            { value: 'MEDIUM', label: 'Trung bình' },
            { value: 'LOW', label: 'Thấp' },
          ]} />
          <LeadDatePicker disabled name="inTime" label="Ngày tạo" code="created_at" placeholder="Tự sinh khi tạo Lead" fieldClassName="lead-readonly" />
          <LeadDatePicker disabled name="lastContactedAt" label="Ngày liên hệ gần nhất" code="last_contacted_at" placeholder="Chưa có" fieldClassName="lead-readonly" />
          <LeadDatePicker
            name="nextAppointmentAt"
            label="Lịch hẹn tiếp theo"
            code="next_appointment_at"
            placeholder="Chọn ngày hẹn"
          />
        </div>

        <div className="pl-effect">
          <div className="pl-effect__head">
            <img src={`${ASSET_BASE_URL}/zap.svg`} alt="" />
            <span className="t-body-strong">Sau khi lưu, hệ thống tự động</span>
          </div>
          <ul className="pl-effect__list">
            <li><img src={`${ASSET_BASE_URL}/check.svg`} alt="" /> Tạo task liên hệ đầu tiên cho nhân viên phụ trách</li>
            <li><img src={`${ASSET_BASE_URL}/check.svg`} alt="" /> Tính điểm lead (score) ban đầu từ nhu cầu + nguồn</li>
            <li><img src={`${ASSET_BASE_URL}/check.svg`} alt="" /> Ghi lịch sử: — → NEW</li>
          </ul>
        </div>
      </LeadSection>

      <footer className="pl-foot lead-form-actions">
        <div className="pl-foot__actions">
          <Button className="btn btn--primary" loading={submitting} onClick={handleSave}>
            <img src={`${ASSET_BASE_URL}/save.svg`} alt="" width="14" height="14" />
            {record?.id ? 'Cập nhật Lead' : 'Lưu Lead'}
          </Button>
        </div>
      </footer>
    </LeadFormShell>
  )
}

export default LeadForm
