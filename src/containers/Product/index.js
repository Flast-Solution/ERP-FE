/**************************************************************************/
/*  index.js                                                              */
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

import React, { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import RestEditModal from 'components/RestLayout/RestEditModal';
import { InAppEvent } from 'utils/FuseUtils';
import RequestUtils from 'utils/RequestUtils';
import { arrayEmpty, arrayNotEmpty, f5List } from 'utils/dataUtils';
import ProductForm from './ProductForm';
import ProductAttrService from 'services/ProductAttrService';
import { cloneDeep } from 'lodash';

/**
 * @param [ {id: 10384, attributedId: 10023, attributedValueId: 10085}, ... ] oldSku
 * @param [ [10023, 10085], ... ] newSku
 * @returns [ {id: 10384, attributedId: 10023, attributedValueId: 10085}, ... ]
*/
const GenerateSkuDetailsOnSubmit = (oldSku, newSku) => {
  let details = [];
  for (let sku of newSku) {
    const [ attributedId, attributedValueId ] = sku;
    let existSku = oldSku.find(
      (item) => item.attributedId === attributedId && item.attributedValueId === attributedValueId
    );
    details.push({ ...(existSku?.id ? { id: existSku.id } : {}), attributedId, attributedValueId });
  }
  return details;
}
const log = (value) => console.log('[container.product.index] ', value);

const Product = ({ closeModal, data }) => {

  const [ record, setRecord ] = useState({});
  useEffect(() => {
    log({ action: 'props', data });
    (async () => {
      let dRe = {}, skus = []
      if (arrayNotEmpty(data?.listProperties || [])) {
        let attrIds = data.listProperties.map(i => i.attributedId) ?? [];
        let attrValueIds = [];
        for (let values of data.listProperties.map(i => i.attributedValueId)) {
          attrValueIds = attrValueIds.concat(values);
        }
        const itemAttrs = await ProductAttrService.loadByIds(attrIds);
        const itemAttrValues = await ProductAttrService.loadValueByIds(attrValueIds);
        dRe.attrs = itemAttrs;
        dRe.attrValues = itemAttrValues;
      }
      for (const iSkus of ( data?.skus || [] )) {
        let item = { id: iSkus?.id, name: iSkus?.name, skuPrices: iSkus?.skuPrices || [] }
        let details = [];
        for (const detail of iSkus?.sku) {
          details.push([detail.attributedId, detail.attributedValueId]);
        }
        item.sku = details;
        skus.push(item);
      }
      setRecord({ ...data, skus, dRe });
    })();
    return () => ProductAttrService.empty();
  }, [ data ]);

  const onSubmit = useCallback(async (datas) => {
    log({ action: 'onSubmit', datas });
    let values = cloneDeep(datas);
    let skusAdd = [];
    for (let arrsku of values.skus) {
      /* oldSku = [ {id: 10384, attributedId: 10023, attributedValueId: 10085}, ... ] */
      const oldSku = data?.skus?.find(f => f?.id === arrsku?.id)?.sku ?? [];
      let newSku = GenerateSkuDetailsOnSubmit(oldSku, arrsku.sku);
      arrsku.sku = newSku;
      skusAdd.push(arrsku);
    }

    const newListProperties = values?.listProperties.map(item => ({
      attributedId: item?.attributedId,
      propertyValueId: item?.attributedValueId,
    })) || [];

    const body = {
      ...values,
      listProperties: newListProperties,
      skus: skusAdd
    }

    let params = (values?.id ?? '') === '' ? {} : { id: values.id };
    if (arrayEmpty(values.skus)) {
      message.info("Can't create Product with empty skus .!");
      return;
    }
    const { errorCode } = await RequestUtils.Post("/product/save", body, params);
    const isSuccess = errorCode === 200;
    if (isSuccess) {
      f5List('product/fetch');
    }
    InAppEvent.normalInfo(isSuccess ? "Cập nhật thành công" : "Lỗi cập nhật, vui lòng thử lại sau");
  }, [ data ]);

  return (
    <RestEditModal
      isMergeRecordOnSubmit={false}
      updateRecord={(values) => setRecord(curvals => ({ ...curvals, ...values }))}
      onSubmit={onSubmit}
      record={record}
      closeModal={closeModal}
    >
      <ProductForm />
    </RestEditModal>
  )
}

export default Product;