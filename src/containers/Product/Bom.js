/**************************************************************************/
/*  Bom.js                                                                */
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
import { useState, useContext } from 'react';
import RestEditModal from 'components/RestLayout/RestEditModal';
import FormListAddition from "components/form/FormListAddtion";
import { Col, Row, Typography, Form, message } from 'antd';
import { SwitcherOutlined } from '@ant-design/icons';
import FormSelectInfiniteMaterial from 'components/form/SelectInfinite/FormSelectInfiniteMaterial';
import FormInputNumber from 'components/form/FormInputNumber';
import FormHidden from 'components/form/FormHidden';
import { FormContextCustom } from 'components/context/FormContextCustom';
import CustomButton from 'components/CustomButton';
import FormInput from 'components/form/FormInput';
import { arrayEmpty, formatMoney } from 'utils/dataUtils';
import RequestUtils from 'utils/RequestUtils';
import { useEffectAsync } from 'hooks/MyHooks';
import FormSelect from 'components/form/FormSelect';

const ProductBomContainer = ({ closeModal, data }) => {

  const [ record, setRecord ] = useState({});
  useEffectAsync(async () => {
    const mPData = await RequestUtils.GetAsList("/product-material/find-by-product/" + data.id);
    setRecord({ models: mPData, product: data });
  }, [data]);

  const onSubmit = async (values) => {
    const { models } = values;
    const { id: productId } = data;
    if(arrayEmpty(models)) {
      return;
    }
    for(let model of models) {
      model.productId = productId;
    }
    const { message: MSG } = await RequestUtils.Post("/product-material/save/" + productId, models);
    message.info(MSG);
  }

  return <>
    <RestEditModal
      isMergeRecordOnSubmit={false}
      updateRecord={(values) => setRecord(curvals => ({ ...curvals, ...values }))}
      onSubmit={onSubmit}
      record={record}
      closeModal={closeModal}
    >
      <Typography.Title level={5}>
        <SwitcherOutlined />
        <span style={{ marginLeft: 20 }}>Cấu hình BOM cho {data.name}</span>
      </Typography.Title>
      <FormListAddition
        name="models"
        textAddNew="Thêm vật liệu mới"
      >
        <FormOpenBom />
      </FormListAddition>
      <div style={{width: '100%'}}>
        <CustomButton htmlType="submit" />
      </div>
    </RestEditModal>
  </>
}

const FormOpenBom = ({ field }) => {

  const [ material, setMaterial ] = useState({})
  const { form, record } = useContext(FormContextCustom);

  const { name } = field || { name: 0 };
  const onChangeSelectMaterial = (value, item) => {
    let price = undefined;
    if(item.unitType !== 'DIMENSION') {
      price = item.pricePerUnit
    }
    form.setFieldsValue({
      models: {[name]: { materialUnit: item.unitType, price }}
    });
    setMaterial(item);
  }

  const materialId = Form.useWatch(["models", name, "materialId"], form);
  useEffectAsync(async () => {
    if(materialId) {
      const { data } = await RequestUtils.Get("/material/find-id", {id: materialId});
      setMaterial(data);
    }
  }, [materialId]);

  return (
    <Row gutter={16}>
      <Col md={24} xs={24}>
        <FormHidden name="materialUnit" />
      </Col>
      <Col md={12} xs={24}>
        <FormSelectInfiniteMaterial 
          required
          name={[name, 'materialId']}
          placeholder="Chọn vật liệu"
          label="Vật liệu"
          onChangeGetSelectedItem={onChangeSelectMaterial}
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput 
          required
          name={[name, 'quantity']}
          placeholder="Số lượng"
          label="Số lượng"
        />
      </Col>
      <Col md={24} xs={24}>
        <FormSelect 
          required
          name={[name, 'skuId']}
          label='Sku'
          placeholder='Chọn loại SKu'
          resourceData={record?.product?.skus ?? []}
        />
      </Col>
      <Col md={24} xs={24}>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, curValues) =>
            prevValues.models[name]?.materialUnit !== curValues.models[name]?.materialUnit
          }
        >
          {({ getFieldValue }) => {
            let models = getFieldValue('models');
            const materialUnit = models[name]?.materialUnit ?? '';
            return <FormDimension 
              name={name} 
              materialUnit={materialUnit}
              material={material}
            />
          }}
        </Form.Item>
      </Col>
      <Col md={12} xs={24}>
        <FormInputNumber 
          step={0.01}
          required
          name={[name, 'price']}
          placeholder="Đơn giá định mức"
        />
      </Col>
      <Col md={12} xs={24}>
        { material?.pricePerUnit &&
          <Typography.Title level={5}>
            Đơn giá cấu hình: {formatMoney(material.pricePerUnit)} / {material.unit}
          </Typography.Title>
        }
      </Col>
    </Row>
  )
};

const FormDimension = ({ name, materialUnit, material }) => {

  const { form } = useContext(FormContextCustom);
  const getDimensions = () => {
    const width = form.getFieldValue(['models', name, 'width']);
    const height = form.getFieldValue(['models', name, 'height']);
    return { width, height };
  };

  const handleInputChange = () => {
    const { width, height } = getDimensions();
    if(width && height && material.pricePerUnit) {
      const price = ((width / 100) * (height / 100) * material.pricePerUnit).toFixed(2);
      form.setFieldsValue({ models: {[name]: { price }}});
    }
  };

  return materialUnit === "DIMENSION" ? (
    <Row gutter={16}>
      <Col md={12} xs={24}>
        <FormInputNumber 
          required
          onChange={handleInputChange}
          name={[name, 'width']}
          placeholder="Chiều rộng (nếu có)"
          label="Chiều rộng (cm)"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInputNumber 
          required
          onChange={handleInputChange}
          name={[name, 'height']}
          placeholder="Chiều dài (nếu có)"
          label="Chiều dài (cm)"
        />
      </Col>
    </Row>
  ) : ("")
};

export default ProductBomContainer;
