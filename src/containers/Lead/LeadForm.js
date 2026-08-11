import { useContext, useEffect, useMemo, useState } from 'react'
import { Button, Col, Form, Input, Radio, Row, Select, message } from 'antd'

import {
  FormContextCustom,
  FormHidden,
  FormSelectInfiniteProduct,
} from '@flast-erp/core/components'
import { RequestUtils } from '@flast-erp/core/utils'
import { CHANNEL_SOURCE } from '@/configs/localData'
import FormFileUpload from '@/containers/PreviewModal/FormFileUpload'

import { LeadFormShell } from './styles'

const CONFIG_FETCH_API = '/erp/config/fetch'
const LEAD_STATUS_KEYS = ['LEAD_STATUS', 'LEAD_STATUSES', 'STATUS_LEAD']

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

const parseOptions = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (_) {
    return []
  }
}

const normalizeOption = (item, index) => {
  if (item === undefined || item === null || item === '') return null
  if (typeof item !== 'object') return { value: item, label: String(item) }
  const value = item.value ?? item.code ?? item.id ?? item.key ?? index
  const label = item.name ?? item.label ?? item.title ?? item.text ?? item.value ?? item.code
  return value === undefined || value === null || label === undefined || label === null
    ? null
    : { value, label: String(label) }
}

const matchesConfigKey = (key, aliases) => {
  const normalized = String(key ?? '').trim().toUpperCase()
  return aliases.some(alias => normalized === alias || normalized.startsWith(`${alias}_`))
}

const resolveConfigOptions = (items, aliases) => items
  .filter(item => matchesConfigKey(item?.key, aliases))
  .flatMap((item) => {
    const nested = parseOptions(item?.value)
    return nested.length ? nested : [item]
  })
  .map(normalizeOption)
  .filter(Boolean)

const LeadSection = ({ number, title, children }) => (
  <section className="lead-form-section">
    <div className="lead-form-section__head">
      <span className="lead-form-section__number">{number}</span>
      <h3 className="lead-form-section__title">{title}</h3>
    </div>
    {children}
  </section>
)

const LeadInput = ({ name, label, required, ...props }) => (
  <Form.Item
    name={name}
    label={label}
    rules={required ? [{ required: true, message: `Vui lòng nhập ${String(label).toLowerCase()}` }] : []}
  >
    <Input {...props} />
  </Form.Item>
)

const LeadSelect = ({ name, label, required, options = [], ...props }) => (
  <Form.Item
    name={name}
    label={label}
    rules={required ? [{ required: true, message: `Vui lòng chọn ${String(label).toLowerCase()}` }] : []}
  >
    <Select options={options} optionFilterProp="label" showSearch allowClear {...props} />
  </Form.Item>
)

