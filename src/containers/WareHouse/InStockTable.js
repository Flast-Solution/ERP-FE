/**************************************************************************/
/*  InStockTable.js                                                       */
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

import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import { arrayNotEmpty } from '@flast-erp/core/utils';
import { ShowSkuDetail } from '@/containers/Product/SkuView'

const InStockTable = ({
  data = [],
  onChangeSelected,
  showWhenEmpty = false,
  selectable = true,
  selectedRowKey: controlledSelectedRowKey
}) => {

  const [internalSelectedRowKey, setInternalSelectedRowKey] = useState(null);
  const selectedRowKey = controlledSelectedRowKey ?? internalSelectedRowKey;

  useEffect(() => {
    if (controlledSelectedRowKey === undefined && data.length > 0 && internalSelectedRowKey === null) {
      setInternalSelectedRowKey(data[0].id);
      onChangeSelected?.(data[0]);
    }
  }, [controlledSelectedRowKey, data, internalSelectedRowKey, onChangeSelected]);

  const onChangeSelectedRow = (key, item) => {
    setInternalSelectedRowKey(key);
    onChangeSelected?.(item);
  };

  const columns = [
    {
      title: "SKU",
      dataIndex: "skuName",
      key: "skuName",
      width: 130,
      ellipsis: true
    },
    {
      title: "Kho hàng",
      dataIndex: "stockName",
      key: "stockName",
      width: 150,
      ellipsis: true
    },
    {
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
      width: 80
    },
    {
      title: "Chi tiết",
      dataIndex: "skuDetails",
      width: 350,
      ellipsis: true,
      render: (skuDetails) => <ShowSkuDetail skuDetails={skuDetails} />
    },
    ...(selectable ? [{
      title: "Chọn",
      width: 80,
      fixed: 'right',
      dataIndex: "action",
      render: (_, record) => (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="radio"
            checked={selectedRowKey === record.id}
            onChange={() => onChangeSelectedRow(record.id, record)}
          />
        </div>
      )
    }] : [])
  ];

  const onRow = (record) => {
    return {
      onClick: selectable ? () => {
        onChangeSelectedRow(record.id, record);
      } : undefined
    }
  };

  return showWhenEmpty || arrayNotEmpty(data) ? (
    <Table
      bordered
      scroll={{ x: 750 }}
      rowKey="id"
      columns={columns}
      dataSource={data}
      pagination={data.length > 10}
      onRow={onRow}
      style={{ cursor: selectable ? "pointer" : "default", marginBottom: 20 }}
    />
  ) : null;
};

export default InStockTable;
