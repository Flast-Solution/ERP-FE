import React from 'react'
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'

import { DEFAULT_LOT_VALUES } from '../constants'
import {
  AddLotButton,
  LotBlock,
  LotBlockHeader,
  SectionTitle,
} from '../styles'

const LotConfigurationForm = ({
  form,
  productOptions,
  workflowOptions,
  providerOptions,
  loadingProviders,
  workflowLoading,
  isEditing,
  validateLotQuantity,
}) => (
  <>
    <SectionTitle>Cấu hình lô hàng</SectionTitle>
    <Form.List name="lots">
      {(fields, { add, remove }) => (
        <>
          {fields.map((field, index) => (
            <LotBlock key={field.key}>
              <Form.Item name={[field.name, 'id']} hidden>
                <Input />
              </Form.Item>
              {fields.length > 1 ? (
                <LotBlockHeader>
                  <span className="lot-title">Lô hàng {index + 1}</span>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                  >
                    Xoá
                  </Button>
                </LotBlockHeader>
              ) : null}
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={[field.name, 'lotName']}
                    label="Tên lô hàng"
                    rules={[{ required: true, message: 'Vui lòng nhập tên lô hàng' }]}
                  >
                    <Input placeholder="Nhập tên lô hàng" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={[field.name, 'lotCode']} label="Mã lô hàng">
                    <Input placeholder="Tự sinh nếu để trống" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={[field.name, 'orderDetailKey']}
                    label="Chọn sản phẩm (Mã đơn con)"
                    rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
                  >
                    <Select
                      placeholder="Chọn sản phẩm..."
                      options={productOptions}
                      showSearch
                      optionFilterProp="label"
                      onChange={() => {
                        form.validateFields([['lots', field.name, 'quantity']]).catch(() => undefined)
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={[field.name, 'quantity']}
                    label="Số lượng"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số lượng' },
                      { validator: validateLotQuantity(field.name) },
                    ]}
                  >
                    <InputNumber min={1} placeholder="Nhập số lượng" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={[field.name, 'workflowProcessId']}
                    label="Workflow"
                    rules={[{ required: true, message: 'Vui lòng chọn workflow' }]}
                  >
                    <Select
                      allowClear
                      showSearch
                      loading={workflowLoading}
                      placeholder="Chọn workflow"
                      options={workflowOptions}
                      optionFilterProp="label"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={[field.name, 'plannedDate']}
                    label="Ngày nhập lô"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày nhập lô' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={[field.name, 'prviderId']} label="Nhà cung cấp">
                    <Select
                      allowClear
                      showSearch
                      loading={loadingProviders}
                      placeholder="Chọn nhà cung cấp"
                      options={providerOptions}
                      optionFilterProp="label"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name={[field.name, 'note']} label="Ghi chú">
                    <Input.TextArea rows={4} placeholder="Nhập ghi chú cho lô hàng" />
                  </Form.Item>
                </Col>
              </Row>
            </LotBlock>
          ))}

          <AddLotButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => add({ ...DEFAULT_LOT_VALUES })}
            disabled={isEditing}
          >
            Thêm lô hàng
          </AddLotButton>
        </>
      )}
    </Form.List>
  </>
)

export default LotConfigurationForm
