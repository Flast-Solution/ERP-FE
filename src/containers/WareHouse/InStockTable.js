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

import React, { useState } from 'react';
import { Table } from 'antd';
import { arrayNotEmpty } from 'utils/dataUtils';
import { ShowSkuDetail } from 'containers/Product/SkuView'

const InStockTable = ({ data, onChangeSelected }) => {

  const [selectedRowKey, setSelectedRowKey] = useState(null);
  const onChangeSelectedRow = (key, item) => {
    setSelectedRowKey(key);
    onChangeSelected(item);
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
    {
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
    }
  ];

  const onRow = (record) => {
    return {
      onClick: () => {
        setSelectedRowKey(record.id);
      }
    }
  };

  return arrayNotEmpty(data) ? (
    <Table
      bordered
      scroll={{ x: 750 }}
      rowKey="id"
      columns={columns}
      dataSource={data}
      pagination={data.length > 10}
      onRow={onRow}
      style={{ cursor: "pointer", marginBottom: 20 }}
    />
  ) : null;
};

export default InStockTable;