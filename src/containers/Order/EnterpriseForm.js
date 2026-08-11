/**************************************************************************/
/*  EnterpriseForm.js                                                     */
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

import { useEffect, useState, useCallback } from "react";
import { Form, Row, Col, Button, Upload, Space, Card } from "antd";

import {
  CustomButton,
  FormAddress,
  FormHidden,
  FormInput,
  FormInputNumber,
  FormTextArea,
  FileUploadView
} from "@flast-erp/core/components";

import { GATEWAY, SUCCESS_CODE } from "@/configs";
import { useEffectAsync } from "@flast-erp/core/hooks";
import { 
  RequestUtils, 
  arrayNotEmpty,
  InAppEvent
} from "@flast-erp/core/utils";

import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import axios from "axios";

const EMPTY_ENTERPRISE = {};
const ENTERPRISE_PAYLOAD_FIELDS = [
  'companyName',
  'totalFee',
  'contactName',
  'taxCode',
  'director',
  'address',
  'wardId',
  'provinceId',
  'email',
  'mobilePhone',
  'description',
];

const toNullableValue = (value) => (
  value === undefined || value === null || value === '' ? null : value
);

const normalizeAdditionalInfo = (items) => {
  if (!Array.isArray(items)) return null;

  const normalizedItems = items
    .filter(item => item?.label || item?.value)
    .map(item => ({
      label: toNullableValue(item?.label),
      value: toNullableValue(item?.value),
    }));

  return normalizedItems.length ? normalizedItems : null;
};

const buildStandaloneEnterprisePayload = (values) => {
  const payload = ENTERPRISE_PAYLOAD_FIELDS.reduce((result, field) => ({
    ...result,
    [field]: toNullableValue(values?.[field]),
  }), {});

  payload.additionalInfo = normalizeAdditionalInfo(values?.additionalInfo);

  if (values?.id) {
    payload.id = values.id;
  }
  return payload;
};

