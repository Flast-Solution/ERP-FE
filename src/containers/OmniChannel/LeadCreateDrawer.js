/**************************************************************************/
/*  @/containers/OmniChannel/LeadCreateDrawer.js                          */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Mở qua HASH_MODAL với hash 'omni.lead.create'.                         */
/* Nhận props từ InAppEvent: conversationId, defaultName, channelName,    */
/* onSubmit (chính là createLead của useOmniInbox).                       */
/**************************************************************************/

import { useEffect, useState } from 'react'
import { Alert, Col, Form, Row } from 'antd'
import {
  FormInput,
  FormTextArea,
  FormSelectAPI,
  CustomButton,
} from '@flast-erp/core/components'
import { InAppEvent } from '@flast-erp/core/utils'
import { HASH_POPUP } from '@/configs/constant'

/* Chuẩn hoá số trước khi gửi: bỏ khoảng trắng, dấu chấm, +84 -> 0 */
const normalizeMobile = (value = '') =>
  String(value)
    .replace(/[\s.\-()]/g, '')
    .replace(/^\+?84/, '0')

const MOBILE_PATTERN = /^0\d{9}$/

const LeadCreateDrawer = ({ conversationId, defaultName, channelName, onSubmit, closeModal }) => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    form.setFieldsValue({ fullName: defaultName || '' })
  }, [form, defaultName])

  /* Gọi lại chính luồng tạo lead, lần này kèm customerId đã chọn */
  const submitWithCustomer = async (values, customerId) => {
    const result = await onSubmit({ ...values, customerId })
    if (result?.ok) closeModal()
  }

  const handleFinish = async (values) => {
    const payload = {
      ...values,
      mobile: normalizeMobile(values.mobile),
      customerId: null,
    }

    setSubmitting(true)
    try {
      const result = await onSubmit(payload)

      if (result?.ok) {
        closeModal()
        return
      }

      /* Trùng số điện thoại — mở popup để sale quyết định.
         Đây là điểm kiểm trùng DUY NHẤT của module. */
      if (result?.duplicated?.length) {
        InAppEvent.emit(HASH_POPUP, {
          hash: 'omni.customer.duplicated',
          title: 'Số điện thoại đã có trong hệ thống',
          data: {
            mobile: payload.mobile,
            duplicated: result.duplicated,
            onPick: (customerId) => submitWithCustomer(payload, customerId),
            onCreateNew: () => submitWithCustomer(payload, null),
          },
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={`Khách nhắn từ ${channelName || 'kênh chưa xác định'}`}
        description="Tư vấn xin số điện thoại rồi nhập vào đây. Hệ thống sẽ kiểm tra khách đã tồn tại chưa."
      />

      <Row gutter={16}>
        <Col md={12} xs={24}>
          <FormInput required name="fullName" label="Tên khách hàng" placeholder="Nhập tên khách" />
        </Col>
        <Col md={12} xs={24}>
          <Form.Item
            name="mobile"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Nhập số điện thoại' },
              {
                validator: (_, value) =>
                  !value || MOBILE_PATTERN.test(normalizeMobile(value))
                    ? Promise.resolve()
                    : Promise.reject(new Error('Số điện thoại không hợp lệ')),
              },
            ]}
          >
            <FormInput.Raw placeholder="09xxxxxxxx" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col md={12} xs={24}>
          <FormSelectAPI
            name="serviceId"
            label="Dịch vụ quan tâm"
            apiPath="erp/service"
            valueProp="id"
            titleProp="name"
            searchKey="name"
            placeholder="Chọn dịch vụ"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelectAPI
            name="ownerUserId"
            label="Giao cho nhân viên"
            apiPath="erp/users"
            valueProp="id"
            titleProp="full_name"
            searchKey="full_name"
            placeholder="Để trống sẽ giao cho người đang trực"
          />
        </Col>
      </Row>

      <FormTextArea
        name="note"
        label="Nhu cầu của khách"
        placeholder="Tóm tắt nội dung khách đang hỏi"
        rows={3}
      />

      <div style={{ textAlign: 'right', marginTop: 8 }}>
        <CustomButton htmlType="submit" loading={submitting} title="Tạo lead" />
      </div>
    </Form>
  )
}

export default LeadCreateDrawer