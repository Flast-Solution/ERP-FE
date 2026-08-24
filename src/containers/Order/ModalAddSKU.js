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

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Button, Col, Form, Row, Space, Tag, Typography, message } from 'antd';

import {
  FormSelectInfiniteProduct,
  FormSelect,
  FormInputNumber,
  BtnSubmit,
  FormAutoComplete,
  FormTextArea
} from '@flast-erp/core/components';

import _, { isEmpty } from 'lodash';
import InStockTable from '@/containers/WareHouse/InStockTable'
import OrderService from '@/services/OrderService';
import { useEffectAsync } from '@flast-erp/core/hooks';
import { ShowSkuDetail } from '@/containers/Product/SkuView';
import { 
  arrayNotEmpty, 
  RequestUtils, 
  createMSkuDetails 
} from '@flast-erp/core/utils';

const AddSKU = ({ onSave, productId, leadProducts = [], closeModal }) => {

  const [ form ] = Form.useForm();
  const [ inStocks, setInStocks ] = useState([]);
  const [ skus, setSkus ] = useState([]);
  const [ mProduct, setProduct ] = useState({});
  const [ sku, setSkuDetail ] = useState([]);
  const [ selectedProductId, setSelectedProductId ] = useState(productId ?? leadProducts[0]?.id);
  const [ configuredProductIds, setConfiguredProductIds ] = useState([]);
  const selectedProductIdRef = useRef(productId ?? leadProducts[0]?.id);
  const skuRef = useRef([]);
  const productRef = useRef({});
  const productDraftsRef = useRef({});

  const suggestedProducts = useMemo(
    () => (Array.isArray(leadProducts) ? leadProducts : [])
      .filter(item => item?.id != null),
    [leadProducts],
  );

  const saveCurrentProductDraft = useCallback(() => {
    const currentProductId = selectedProductIdRef.current;
    if (currentProductId == null) {
      return;
    }
    productDraftsRef.current[String(currentProductId)] = {
      values: {
        ...form.getFieldsValue(),
        productId: currentProductId,
      },
      sku: skuRef.current,
      product: productRef.current,
    };
    const values = productDraftsRef.current[String(currentProductId)].values;
    setConfiguredProductIds(current => (
      values?.skuId != null && Number(values?.quantity) > 0
        ? Array.from(new Set([...current, currentProductId]))
        : current.filter(id => String(id) !== String(currentProductId))
    ));
  }, [form]);

  const onChangeSelectedProductItem = useCallback((value, item, preserveCurrent = true) => {
    if (preserveCurrent && String(selectedProductIdRef.current) !== String(value)) {
      saveCurrentProductDraft();
    }
    selectedProductIdRef.current = value;
    setSelectedProductId(value);
    const nextProduct = _.cloneDeep(item);
    const { warehouses } = nextProduct;
    if (arrayNotEmpty(warehouses)) {
      setInStocks(warehouses);
    } else {
      setInStocks([]);
    }
    setSkus(nextProduct?.skus || []);
    setProduct(nextProduct);
    productRef.current = nextProduct;
    const draft = productDraftsRef.current[String(value)];
    if (draft) {
      form.setFieldsValue(draft.values);
      const restoredSku = (nextProduct?.skus || []).find(
        itemSku => String(itemSku?.id) === String(draft.values?.skuId),
      ) || draft.sku || [];
      skuRef.current = restoredSku;
      setSkuDetail(restoredSku);
    } else {
      form.resetFields(['skuId', 'quantity', 'orderName', 'note']);
      form.setFieldValue('productId', value);
      form.setFieldValue('quantity', 1);
      skuRef.current = [];
      setSkuDetail([]);
    }
  }, [form, saveCurrentProductDraft]);

  const loadProduct = useCallback(async (nextProductId, preserveCurrent = true) => {
    if (!nextProductId) {
      return;
    }
    const { data, errorCode } = await RequestUtils.Get('/product/find-by-id', { id: nextProductId });
    if (errorCode === 200) {
      onChangeSelectedProductItem(nextProductId, data, preserveCurrent);
    }
  }, [onChangeSelectedProductItem]);

  useEffectAsync(async () => {
    const initialProductId = productId ?? suggestedProducts[0]?.id;
    if (!initialProductId) {
      return;
    }
    await loadProduct(initialProductId);
  }, [productId, suggestedProducts, loadProduct]);

  const onFinish = useCallback((values) => {
    const currentProductId = values.productId;
    const currentDraft = {
      values,
      sku: skuRef.current,
      product: productRef.current || mProduct,
    };
    productDraftsRef.current[String(currentProductId)] = currentDraft;

    const requiredProductIds = suggestedProducts.length > 0
      ? suggestedProducts.map(item => item.id)
      : [currentProductId];
    const missingProductId = requiredProductIds.find(itemId => {
      const draft = productDraftsRef.current[String(itemId)];
      return !draft?.values?.skuId || Number(draft?.values?.quantity) <= 0;
    });

    if (missingProductId != null) {
      const missingProduct = suggestedProducts.find(
        item => String(item.id) === String(missingProductId),
      );
      message.warning(`Vui lòng cấu hình SKU và số lượng cho ${missingProduct?.name || 'sản phẩm còn thiếu'}.`);
      loadProduct(missingProductId, false);
      return;
    }

    requiredProductIds.forEach(itemId => {
      const draft = productDraftsRef.current[String(itemId)];
      onSave({
        ...draft.values,
        status: draft.values?.status ?? 0,
        mProduct: draft.product,
        mSkuDetails: createMSkuDetails(draft.sku?.skuDetails ?? []),
      });
    });
    message.success(`Đã thêm ${requiredProductIds.length} sản phẩm vào cơ hội bán hàng.`);
    if (typeof closeModal === 'function') {
      closeModal();
    }
  }, [
    closeModal,
    loadProduct,
    mProduct,
    onSave,
    suggestedProducts,
  ]);

  const onChangeGetSelectedSku = (value, item) => {
    skuRef.current = item;
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
      {suggestedProducts.length > 0 && (
        <div
          style={{
            padding: 16,
            marginBottom: 20,
            border: '1px solid #e6eaf0',
            borderRadius: 8,
            background: '#f8fafc',
          }}
        >
          <Typography.Text strong>
            Sản phẩm từ Lead ({suggestedProducts.length})
          </Typography.Text>
          <Typography.Paragraph type="secondary" style={{ margin: '4px 0 12px' }}>
            Chọn từng sản phẩm để cấu hình SKU và số lượng cho cơ hội bán hàng.
          </Typography.Paragraph>
          <Space size={[8, 8]} wrap>
            {suggestedProducts.map(item => {
              const isSelected = String(selectedProductId) === String(item.id);
              const isConfigured = configuredProductIds.some(id => String(id) === String(item.id));
              return (
                <Button
                  key={item.id}
                  type={isSelected ? 'primary' : 'default'}
                  onClick={() => loadProduct(item.id)}
                >
                  {item.name}
                  {isConfigured && <Tag color="success" style={{ marginLeft: 8, marginRight: 0 }}>Đã cấu hình</Tag>}
                </Button>
              );
            })}
          </Space>
        </div>
      )}
      <Row gutter={16}>
        <Col span={12}>
          <FormSelectInfiniteProduct
            label='Chọn sản phẩm'
            placeholder='Chọn sản phẩm'
            name='productId'
            customValue={selectedProductId}
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
          <BtnSubmit
            marginTop={0}
            text={suggestedProducts.length > 1
              ? `Hoàn thành ${suggestedProducts.length} sản phẩm`
              : 'Hoàn thành'}
          />
        </Col>
      </Row>
    </Form>
  )
};

export default AddSKU;
