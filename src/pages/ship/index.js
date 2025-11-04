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
import { Button } from 'antd';
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import RestList from 'components/RestLayout/RestList';
import ShipFilter from './Filter';
import useGetList from "hooks/useGetList";
import { arrayEmpty, dateFormatOnSubmit, formatTime } from 'utils/dataUtils';
import { InAppEvent } from 'utils/FuseUtils';
import { ShowSkuDetail } from 'containers/Product/SkuView';
import { HASH_MODAL } from 'configs/constant';
import RequestUtils from 'utils/RequestUtils';

const ShipPage = () => {

  const [title] = useState("Đã giao");
  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onClickGiaoHang = (record) => {
    if(!record.warehouseProduct) {
      InAppEvent.normalError("Giao hàng mà chưa có sản phẩm trong kho!");
      return;
    }
    InAppEvent.emit(HASH_MODAL, {
      hash: "#ship.update",
      title: 'Phiếu xuất kho #' + record.orderCode,
      data: record
    });
  };

  const onData = async (values) => {
    if (arrayEmpty(values.embedded)) {
      return values;
    }
    const listStatus = await RequestUtils.GetAsList("/shipping/fetch-status");
    for (let ship of values.embedded) {
      ship.statusName = listStatus.find(i => i.id === ship.status)?.name || '';
    }
    return values;
  }

  const CUSTOM_ACTION = [
    {
      title: 'Mã S.Phẩm',
      dataIndex: 'warehouseProduct',
      width: 120,
      ellipsis: true,
      render: (warehouse) => warehouse?.product?.code || '(Chưa có)'
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'warehouseProduct',
      width: 150,
      ellipsis: true,
      render: (warehouse) => warehouse?.product?.name || '(Chưa có)'
    },
    {
      title: 'Mã đơn',
      dataIndex: 'orderCode',
      width: 120,
      ellipsis: true
    },
    {
      title: 'Nhân viên',
      dataIndex: 'ssoId',
      width: 120,
      ellipsis: true
    },
    {
      title: 'Người nhận',
      dataIndex: 'receiverName',
      width: 150,
      ellipsis: true
    },
    {
      title: 'SĐT',
      dataIndex: 'receiverMobile',
      width: 120,
      ellipsis: true
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      width: 150,
      ellipsis: true
    },
    {
      title: 'Trạng thái',
      dataIndex: 'statusName',
      width: 150,
      ellipsis: true
    },
    {
      title: 'SKUS',
      dataIndex: 'warehouseProduct',
      width: 200,
      ellipsis: true,
      render: (warehouse) => <ShowSkuDetail skuInfo={warehouse?.skuDetails ?? []} width={250} />
    },
    {
      title: 'Kho',
      dataIndex: 'warehouseProduct',
      width: 150,
      render: (warehouse) => warehouse?.stockName || '',
      ellipsis: true
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      width: 80,
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
      width: 100,
      render: (record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => onClickGiaoHang(record)}
        >
          Cập nhật
        </Button>
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
        onData={onData}
        hasCreate={false}
        xScroll={1400}
        initialFilter={{ limit: 10, page: 1 }}
        filter={<ShipFilter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={'shipping/fetch'}
        columns={CUSTOM_ACTION}
      />
    </div>
  )
};

export default ShipPage;
