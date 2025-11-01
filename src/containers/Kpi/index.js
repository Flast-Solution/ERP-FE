/**************************************************************************/
/*  containers.kpi.index.js                                               */
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

import { useEffect } from "react";
import { Form, Row, Col, message } from "antd";
import FormHidden from "components/form/FormHidden";
import CustomButton from "components/CustomButton";
import FormListAddition from "components/form/FormListAddtion";
import { FormListStyles } from "css/global";
import FormInputNumber from "components/form/FormInputNumber";
import FormSelect from "components/form/FormSelect";
import FormSelectInfiniteBusinessUser from "components/form/SelectInfinite/FormSelectInfiniteBusinessUser";
import { KPI_TYPE } from "configs/localData";
import FormDatePicker from "components/form/FormDatePicker";
import { dateFormatOnSubmit } from "utils/dataUtils";
import RequestUtils from "utils/RequestUtils";

const KPIForm = ({ onSave, kpi }) => {

  const [ form ] = Form.useForm();
  const onSubmitForm = async (values) => {
    dateFormatOnSubmit(values, ['inTime'], "YYYY-MM-DD")
    const { message: MSG, data } = await RequestUtils.Post("/kpi/save", values);
    message.info(MSG);
    onSave(data);
  }

  useEffect(() => {
    form.setFieldsValue(kpi);
  }, [kpi, form])

  return (
    <Form form={form} layout="vertical" onFinish={onSubmitForm}>
      <Row gutter={16}>
        <Col md={24} xs={24}>
          <FormHidden name={"id"} />
        </Col>
        <Col md={12} xs={24}>
          <FormSelectInfiniteBusinessUser
            name={'userId'}
            label="Chọn thành viên"
            required
            placeholder={"Thành viên"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormDatePicker 
            label="Chọn tháng"
            name={'inTime'}
            format="MM-YYYY"
            required
            placeholder={"Chọn tháng"}
          />
        </Col>
        <Col md={24} xs={24}>
          <FormListAddition
            name="listKpi"
            textAddNew="Thêm mới KPI"
          >
            <KPIFormItem />
          </FormListAddition>
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

const KPIFormItem = ({ field }) => {
  const { name } = field || { name: 0 };
  return (
    <FormListStyles gutter={16}>
      <Col md={8} xs={24}>
        <FormSelect
          required
          titleProp="text"
          valueProp="value"
          resourceData={KPI_TYPE}
          name={[name, 'name']}
          placeholder="Loại KPI"
        />
      </Col>
      <Col md={8} xs={24}>
        <FormInputNumber
          style={{ width: '100%' }}
          min={1}
          name={[name, 'target']}
          required
          placeholder={"Mục tiêu"}
        />
      </Col>
      <Col md={8} xs={24}>
        <FormInputNumber
          style={{ width: '100%' }}
          min={1}
          name={[name, 'current']}
          placeholder={"Hoàn thành"}
        />
      </Col>
    </FormListStyles>
  )
}

export default KPIForm