/**************************************************************************/
/*  ProductForm.js                                                        */
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
import { Row, Col, Typography, Form } from 'antd';
import FormHidden from 'components/form/FormHidden';
import CustomButton from 'components/CustomButton';
import FormSelectAPI from 'components/form/FormSelectAPI';
import FormInput from 'components/form/FormInput';
import FormListAddition from 'components/form/FormListAddtion';
import ProductFormProperty from './ProductFormProperty';
import { SwitcherOutlined } from '@ant-design/icons';
import ProductFormPrice from './ProductFormPrice';
import FormSelect from 'components/form/FormSelect';
import { PRODUCT_STATUS } from 'configs/localData';
import { FormListStyles } from "css/global";

const ProductForm = () => {
  return (
    <>
      <Row gutter={16} style={{ marginTop: 20 }}>
        <FormHidden name={'id'} />
        <Col md={24} xs={24}>
          <FormInput
            required
            label="Tên sản phẩm"
            name="name"
            placeholder={"Nhập tên sản phẩm"}
          />
        </Col>

        <Col md={12} xs={24}>
          <FormSelectAPI
            required
            showSearch
            onData={(data) => data ?? []}
            apiPath='service/list'
            apiAddNewItem='product-type/save'
            label="Dịch vụ"
            name="serviceId"
            placeholder="Chọn dịch vụ"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelectAPI
            required
            apiPath='provider/fetch'
            apiAddNewItem='provider/save'
            onData={(data) => data?.embedded ?? []}
            label="Nhà cung cấp"
            name="providerId"
            placeholder="Chọn nhà cung cấp"
          />
        </Col>

        <Col md={12} xs={24}>
          <FormInput
            label="Đơn vị tính"
            name="unit"
            placeholder={"Nhập đơn vị tính"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelect
            required
            resourceData={PRODUCT_STATUS}
            valueProp='value'
            titleProp='text'
            label="Trạng thái"
            name="status"
            placeholder={"Chọn trạng thái"}
          />
        </Col>

        <Col md={24} xs={24}>
          <Typography.Title level={5}>
            <SwitcherOutlined />
            <span style={{ marginLeft: 20 }}>Thiết lập sản phẩm (Có tính nhận diện tồn kho)</span>
          </Typography.Title>
          <FormListAddition
            name="listProperties"
            textAddNew="Thêm mới thuộc tính"
          >
            <ProductFormProperty />
          </FormListAddition>
        </Col>

        <Col md={24} xs={24}>
          <Typography.Title level={5}>
            <SwitcherOutlined />
            <span style={{ marginLeft: 20 }}>Thiết lập giá bán</span>
          </Typography.Title>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, curValues) =>
              prevValues.listProperties !== curValues.listProperties
            }
          >
            {({ getFieldValue }) => {
              let listProperties = getFieldValue('listProperties');
              return (
                <ProductFormPrice listProperties={listProperties} />
              )
            }}
          </Form.Item>
        </Col>

        <Col md={24} xs={24}>
          <Typography.Title level={5}>
            <SwitcherOutlined />
            <span style={{ marginLeft: 20 }}>Thông tin mở rộng</span>
          </Typography.Title>
          <FormListAddition
            name="listOpenInfo"
            textAddNew="Thêm mới"
            showBtnInLeft={false}
          >
            <FormOpenInfo />
          </FormListAddition>
        </Col>
        <Col md={24} xs={24}>
          <CustomButton
            htmlType="submit"
            title="Hoàn thành"
            color="danger"
            variant="solid"
          />
        </Col>
      </Row>
    </>
  )
}

const FormOpenInfo = ({ field }) => {
  const { name } = field || { name: 0 };
  return (
    <FormListStyles gutter={16}>
      <Col md={6} xs={24}>
        <FormInput
          name={[name, 'name']}
          required
          placeholder={"Tên trường"}
        />
      </Col>
      <Col md={14} xs={24}>
        <FormInput
          required
          name={[name, 'value']}
          placeholder="Gía trị"
        />
      </Col>
      <Col md={4} xs={24}>
        <FormInput
          name={[name, 'icon']}
          required={false}
          placeholder={"Icon"}
        />
      </Col>
    </FormListStyles>
  )
}

export default ProductForm;