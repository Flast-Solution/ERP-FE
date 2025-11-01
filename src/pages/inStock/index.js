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
import { Helmet } from 'react-helmet';
import { Button, Popconfirm, Form, message } from 'antd';
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import RestList from 'components/RestLayout/RestList';
import WarehouseFilter from './Filter';
import useGetList from "hooks/useGetList";
import { dateFormatOnSubmit, f5List, formatTime } from 'utils/dataUtils';
import { InAppEvent } from 'utils/FuseUtils';
import { ShowSkuDetail } from 'containers/Product/SkuView';
import { HASH_POPUP, HASH_MODAL } from 'configs/constant';
import FormInfiniteStock from 'components/form/SelectInfinite/FormInfiniteStock';
import FormInputNumber from 'components/form/FormInputNumber';
import RequestUtils from 'utils/RequestUtils';

const ListInStock = () => {

  const [title] = useState("Trong kho");
  const [form] = Form.useForm();

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onCreateImportProduct = useCallback(() => {
    const onAfterSubmit = (values) => {
      f5List("warehouse/fetch");
    };
    InAppEvent.emit(HASH_POPUP, {
      hash: "stock.add",
      title: "Nhập kho",
      data: { onSave: onAfterSubmit }
    });
  }, []);

  const onCofirmExchange = (record) => form.validateFields().then(async (values) => {
    const body = { ...values, warehouseSourceId: record.id };
    const { message: MSG } = await RequestUtils.Post('/warehouse/exchange', body);
    message.success(MSG);
    f5List("warehouse/fetch");
  });

  const onClickGiaoHang = (record) => InAppEvent.emit(HASH_MODAL, {
    hash: "#warehouse.delivery",
    title: 'Giao hàng',
    data: { itemInStock: record }
  });

  const CUSTOM_ACTION = [
    {
      title: 'Mã S.Phẩm',
      dataIndex: 'product',
      width: 120,
      ellipsis: true,
      render: (product) => product.code
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'product',
      width: 150,
      ellipsis: true,
      render: (product) => product.name
    },
    {
      title: 'Nhân viên',
      dataIndex: 'userName',
      width: 120,
      ellipsis: true
    },
    {
      title: 'SKUS',
      dataIndex: 'skuDetails',
      width: 250,
      ellipsis: true,
      render: (skuDetails) => <ShowSkuDetail skuInfo={skuDetails} width={250} />
    },
    {
      title: 'Kho',
      dataIndex: 'stockName',
      width: 120,
      ellipsis: true
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantity',
      width: 80,
      ellipsis: true
    },
    {
      title: 'Đã nhập',
      dataIndex: 'total',
      width: 80,
      ellipsis: true
    },
    {
      title: 'Nhà C.Cấp',
      dataIndex: 'providerName',
      width: 120,
      ellipsis: true
    },
    {
      title: 'Thời gian',
      dataIndex: 'inTime',
      width: 120,
      ellipsis: true,
      render: (inTime) => formatTime(inTime)
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (record) => (
        <span style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            size="small"
            onClick={() => onClickGiaoHang(record)}
          >
            Giao hàng
          </Button>
          <Popconfirm
            placement="topLeft"
            title="Chọn kho để chuyển"
            description={
              <PopconfirmCustom
                record={record}
                form={form}
              />
            }
            onConfirm={() => onCofirmExchange(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" style={{ color: "#fa8c16" }}>
              Chuyển kho
            </Button>
          </Popconfirm>
        </span>
      )
    }
  ];

  return (
    <div>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: 'Trang chủ' }, { title: title }]}
      />
      <RestList
        xScroll={1400}
        initialFilter={{ limit: 10, page: 1 }}
        filter={<WarehouseFilter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={'warehouse/fetch'}
        customClickCreate={onCreateImportProduct}
        columns={CUSTOM_ACTION}
      />
    </div>
  )
};

const PopconfirmCustom = ({ form }) => {
  return (
    <div style={{ width: 300, marginTop: 30 }}>
      <Form form={form} layout='vertical'>
        <FormInfiniteStock
          required
          placeholder="Chọn kho"
          label="Kho cần chuyển đến"
          name="warehouseTargetId"
        />
        <FormInputNumber
          style={{ width: '100%' }}
          name="quantity"
          label="Số lượng"
          placeholder="Nhập số lượng"
          required
          min={1}
          initialValue={1}
        />
      </Form>
    </div>
  )
};

export default ListInStock;