const LeadForm = ({ listServices = [], listSale = [], submitting = false }) => {
  const { form, record } = useContext(FormContextCustom)
  const [provinces, setProvinces] = useState([])
  const [leadStatuses, setLeadStatuses] = useState([])
  const [loadingConfigs, setLoadingConfigs] = useState(false)
  const customerType = Form.useWatch('customerType', form) ?? record?.customerType ?? 'INDIVIDUAL'

  useEffect(() => {
    RequestUtils.GetAsList('/province/find', { id: 0 }).then(setProvinces).catch(() => setProvinces([]))
  }, [])

  useEffect(() => {
    let mounted = true
    setLoadingConfigs(true)
    RequestUtils.Get(CONFIG_FETCH_API, { limit: 500, offset: 0 })
      .then((response) => {
        if (!mounted) return
        const items = getResponseItems(response)
        setLeadStatuses(resolveConfigOptions(items, LEAD_STATUS_KEYS))
      })
      .catch(() => {
        if (!mounted) return
        setLeadStatuses([])
      })
      .finally(() => {
        if (mounted) setLoadingConfigs(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!form || !leadStatuses.length) return
    const current = form.getFieldValue('status')
    if (current !== undefined && current !== null && current !== '') return
    const initial = leadStatuses.find(option => (
      ['NEW', 'CREATE_DATA'].includes(String(option.value).toUpperCase())
    )) ?? leadStatuses[0]
    form.setFieldValue('status', initial?.value)
  }, [form, leadStatuses])

  const provinceOptions = useMemo(
    () => provinces.map(item => ({ value: item.name, label: item.name })),
    [provinces],
  )
  const serviceOptions = useMemo(
    () => listServices.map(item => ({ value: item.id, label: item.name })),
    [listServices],
  )
  const leadSourceOptions = useMemo(
    () => CHANNEL_SOURCE.map(item => ({ value: item.id, label: item.name })),
    [],
  )
  const saleOptions = useMemo(() => listSale.map(item => ({
    value: item.id,
    label: item.fullName ?? item.name ?? item.username ?? `Nhân viên #${item.id}`,
  })), [listSale])

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
      <FormHidden name="id" />

      <LeadSection number="1" title="Thông tin Lead">
        <Form.Item name="customerType" label="Loại khách hàng" initialValue="INDIVIDUAL">
          <Radio.Group className="lead-customer-type" optionType="button" buttonStyle="solid">
            <Radio.Button value="INDIVIDUAL">Cá nhân</Radio.Button>
            <Radio.Button value="BUSINESS">Doanh nghiệp</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Row gutter={16}>
          <Col md={12} xs={24}><LeadInput required name="customerName" label="Họ và tên" placeholder="Nhập họ và tên" /></Col>
          <Col md={12} xs={24}><LeadInput required name="customerMobile" label="Điện thoại" placeholder="Nhập số điện thoại" /></Col>
          <Col md={12} xs={24}><LeadInput name="customerEmail" label="Email" placeholder="Nhập email" /></Col>
          <Col md={12} xs={24}><LeadInput name="birthday" label="Ngày sinh" placeholder="dd/mm/yyyy" /></Col>
          <Col md={12} xs={24}><LeadSelect name="provinceName" label="Tỉnh / Thành phố" placeholder="Chọn Tỉnh / Thành phố" options={provinceOptions} /></Col>
          <Col md={12} xs={24}><LeadInput name="customerFacebook" label="Facebook" placeholder="Nhập Facebook" /></Col>
          <Col span={24}><LeadInput name="address" label="Địa chỉ" placeholder="Nhập địa chỉ" /></Col>
        </Row>
        {customerType === 'BUSINESS' ? (
          <Row gutter={16}>
            <Col span={24}><LeadInput required name="companyName" label="Tên doanh nghiệp" placeholder="Nhập tên doanh nghiệp" /></Col>
            <Col md={12} xs={24}><LeadInput name="taxCode" label="Mã số thuế" placeholder="Nhập mã số thuế" /></Col>
            <Col md={12} xs={24}><LeadInput required name="contactName" label="Người liên hệ" placeholder="Nhập người liên hệ" /></Col>
            <Col md={12} xs={24}><LeadInput name="jobTitle" label="Chức vụ" placeholder="Nhập chức vụ" /></Col>
            <Col md={12} xs={24}><LeadInput name="website" label="Website" placeholder="https://" /></Col>
          </Row>
        ) : null}
      </LeadSection>

      <LeadSection number="2" title="Nhu cầu khách hàng">
        <Row gutter={16}>
          <Col span={24}>
            <FormSelectInfiniteProduct
              required
              mode="multiple"
              name="productIds"
              label="Sản phẩm quan tâm"
              placeholder="Chọn một hoặc nhiều sản phẩm"
              valueProp="id"
              titleProp="name"
            />
          </Col>
          <Col md={12} xs={24}><LeadSelect name="serviceId" label="Dịch vụ" placeholder="Chọn dịch vụ" options={serviceOptions} /></Col>
          <Col md={12} xs={24}><LeadSelect required name="source" label="Nguồn Lead" placeholder="Chọn nguồn Lead" options={leadSourceOptions} /></Col>
          <Col md={12} xs={24}><LeadInput name="quantityRange" label="Số lượng dự kiến" placeholder="Ví dụ: 200 - 500" /></Col>
          <Col md={12} xs={24}><LeadInput name="budgetRange" label="Giá trị dự kiến" placeholder="Nhập khoảng ngân sách" /></Col>
          <Col md={12} xs={24}>
            <LeadSelect name="buyingTimeline" label="Thời gian mua dự kiến" placeholder="Chọn thời gian" options={[
              { value: 'NOW', label: 'Ngay' },
              { value: 'ONE_TO_THREE_MONTHS', label: 'Trong 1 - 3 tháng' },
              { value: 'UNDEFINED', label: 'Chưa xác định' },
            ]} />
          </Col>
          <Col md={12} xs={24}>
            <LeadSelect name="interestLevel" label="Mức độ quan tâm" placeholder="Chọn mức độ" options={[
              { value: 'HIGH', label: 'Cao' },
              { value: 'MEDIUM', label: 'Trung bình' },
              { value: 'LOW', label: 'Thấp' },
            ]} />
          </Col>
          <Col span={24}>
            <Form.Item name="noted" label="Ghi chú">
              <Input.TextArea rows={4} maxLength={500} showCount placeholder="Nhập ghi chú" />
            </Form.Item>
          </Col>
        </Row>

        <FormFileUpload
          name="fileUrls"
          label="Hình ảnh thông tin khách hàng"
          accept="image/*"
          folder="lead/images"
          image
          maxSizeMB={8}
        />
      </LeadSection>

      <LeadSection number="3" title="Thông tin phụ trách & trạng thái">
        <Row gutter={16}>
          <Col md={8} xs={24}><LeadSelect required name="saleId" label="Nhân viên phụ trách" placeholder="Chọn nhân viên" options={saleOptions} /></Col>
          <Col md={8} xs={24} className="lead-readonly">
            <LeadSelect disabled name="status" label="Trạng thái Lead" placeholder="Hệ thống tự xác định" options={leadStatuses} loading={loadingConfigs} />
            <div className="lead-field-hint">Trạng thái được cập nhật qua luồng xử lý Lead.</div>
          </Col>
          <Col md={8} xs={24} className="lead-readonly"><LeadInput disabled name="inTime" label="Ngày tạo" placeholder="Tự sinh khi tạo Lead" /></Col>
          <Col md={12} xs={24} className="lead-readonly"><LeadInput disabled name="lastContactedAt" label="Ngày liên hệ gần nhất" placeholder="Chưa có" /></Col>
          <Col md={12} xs={24} className="lead-readonly"><LeadInput disabled name="nextAppointmentAt" label="Lịch hẹn tiếp theo" placeholder="Chưa có" /></Col>
        </Row>
      </LeadSection>

      <div className="lead-form-actions">
        <Button type="primary" danger loading={submitting} onClick={handleSave}>
          Lưu Lead
        </Button>
      </div>
    </LeadFormShell>
  )
}

export default LeadForm