const EnterpriseForm = ({
  customerOrder,
  initialValues = EMPTY_ENTERPRISE,
  onCancel,
  onSuccess,
}) => {

  const [ form ] = Form.useForm();
  const isStandaloneEdit = !customerOrder && Boolean(initialValues?.id);
  const [ filesUrl, setFileUrls ] = useState([]);
  const [ multiPathFile, setMultiPathFile ] = useState([]);

  const propsFile = {
    name: 'file',
    multiple: true,
    beforeUpload: (file) => {
      setMultiPathFile(f => [...f, file]);
      return false;
    },
    showUploadList: false,
    defaultFileList: []
  };

  const onRemoveMultiPathFile = (name) => {
    let files = multiPathFile.filter(i => i.name !== name);
    setMultiPathFile(files);
  }

  useEffectAsync(async () => {
    if (!customerOrder) {
      return;
    }
    const { data, errorCode } = await RequestUtils.Get("/customer/fetch-customer-enterprise", {
      code: customerOrder.code,
      limit: 1
    });
    if (arrayNotEmpty(data?.embedded || []) && errorCode === SUCCESS_CODE) {
      let [enterprise] = data.embedded;
      form.setFieldsValue(enterprise);
    }
    let contracts = await RequestUtils.GetAsList("/order/get-contract", {
      code: customerOrder.code
    });
    setFileUrls(contracts);
  }, [customerOrder]);

  useEffect(() => {
    if (customerOrder) {
      return;
    }
    form.resetFields();
    form.setFieldsValue(initialValues);
    setFileUrls([]);
    setMultiPathFile([]);
  }, [customerOrder, form, initialValues]);

  const onSubmitForm = async (values) => {
    if (!customerOrder) {
      try {
        const response = await RequestUtils.Post(
          '/erp/customer/save-enterprise',
          buildStandaloneEnterprisePayload(values)
        );
        if (response?.success === false || Number(response?.errorCode) !== SUCCESS_CODE) {
          InAppEvent.normalError(response?.message || "Lưu thông tin doanh nghiệp thất bại");
          return;
        }
        InAppEvent.normalInfo(response?.message || "Lưu thông tin doanh nghiệp thành công");
        onSuccess?.(response?.data);
      } catch (error) {
        InAppEvent.normalError(error?.message || "Lưu thông tin doanh nghiệp thất bại");
      }
      return;
    }

    const formData = new FormData();
    for (let file of multiPathFile) {
      formData.append('contracts[]', file);
    }
    for (const [key, value] of Object.entries(values).filter(([_, value]) => Boolean(value))) {
      formData.append(key, value);
    }
    const endpoint = RequestUtils.generateUrlGetParams(
      "/customer/create-enterprise",
      customerOrder?.id ? { orderId: customerOrder.id } : {}
    );

    try {
      const response = await axios.post(String(GATEWAY).concat(endpoint), formData).then(({ data }) => data);
      if (response?.success === false || (response?.errorCode && Number(response.errorCode) !== SUCCESS_CODE)) {
        InAppEvent.normalError(response?.message || "Tạo khách doanh nghiệp thất bại");
        return;
      }
      InAppEvent.normalInfo(response?.message || "Tạo khách doanh nghiệp thành công");
      onSuccess?.(response?.data);
    } catch (error) {
      InAppEvent.normalError(error?.response?.data?.message || "Lưu thông tin doanh nghiệp thất bại");
    }
  }

  const onRemoveUrlFile = useCallback(async (url) => {
    if (!customerOrder?.code) {
      return;
    }
    const file = new URL(url).pathname;
    const { errorCode } = await RequestUtils.Post("/order/delete-contract-file", { file }, { code: customerOrder.code });
    if (errorCode === SUCCESS_CODE) {
      setFileUrls(prev => prev.filter(i => i !== url));
    }
  }, [customerOrder]);

  return (
    <Form form={form} layout="vertical" onFinish={onSubmitForm}>
      <Row gutter={16}>
        <Col span={24}>
          <FormHidden name={"id"} />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            label="Mã số thuế"
            name="taxCode"
            required
            placeholder="Mã số thuế"
          />
        </Col>
        {!customerOrder && (
          <Col md={12} xs={24}>
            <FormInputNumber
              label="Tổng phí"
              name="totalFee"
              placeholder="Nhập tổng phí"
              min={0}
            />
          </Col>
        )}
        <Col md={12} xs={24}>
          <FormInput
            label="Tên công ty"
            name="companyName"
            required
            placeholder="Tên công ty"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            label="Giám đốc"
            name="director"
            required
            placeholder="Giám đốc công ty"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            label="Người liên hệ"
            name="contactName"
            required
            placeholder="Người liên hệ"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            label="Điện thoại liên hệ"
            name="mobilePhone"
            required
            placeholder="Điện thoại liên hệ"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            label="Email"
            name="email"
            placeholder="Email"
          />
        </Col>
        {/* Address */}
        <FormAddress />
        {!customerOrder && (
          <>
            <Col span={24}>
              <FormTextArea
                label="Mô tả"
                name="description"
                placeholder="Nhập mô tả doanh nghiệp"
                rows={3}
              />
            </Col>
            <Col span={24}>
              <Card size="small" title="Thông tin bổ sung" style={{ marginBottom: 24 }}>
                <Form.List name="additionalInfo">
                  {(fields, { add, remove }) => (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      {fields.map(field => (
                        <Row key={field.key} gutter={12} align="top">
                          <Col xs={24} md={10}>
                            <FormInput
                              label="Nhãn"
                              name={[field.name, 'label']}
                              placeholder="Ví dụ: Lĩnh vực hoạt động"
                            />
                          </Col>
                          <Col xs={20} md={12}>
                            <FormInput
                              label="Giá trị"
                              name={[field.name, 'value']}
                              placeholder="Nhập giá trị"
                            />
                          </Col>
                          <Col xs={4} md={2} style={{ paddingTop: 30 }}>
                            <Button
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                              aria-label="Xóa thông tin bổ sung"
                            />
                          </Col>
                        </Row>
                      ))}
                      <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
                        Thêm thông tin
                      </Button>
                    </Space>
                  )}
                </Form.List>
              </Card>
            </Col>
          </>
        )}
        {customerOrder && (
          <>
            <Col md={8} xs={24}>
              <Form.Item label="File hợp đồng (Nếu có)">
                <Upload {...propsFile}>
                  <Button icon={<UploadOutlined />}>Tải File (doc, pdf)</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col md={16} xs={24}>
              <Row gutter={8}>
                <FileUploadView
                  files={filesUrl}
                  onRemoveFile={onRemoveUrlFile}
                  multiPathFile={multiPathFile}
                  onRemoveMultiPathFile={onRemoveMultiPathFile}
                />
              </Row>
            </Col>
          </>
        )}
        <Col md={24} xs={24}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            {onCancel && <Button onClick={onCancel}>Huỷ</Button>}
            <CustomButton
              htmlType="submit"
              title={customerOrder ? "Hoàn thành" : isStandaloneEdit ? "Cập nhật" : "Tạo mới"}
            />
          </Space>
        </Col>
      </Row>
    </Form>
  )
}

export default EnterpriseForm;
