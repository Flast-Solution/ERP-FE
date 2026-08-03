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

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, Col, Form, message, Row } from 'antd';
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

const getFormValues = (model = {}) => ({
  id: model?.id ?? null,
  productId: model?.productId ?? model?.product?.id ?? null,
  skuId: model?.skuId ?? model?.sku?.id ?? model?.skuDetailCode ?? null,
  quantity: model?.quantity ?? null,
  providerId: model?.providerId ?? model?.provider?.id ?? null,
  providerOrderCode: model?.providerOrderCode ?? null,
  stockId: model?.stockId ?? model?.warehouseId ?? model?.stock?.id ?? null
});

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
  const model = useMemo(() => data?.model ?? data?.record ?? {}, [data]);
  const mode = data?.mode ?? 'create';
  const readOnly = mode === 'view';
  const isEdit = mode === 'edit' || Boolean(model?.id);
  const [ mProduct, setProduct ] = useState(product || data?.product || model?.product || {});
  const [ sku, setSkuDetail ] = useState();
  const handleSave = onSave || data?.onSave;

  useEffect(() => {
    const values = getFormValues(model);
    form.setFieldsValue(values);
    setRecord(model);
  }, [form, model]);

  useEffectAsync(async () => {
    const productId = model?.productId ?? model?.product?.id ?? product?.id;
    if (!productId) {
      return;
    }

    let selectedProduct = product || model?.product;
    if (!Array.isArray(selectedProduct?.skus) || selectedProduct.skus.length === 0) {
      const response = await RequestUtils.Get('/product/find-by-id', { id: productId });
      if (response?.errorCode === 200) {
        selectedProduct = response.data;
      }
    }

    if (!selectedProduct) {
      return;
    }

    const selectedSkuId = model?.skuId ?? model?.sku?.id ?? model?.skuDetailCode;
    const productSkus = Array.isArray(selectedProduct?.skus) ? selectedProduct.skus : [];
    setProduct(selectedProduct);
    setSkus(productSkus);
    setSkuDetail(productSkus.find(item => String(item?.id) === String(selectedSkuId)));
  }, [model, product]);

  useEffectAsync(async() => {
    if (!mProduct?.id) {
      return;
    }
    const { embedded } = await WarehouseService.fetch({ productId: mProduct.id });
    setInStocks(embedded);
  }, [mProduct]);

  const onFinish = useCallback(async (values) => {
    const mSkuDetails = sku
      ? createMSkuDetails(sku?.skuDetails ?? [])
      : (model?.mSkuDetails ?? model?.skuDetails ?? []);
    const { skuId } = values;

    const skuName = mProduct?.skus?.find(item => String(item?.id) === String(skuId))?.name
      || model?.skuName
      || '';
    const submitModel = {
      ...values,
      ...(isEdit ? { id: model.id } : {}),
      skuName
    };
    const endpoint = isEdit ? '/warehouse/updated' : '/warehouse/created';

    const { message: msg, data: responseData, errorCode } = await RequestUtils.Post(
      endpoint,
      { model: submitModel, mSkuDetails }
    );
    if (errorCode !== 200) {
      message.error(msg);
      return;
    }
    message.success(msg);
    handleSave?.({ data: responseData, errorCode });
    closeModal?.();
  }, [closeModal, handleSave, isEdit, model, sku, mProduct]);

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
    <Form form={form} layout="vertical" onFinish={onFinish} disabled={readOnly}>
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
            {readOnly ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <Button disabled={false} onClick={() => closeModal?.()}>Đóng</Button>
              </div>
            ) : (
              <BtnSubmit marginTop={10} text={isEdit ? 'Cập nhật' : 'Hoàn thành'} />
            )}
          </Col>
        </Row>
      </FormContextCustom.Provider>
    </Form>
  )
};

export default ModalNhapKho;
