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
import { Button, Tooltip } from 'antd';
import { RestList, BreadcrumbCustom } from '@flast-erp/core/components';
import ShipFilter from './Filter';
import { useGetList } from "@flast-erp/core/hooks";
import { arrayEmpty, dateFormatOnSubmit, formatTime } from '@flast-erp/core/utils';
import { RequestUtils, InAppEvent } from '@flast-erp/core/utils';
import { HASH_MODAL } from '@/configs/constant';
import useGetMe from '@/hooks/useGetMe';

const getLots = record => Array.isArray(record?.lots) ? record.lots : [];
const getTotalQuantity = record => getLots(record).reduce(
  (total, lot) => total + Number(lot?.quantity ?? 0),
  0
);
const getStockNames = record => Array.from(new Set(
  getLots(record).map(lot => lot?.stockName).filter(Boolean)
)).join(', ');
const getProductSkuLabel = record => [
  record?.productId ? `SP #${record.productId}` : null,
  record?.skuId ? `SKU #${record.skuId}` : null
].filter(Boolean).join(' · ') || '—';
const renderTooltip = value => (
  <Tooltip title={value || '—'}>
    <span>{value || '—'}</span>
  </Tooltip>
);
const getDeliveryMode = delivery => {
  if (delivery?.mode === 'self') return 'Tự giao';
  if (delivery?.mode === 'carrier') return delivery?.carrier || 'Đơn vị vận chuyển';
  return '—';
};

const ShipPage = () => {

  const [title] = useState("Đã giao");
  const { hasPermission } = useGetMe();
  const canUpdate = hasPermission('shipping.delivery.update');
  const canPrint = hasPermission('shipping.delivery.print');
  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onClickGiaoHang = (record) => {
    InAppEvent.emit(HASH_MODAL, {
      hash: "#ship.update",
      title: 'Chi tiết phiếu xuất kho #' + (record.deliveryCode || record.orderCode),
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
    ...(canUpdate || canPrint ? [{
      title: 'Mã phiếu xuất',
      dataIndex: 'deliveryCode',
      width: 180,
      ellipsis: true,
      render: renderTooltip
    },
    {
      title: 'Mã đơn',
      dataIndex: 'orderCode',
      width: 140,
      ellipsis: true
    },
    {
      title: 'Mã đơn con',
      dataIndex: 'detailCode',
      width: 140,
      render: (_, record) => record?.detailCode || record?.orderDetailId || '—',
      ellipsis: true
    },
    {
      title: 'Sản phẩm / SKU',
      width: 150,
      render: (_, record) => renderTooltip(getProductSkuLabel(record)),
      ellipsis: true,
    },
    {
      title: 'Người nhận',
      width: 150,
      render: (_, record) => record?.delivery?.recipientName || '—',
      ellipsis: true
    },
    {
      title: 'SĐT',
      width: 120,
      render: (_, record) => record?.delivery?.recipientPhone || '—',
      ellipsis: true
    },
    {
      title: 'Địa chỉ',
      width: 200,
      render: (_, record) => renderTooltip(record?.delivery?.address),
      ellipsis: true
    },
    {
      title: 'Hình thức giao',
      width: 150,
      render: (_, record) => getDeliveryMode(record?.delivery),
      ellipsis: true
    },
    {
      title: 'Kho',
      width: 150,
      render: (_, record) => getStockNames(record) || '—',
      ellipsis: true
    },
    {
      title: 'Số lượng',
      width: 100,
      render: (_, record) => getTotalQuantity(record).toLocaleString('vi-VN'),
      ellipsis: true
    },
    {
      title: 'Ngày xuất',
      dataIndex: 'outboundDate',
      width: 150,
      ellipsis: true,
      render: (outboundDate) => formatTime(outboundDate)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'statusName',
      width: 130,
      render: (statusName, record) => statusName || record?.status,
      ellipsis: true
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
          Chi tiết
        </Button>
      )
    }] : [])
  ];

  return (
    <div>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <BreadcrumbCustom
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
