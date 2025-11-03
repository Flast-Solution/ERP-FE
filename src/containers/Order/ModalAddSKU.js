/**************************************************************************/
/*  ModalAddSKU.js                                                        */
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

import React, { useState, useCallback } from 'react';
import { Col, Form, Row } from 'antd';
import FormSelectInfiniteProduct from 'components/form/SelectInfinite/FormSelectInfiniteProduct';
import FormSelect from 'components/form/FormSelect';
import FormInputNumber from 'components/form/FormInputNumber';
import BtnSubmit from 'components/CustomButton/BtnSubmit';
import _ from 'lodash';
import { arrayEmpty, arrayNotEmpty } from 'utils/dataUtils';
import InStockTable from 'containers/WareHouse/InStockTable'
import FormAutoComplete from 'components/form/FormAutoComplete';
import OrderService from 'services/OrderService';
import FormTextArea from 'components/form/FormTextArea';
import { useEffectAsync } from 'hooks/MyHooks';
import RequestUtils from 'utils/RequestUtils';

const SKU_DETAIL_ID_PREFIX = 'skuDetailId_';
const AddSKU = ({ onSave, productId }) => {

  const [ form ] = Form.useForm();
  const [ inStocks, setInStocks ] = useState([]);
  const [ skus, setSkus ] = useState([]);
  const [ mProduct, setProduct ] = useState({});
  const [ skuDetail, setSkuDetail ] = useState([]);

  useEffectAsync(async () => {
    if (!productId) {
      return;
    }
    form.setFieldValue("productId", productId);
    const { data, errorCode } = await RequestUtils.Get("/product/find-by-id", { id: productId });
    if (errorCode === 200) {
      onChangeSelectedProductItem(errorCode, data);
    }
  }, [productId, form]);

  const onFinish = useCallback((values) => {

    const genDetail = (datas) => datas.map((id) => ({
      id,
      text: skuDetail.find(detail => detail.id === id)?.value || ''
    }));

    const mSkuDetails = Object.entries(values).filter(([key]) => key.startsWith(SKU_DETAIL_ID_PREFIX))
      .map(([key, values]) => {
        const text = key.replace(SKU_DETAIL_ID_PREFIX, '');
        return { text, values: genDetail(values) };
      });

    let mValues = Object.fromEntries(
      Object.entries(values).filter(([key]) => !key.startsWith(SKU_DETAIL_ID_PREFIX))
    );

    onSave({ ...mValues, mProduct, mSkuDetails });
  }, [onSave, skuDetail, mProduct]);

  const onChangeSelectedProductItem = (value, item) => {
    let nProduct = _.cloneDeep(item);
    let { warehouses } = nProduct;
    if (arrayNotEmpty(warehouses)) {
      setInStocks(warehouses);
    } else {
      setInStocks([]);
    }
    setSkus(nProduct?.skus || []);
    setProduct(nProduct);
    form.setFieldsValue({ skuId: undefined });
  };

  const onChangeGetSelectedSku = (value, item) => {
    setSkuDetail(item?.skuDetails || []);
    const values = form.getFieldsValue();
    for (const key in values) {
      if (key.startsWith(SKU_DETAIL_ID_PREFIX)) {
        form.setFieldsValue({ [key]: undefined });
      }
    }
  };

  const memoSkuDetail = React.useMemo(() => {
    const groupedData = skuDetail.reduce((oKey, item) => {
      if (!oKey[item.name]) {
        oKey[item.name] = [];
      }
      oKey[item.name].push(item);
      return oKey;
    }, {});
    const numberOfKeys = Object.keys(groupedData).length;
    return Object.keys(groupedData).map((groupName) => (
      <Col key={groupName} span={numberOfKeys <= 1 ? 24 : 12}>
        <FormSelect
          mode='multiple'
          name={`${SKU_DETAIL_ID_PREFIX}${groupName}`}
          valueProp='id'
          titleProp='value'
          label={`Chọn ${groupName}`}
          placeholder={`Chọn ${groupName}`}
          resourceData={groupedData[groupName]}
          required
        />
      </Col>
    ))
  }, [skuDetail]);

  const onSelectedStock = useCallback((item) => {
    const { skuDetails, ...params } = item;
    form.setFieldsValue(params);

    /* Lấy SKU trong sản phẩm để lọc detail */
    const { skus } = mProduct;
    setSkuDetail(skus?.find(i => i.id === item.skuId)?.skuDetails ?? []);

    /* Fill vào form */
    if (arrayEmpty(skuDetails)) {
      return;
    }
    for (let sku of skuDetails) {
      let key = `${SKU_DETAIL_ID_PREFIX}${sku.text}`
      form.setFieldsValue({ [key]: sku?.values?.map(i => i.id) ?? [] });
    }
  }, [form, mProduct]);

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Row gutter={16}>
        <Col span={12}>
          <FormSelectInfiniteProduct
            label='Chọn sản phẩm'
            placeholder='Chọn sản phẩm'
            name='productId'
            customValue={productId}
            required
            onChangeGetSelectedItem={onChangeSelectedProductItem}
          />
        </Col>
        <Col span={12}>
          <FormSelect
            label='SKU'
            name='skuId'
            valueProp='id'
            titleProp='name'
            placeholder='Nhập tên SKU'
            required
            resourceData={skus}
            onChangeGetSelectedItem={onChangeGetSelectedSku}
          />
        </Col>
        {memoSkuDetail}
        <Col span={24}>
          <InStockTable
            data={inStocks}
            onChangeSelected={onSelectedStock}
          />
        </Col>
        <Col span={12}>
          <FormInputNumber
            label='Số lượng'
            name='quantity'
            required
            placeholder={'Nhập số lượng'}
            style={{ width: '100%' }}
            min={1}
            rules={[{ required: true, message: 'Số lượng là bắt buộc' }]}
          />
        </Col>
        <Col span={12}>
          <FormAutoComplete
            resourceData={OrderService.getListOrderName()}
            valueProp='name'
            titleProp='name'
            label='Tên đơn'
            name='orderName'
            placeholder={'Nhập tên đơn nếu có'}
          />
        </Col>
        <Col span={24}>
          <FormTextArea
            rows={3}
            label='Ghi chú (Nếu có)'
            placeholder='Ghi chú'
            name={"note"}
          />
        </Col>
        <Col span={24}>
          <BtnSubmit marginTop={0} text='Hoàn thành' />
        </Col>
      </Row>
    </Form>
  )
};

export default AddSKU;