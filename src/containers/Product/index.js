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
import { RestEditModal } from "@flast-erp/core/components";

import { RequestUtils, InAppEvent } from '@flast-erp/core/utils';
import { arrayEmpty, arrayNotEmpty, f5List } from '@flast-erp/core/utils';
import ProductForm from './ProductForm';
import ProductAttrService from '@/services/ProductAttrService';
import { cloneDeep } from 'lodash';
import {
  serializeProductAssets,
  splitProductAssets,
} from './productImages';

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
      const sourceSkus = Array.isArray(data?.skus) ? data.skus : [];
      for (const iSkus of sourceSkus) {
        let item = { id: iSkus?.id, name: iSkus?.name, note: iSkus?.note, skuPrices: iSkus?.skuPrices || [] }
        let details = [];
        const skuDetails = Array.isArray(iSkus?.sku) ? iSkus.sku : [];
        for (const detail of skuDetails) {
          details.push([detail.attributedId, detail.attributedValueId]);
        }
        item.sku = details;
        skus.push(item);
      }
      const isCreate = !data?.id;
      const productAssets = isCreate
        ? { images: [], files: [] }
        : splitProductAssets(data);
      setRecord({
        ...data,
        image: productAssets.images,
        file: productAssets.files,
        listProperties: Array.isArray(data?.listProperties) ? data.listProperties : [],
        skus,
        dRe
      });
    })();
    return () => ProductAttrService.empty();
  }, [ data ]);

  const onSubmit = useCallback(async (datas) => {
    log({ action: 'onSubmit', datas });
    let values = cloneDeep(datas);
    let skusAdd = [];
    const submittedSkus = Array.isArray(values.skus) ? values.skus : [];
    const originalSkus = Array.isArray(data?.skus) ? data.skus : [];
    for (let arrsku of submittedSkus) {
      /* oldSku = [ {id: 10384, attributedId: 10023, attributedValueId: 10085}, ... ] */
      const originalSkuDetails = originalSkus.find(f => f?.id === arrsku?.id)?.sku;
      const oldSku = Array.isArray(originalSkuDetails) ? originalSkuDetails : [];
      const submittedSkuDetails = Array.isArray(arrsku.sku) ? arrsku.sku : [];
      let newSku = GenerateSkuDetailsOnSubmit(oldSku, submittedSkuDetails);
      arrsku.sku = newSku;
      skusAdd.push(arrsku);
    }

    const submittedProperties = Array.isArray(values.listProperties)
      ? values.listProperties
      : [];
    const newListProperties = submittedProperties.map(item => ({
      attributedId: item?.attributedId,
      propertyValueId: item?.attributedValueId,
    }));

    const {
      images: legacyImages,
      image,
      files: legacyFiles,
      attachments: legacyAttachments,
      file,
      ...productValues
    } = values;
    const body = {
      ...productValues,
      image: serializeProductAssets({
        images: image ?? legacyImages,
        files: file ?? legacyFiles ?? legacyAttachments,
      }),
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
      f5List('/product/fetch');
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
