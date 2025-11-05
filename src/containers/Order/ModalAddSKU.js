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
import _, { isEmpty } from 'lodash';
import { arrayNotEmpty } from 'utils/dataUtils';
import InStockTable from 'containers/WareHouse/InStockTable'
import FormAutoComplete from 'components/form/FormAutoComplete';
import OrderService from 'services/OrderService';
import FormTextArea from 'components/form/FormTextArea';
import { useEffectAsync } from 'hooks/MyHooks';
import RequestUtils from 'utils/RequestUtils';
import { ShowSkuDetail } from 'containers/Product/SkuView';
import { createMSkuDetails } from 'utils/skuUtils';

const AddSKU = ({ onSave, productId }) => {

  const [ form ] = Form.useForm();
  const [ inStocks, setInStocks ] = useState([]);
  const [ skus, setSkus ] = useState([]);
  const [ mProduct, setProduct ] = useState({});
  const [ sku, setSkuDetail ] = useState([]);

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
    const mSkuDetails = createMSkuDetails(sku?.skuDetails ?? []);
    onSave({ ...values, mProduct, mSkuDetails });
  }, [ onSave, sku, mProduct ]);

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
    form.resetFields(['skuId']);
  };

  const onChangeGetSelectedSku = (value, item) => {
    setSkuDetail(item);
  };

  const memoSkuDetail = React.useMemo(() => {
    if(isEmpty(sku)) {
      return <span />;
    }
    const mSkuDetails = createMSkuDetails(sku.skuDetails ?? []);
    return <ShowSkuDetail skuDetails={mSkuDetails} />
  }, [ sku ]);

  const onSelectedStock = useCallback((item) => {
    console.log('Selected stock: ', item);
  }, []);

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
        <Col span={24} style={{marginBottom: 20}}>
          {memoSkuDetail}
        </Col>
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