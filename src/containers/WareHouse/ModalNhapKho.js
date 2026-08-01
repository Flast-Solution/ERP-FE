/**************************************************************************/
/*  ModalNhapKho.js                                                       */
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
import { Col, Form, message, Row } from 'antd';
import {
  FormContextCustom,
  FormSelectInfiniteProduct,
  BtnSubmit,
  FormInput,
  FormSelect,
	FormInputNumber,
	FormSelectInfiniteProvider,
  FormInfiniteStock,
  FormHidden
} from "@flast-erp/core/components";

import WarehouseService from '@/services/WarehouseService';
import InStockTable from '@/containers/WareHouse/InStockTable'
import { ShowSkuDetail } from '@/containers/Product/SkuView';
import { isEmpty } from 'lodash';
import { RequestUtils, createMSkuDetails } from '@flast-erp/core/utils';
import { useEffectAsync } from '@flast-erp/core/hooks';

const ModalNhapKho = ({
  product,
  onSave,
  data,
  closeModal
}) => {

  const [ form ] = Form.useForm();
  const [ inStocks, setInStocks ] = useState([]);
  const [ skus, setSkus ] = useState([]);
  const [ record, setRecord ] = useState({});
  const [ mProduct, setProduct ] = useState(product || data?.product || {});
  const [ sku, setSkuDetail ] = useState();
  const handleSave = onSave || data?.onSave;

  useEffectAsync(async() => {
    if (!mProduct?.id) {
      return;
    }
    const { embedded } = await WarehouseService.fetch({ productId: mProduct.id });
    setInStocks(embedded);
  }, [mProduct]);

  const onFinish = useCallback(async (values) => {
    const mSkuDetails = createMSkuDetails(sku?.skuDetails ?? []);
    const { skuId } = values;

    const skuName = mProduct?.skus.find(sku => sku.id === skuId)?.name || '';
    let model = { ...values, skuName };
    const endpoint = model?.id ? ('/warehouse/updated?id=' + model.id) : '/warehouse/created';

    const { message: msg, data, errorCode } = await RequestUtils.Post(endpoint, { model, mSkuDetails });
    message.success(msg);
    handleSave?.({ data, errorCode });
    closeModal?.();
  }, [closeModal, handleSave, sku, mProduct]);

  const onChangeGetSelectedItem = (value, nProduct) => {
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
  }, [sku]);

  const updateRecord = useCallback((values) => {
    setRecord(pre => ({ ...pre, ...values }));
  }, []);

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <FormContextCustom.Provider value={{ form, record, updateRecord }}>
        <Row gutter={16}>
          <Col span={24}>
            <FormHidden name="id" />
          </Col>
          <Col md={12} xs={24}>
            <FormSelectInfiniteProduct
              label='Chọn sản phẩm'
              placeholder='Chọn sản phẩm'
              name='productId'
              required
              onChangeGetSelectedItem={onChangeGetSelectedItem}
            />
          </Col>
          <Col md={12} xs={24}>
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
          <Col md={12} xs={24}>
            <FormInputNumber
              label='Số lượng'
              name='quantity'
              required
              placeholder={'Nhập số lượng'}
              style={{ width: '100%' }}
              min={1}
              messageRequire='Số lượng không được để trống'
            />
          </Col>
          <Col md={12} xs={24}>
            <FormSelectInfiniteProvider
              label='Nhà cung cấp'
              name='providerId'
              placeholder='Chọn nhà cung cấp'
              required
              messageRequire='Nhà cung cấp không được để trống'
            />
          </Col>
          <Col md={12} xs={24}>
            <FormInput
              label='Mã đơn NCC'
              name='providerOrderCode'
              placeholder='Nhập mã đơn nhà cung cấp'
            />
          </Col>
          <Col md={12} xs={24}>
            <FormInfiniteStock
              label='Kho hàng'
              name='stockId'
              placeholder='Chọn kho hàng'
              required
              messageRequire='Kho hàng không được để trống'
            />
          </Col>
          {/* Lịch sử nhập kho */}
          <Col span={24}>
            <InStockTable
              data={inStocks}
              onChangeSelected={(item) => item}
            />
          </Col>
          <Col span={24}>
            <BtnSubmit marginTop={10} text='Hoàn thành' />
          </Col>
        </Row>
      </FormContextCustom.Provider>
    </Form>
  )
};

export default ModalNhapKho;
