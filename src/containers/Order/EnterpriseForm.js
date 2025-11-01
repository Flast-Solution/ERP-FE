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

import { useState, useCallback } from "react";
import { Form, Row, Col, Button, Upload } from "antd";
import CustomButton from "components/CustomButton";
import FormAddress from "components/form/FormAddress";
import FormHidden from "components/form/FormHidden";
import FormInput from "components/form/FormInput";
import { GATEWAY, SUCCESS_CODE } from "configs";
import { useEffectAsync } from "hooks/MyHooks";
import { arrayNotEmpty } from "utils/dataUtils";
import RequestUtils from "utils/RequestUtils";
import { UploadOutlined } from '@ant-design/icons';
import axios from "axios";
import { InAppEvent } from "utils/FuseUtils";
import FileUploadView from "components/common/File/FileUploadView";

const EnterpriseForm = ({ customerOrder }) => {

  const [ form ] = Form.useForm();
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

  const onSubmitForm = async (values) => {
    const formData = new FormData();
    for (let file of multiPathFile) {
      formData.append('contracts[]', file);
    }
    for (const [key, value] of Object.entries(values).filter(([_, value]) => Boolean(value))) {
      formData.append(key, value);
    }
    const endpoint = RequestUtils.generateUrlGetParams("/customer/create-enterprise", {
      orderId: customerOrder.id
    })
    axios.post(String(GATEWAY).concat(endpoint), formData).then(d => d.data).then(
      ({ message }) => InAppEvent.normalInfo(message)
    )
  }

  const onRemoveUrlFile = useCallback(async (url) => {
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
        <Col md={24} xs={24}>
          <CustomButton
            htmlType="submit"
          />
        </Col>
      </Row>
    </Form>
  )
}

export default EnterpriseForm;