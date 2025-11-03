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

import React, { useState, useCallback, useEffect } from 'react';
import { Col, Form, message, Row } from 'antd';
import { FormContextCustom } from 'components/context/FormContextCustom';
import FormSelectInfiniteProduct from 'components/form/SelectInfinite/FormSelectInfiniteProduct';
import FormSelect from 'components/form/FormSelect';
import FormInputNumber from 'components/form/FormInputNumber';
import BtnSubmit from 'components/CustomButton/BtnSubmit';
import FormSelectInfiniteProvider from 'components/form/SelectInfinite/FormSelectInfiniteProvider';
import FormInfiniteStock from 'components/form/SelectInfinite/FormInfiniteStock';
import FormHidden from 'components/form/FormHidden';
import RequestUtils from 'utils/RequestUtils';
import WarehouseService from 'services/WarehouseService';
import { arrayEmpty } from 'utils/dataUtils';
import InStockTable from 'containers/WareHouse/InStockTable'

const SKU_DETAIL_ID_PREFIX = 'skuDetailId_';
const ModalNhapKho = ({
  product,
  onSave = (values) => values
}) => {

  const [form] = Form.useForm();

  const [inStocks, setInStocks] = useState([]);
  const [skus, setSkus] = useState([]);
  const [record, setRecord] = useState({});
  const [mProduct, setProduct] = useState(product || {});
  const [skuDetail, setSkuDetail] = useState([]);

  useEffect(() => {
    (async () => {
      if (!mProduct?.id) {
        return;
      }
      const { embedded } = await WarehouseService.fetch({ productId: mProduct.id });
      setInStocks(embedded);
    })();
  }, [mProduct]);

  const onFinish = useCallback(async (values) => {

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

    const { skuId } = mValues;
    const skuName = mProduct?.skus.find(sku => sku.id === skuId)?.name || '';
    let model = {
      ...mValues,
      skuName
    };

    const endpoint = model?.id ? ('/warehouse/updated?id=' + model.id) : '/warehouse/created';
    const { message: msg, data, errorCode } = await RequestUtils.Post(endpoint, { model, mSkuDetails });
    message.success(msg);
    onSave({ data, errorCode });
  }, [onSave, skuDetail, mProduct]);

  const onChangeGetSelectedItem = (value, nProduct) => {
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

  const onChangeSelected = (item) => {
    const { skuInfo, ...params } = item;
    form.setFieldsValue(params);

    /* Cập nhật để trong các form Infinite fetch item mặc định */
    setRecord(params);

    /* Lấy SKU trong sản phẩm để lọc detail */
    const { skus } = mProduct;
    setSkuDetail(skus?.find(i => i.id === item.skuId)?.skuDetails ?? []);

    /* Fill vào form */
    if (arrayEmpty(skuInfo)) {
      return;
    }
    for (let sku of skuInfo) {
      let key = `${SKU_DETAIL_ID_PREFIX}${sku.text}`
      form.setFieldsValue({ [key]: sku?.values?.map(i => i.id) ?? [] });
    }
  };

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
          <Col span={12}>
            <FormSelectInfiniteProduct
              label='Chọn sản phẩm'
              placeholder='Chọn sản phẩm'
              name='productId'
              required
              onChangeGetSelectedItem={onChangeGetSelectedItem}
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
          <Col span={12}>
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
          <Col span={12}>
            <FormSelectInfiniteProvider
              label='Nhà cung cấp'
              name='providerId'
              placeholder='Chọn nhà cung cấp'
              required
              messageRequire='Nhà cung cấp không được để trống'
            />
          </Col>
          <Col span={24}>
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
              onChangeSelected={onChangeSelected}
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