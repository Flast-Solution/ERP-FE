/**************************************************************************/
/*  index.js                                                           		*/
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

import React, { useCallback, useState } from 'react';
import RestList from "components/RestLayout/RestList";
import useGetList from "hooks/useGetList";
import { Helmet } from "react-helmet";
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import Filter from './Filter';
import { Button, Image, Space } from 'antd';
import { InAppEvent } from "utils/FuseUtils";
import { GATEWAY, HASH_MODAL } from 'configs';
import { arrayEmpty, dateFormatOnSubmit, formatTime } from 'utils/dataUtils';
import ProductAttrService from 'services/ProductAttrService';
import { cloneDeep } from 'lodash';
import SkuView, { PriceView } from 'containers/Product/SkuView';
import { Link } from 'react-router-dom';

const Index = () => {

  const onEdit = (item) => {
    let title = 'Sửa sản phẩm # ' + item.id;
    let hash = '#draw/product.edit';
    let data = cloneDeep(item);
    let skus = [], listProperties = [];
    for (const property of item.listProperties) {
      let attr = listProperties.find(i => i.attributedId === property.attributedId);
      if (attr) {
        attr.attributedValueId.push(property.attributedValueId);
      } else {
        attr = { attributedId: property.attributedId, attributedValueId: [property.attributedValueId] }
        listProperties.push(attr);
      }
    }
    for (const iSkus of item.skus) {
      let item = { id: iSkus?.id, name: iSkus.name, listPriceRange: iSkus.listPriceRange }
      let details = [];
      for (const detail of iSkus.skuDetail) {
        details.push({ id: detail?.id, attributedId: detail.attributedId, attributedValueId: detail.attributedValueId });
      }
      item.sku = details;
      skus.push(item);
    }
    data.listProperties = listProperties;
    data.skus = skus;
    InAppEvent.emit(HASH_MODAL, { hash, title, data });
  }

  const onCreateProduct = () => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/product.edit',
    title: 'Tạo mới sản phẩm',
    data: {}
  });

  const onAddBom = (item) => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/product.bom',
    title: 'Cấu hình BOM (Bill of Materials) #' + item.id,
    data: cloneDeep(item)
  });

  const [ title ] = useState("Danh sách sản phẩm");
  const CUSTOM_ACTION = [
    {
      title: "Mã",
      dataIndex: 'code',
      width: 110,
      ellipsis: true
    },
    {
      title: "Hình ảnh",
      dataIndex: 'image',
      width: 150,
      ellipsis: true,
      render: (image) => (
        <Image
          preview={false}
          width={50}
          src={`${image ? `${GATEWAY}${image}` : '/img/image_not_found.png'}`}
          alt='image'
        />
      )
    },
    {
      title: "Sản phẩm",
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (record) => <Link to={`/product/edit/${record.id}`}>{record.name}</Link>
    },
    {
      title: "SKus",
      dataIndex: 'skus',
      width: 400,
      ellipsis: true,
      render: (skus) => <SkuView skus={skus} />
    },
    {
      title: "Giá bán",
      dataIndex: 'skus',
      width: 250,
      ellipsis: true,
      render: (skus) => <PriceView skus={skus} />
    },
    {
      title: "Created",
      dataIndex: 'createdTime',
      width: 120,
      ellipsis: true,
      render: (createdAt) => formatTime(createdAt)
    },
    {
      title: "Status",
      dataIndex: 'status',
      ellipsis: true,
      width: 120,
      render: (status) => (status || 0) === 0 ? 'Ngưng' : 'Kích hoạt'
    },
    {
      title: "",
      width: 140,
      fixed: 'right',
      render: (record) => (
        <Space gap={8}>
          <Button color="danger" variant="dashed" onClick={() => onEdit(record)} size='small'>Detail</Button>
          <Button onClick={() => onAddBom(record)} size='small'>Bom</Button>
        </Space>
      )
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onData = useCallback((values) => {
    if (arrayEmpty(values.embedded)) {
      return values;
    }
    let attrsId = [], attrsValuesId = [];
    for (let item of values.embedded) {
      attrsId = item.listProperties.map(i => i.attributedId).filter(i => i && i > 0);
      attrsValuesId = item.listProperties.map(i => i.attributedValueId).filter(i => i && i > 0);
    }
    ProductAttrService.loadByIds(attrsId);
    ProductAttrService.loadValueByIds(attrsValuesId);
    return values;
  }, []);

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: 'Trang chủ' }, { title: title }]}
      />
      <RestList
        xScroll={1200}
        onData={onData}
        initialFilter={{ limit: 10, page: 1 }}
        filter={<Filter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={'product/fetch'}
        customClickCreate={onCreateProduct}
        columns={CUSTOM_ACTION}
      />
    </>
  )
}

export default Index;