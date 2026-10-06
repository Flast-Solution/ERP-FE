import React from 'react';
import { Table, Button, DatePicker, Input, InputNumber, Select, Space, Tooltip, Typography } from 'antd';
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { arrayEmpty, formatterInputNumber, parserInputNumber } from '@flast-erp/core/utils';
import { ShowSkuDetail } from '@/containers/Product/SkuView';
import styled from 'styled-components';
import { formatOrderCurrency as formatCurrencyAmount } from './orderFormatting';
import { resolveOrderSkuDetails } from './orderSku';
import { parseOrderLine } from './orderLine';
import { parseDayQuote } from './orderEditorDates';
import { CURRENCY_USD, CURRENCY_VND, warrantyOptions } from './orderEditorModel';
const { Text } = Typography;
const selectNumberOnFocus = event => event.target.select();
const currencyOptions = [{ label: 'USD', value: CURRENCY_USD }];
const vatOptions = [0, 8, 10].map(value => ({ label: `${value}%`, value }));
const SkuOrderLineTooltip = ({ skuDetails, orderLine }) => {
  const details = Array.isArray(skuDetails) ? skuDetails : [];
  const orderLineEntries = Object.entries(parseOrderLine(orderLine));

  if (details.length === 0 && orderLineEntries.length === 0) {
    return <span>Chưa có thông tin SKU và thông tin bổ sung.</span>;
  }

  return (
    <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
      <Text strong style={{ color: 'inherit' }}>Thông tin SKU</Text>
      {details.length > 0 ? details.map((detail, index) => (
        <div key={`${detail?.text ?? 'sku'}-${index}`} style={{ marginTop: 6 }}>
          <strong>{detail?.text || 'Thuộc tính'}: </strong>
          {(Array.isArray(detail?.values) ? detail.values : [])
            .map(value => value?.text ?? value?.value ?? value?.id)
            .filter(value => value !== undefined && value !== null && value !== '')
            .join(', ') || '—'}
        </div>
      )) : <div style={{ marginTop: 6 }}>Chưa có</div>}

      <div style={{ marginTop: 12 }}>
        <Text strong style={{ color: 'inherit' }}>Thông tin bổ sung</Text>
        {orderLineEntries.length > 0 ? orderLineEntries.map(([key, value]) => (
          <div key={key} style={{ marginTop: 6 }}>
            <strong>{key}: </strong>{String(value ?? '—')}
          </div>
        )) : <div style={{ marginTop: 6 }}>Chưa có</div>}
      </div>
    </div>
  );
};

const OpportunityTable = styled(Table)`
  .ant-table-cell {
    padding: 12px 10px !important;
    vertical-align: middle;
  }

  .ant-input-number-input {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .ant-table-summary {
    background: ${({ theme }) => theme?.background?.content || '#fafafa'};
    font-variant-numeric: tabular-nums;
  }
`;

const EditButton = ({
  editable,
  onEdit,
  onClose,
  onDelete
}) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <Button size="small" onClick={editable ? onClose : onEdit}>
      {editable ? <CheckOutlined /> : 'Sửa'}
    </Button>
    <Button
      size="small"
      danger
      icon={<DeleteOutlined />}
      style={{ marginLeft: 6 }}
      onClick={onDelete}
    />
  </div>
);

const OrderItemsTable = ({ data, customerOrder, currency, exchangeRate, vatRate, setVatRate,
  restrictOrderFields, hideEditColumn, handleChange, editRow, closeEdit, deleteRow,
  getLineAmount, getSalePrice, getLineVat, renderOrderAmount, formatDisplayAmount,
  handleExchangeRateChange, totalQuantity, totalSubOrder, totalVat, totalOrder, totalDiscount }) => {
  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (value, record) => (
        <Input
          size="small"
          value={value}
          maxLength={100}
          disabled={restrictOrderFields}
          placeholder="Nhập mã đơn hàng"
          onChange={event => handleChange(record.key, 'code', event.target.value)}
        />
      )
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 180,
      ellipsis: true
    },
    {
      title: 'SKU',
      dataIndex: 'mSkuDetails',
      key: 'mSkuDetails',
      width: 260
    },
    {
      title: 'Giá mua (USD)',
      dataIndex: 'productPrice',
      key: 'productPrice',
      width: 140,
      align: 'right',
      editable: true
    },
    {
      title: 'Lợi nhuận (%)',
      dataIndex: 'profit',
      key: 'profit',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <InputNumber
          onFocus={selectNumberOnFocus}
          size="small"
          min={0}
          max={99.99}
          disabled={restrictOrderFields}
          value={Number(record?.profit ?? 0)}
          onChange={value => handleChange(record.key, 'profit', value)}
          formatter={value => `${value ?? 0}%`}
          parser={value => value?.replace('%', '')}
          controls={false}
          style={{ width: '100%', textAlign: 'right' }}
        />
      )
    },
    {
      title: 'Giá bán (USD)',
      dataIndex: 'salePrice',
      key: 'salePrice',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <InputNumber
          onFocus={selectNumberOnFocus}
          size="small"
          min={0}
          disabled={restrictOrderFields}
          value={record.salePriceUsd}
          onChange={value => handleChange(record.key, 'price', value)}
          formatter={formatterInputNumber}
          parser={parserInputNumber}
          controls={false}
          style={{ width: '100%', textAlign: 'right' }}
        />
      )
    },
    {
      title: 'Giá bán (VND)',
      dataIndex: 'salePriceVnd',
      key: 'salePriceVnd',
      width: 170,
      align: 'right',
      render: (_, record) => (
        <InputNumber
          onFocus={selectNumberOnFocus}
          size="small"
          min={0}
          disabled={restrictOrderFields}
          value={getSalePrice(record)}
          onChange={value => handleChange(record.key, 'priceV', value)}
          formatter={formatterInputNumber}
          parser={parserInputNumber}
          controls={false}
          placeholder="Nhập giá bán VND"
          style={{ width: '100%', textAlign: 'right' }}
        />
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true,
      width: 100,
      align: 'right'
    },
    {
      title: 'Thành tiền (USD)',
      dataIndex: 'lineAmount',
      key: 'lineAmount',
      width: 150,
      align: 'right',
      render: (_, record) => renderOrderAmount(getLineAmount(record))
    },
    {
      title: (
        <Space size={6}>
          <span>VAT (USD)</span>
          <Select
            size="small"
            value={vatRate}
            options={vatOptions}
            onChange={value => setVatRate(Number(value ?? 0))}
            style={{ width: 68 }}
          />
        </Space>
      ),
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: 170,
      align: 'right',
      render: (_, record) => renderOrderAmount(getLineVat(record))
    },
    {
      title: 'Tổng tiền (USD)',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      width: 150,
      align: 'right',
      render: (_, record) => renderOrderAmount(getLineAmount(record) + getLineVat(record))
    },
    {
      title: customerOrder?.type === 'order' ? 'Ngày Chốt' : 'Ngày D.kiến',
      dataIndex: 'dayQuote',
      key: 'dayQuote',
      width: 150,
      render: (value, record) => {
        const dateValue = parseDayQuote(value);
        return (
          <DatePicker
            size="small"
            allowClear
            value={dateValue?.isValid() ? dateValue : null}
            format="DD/MM/YYYY"
            placeholder="dd/mm/yyyy"
            onChange={date => handleChange(
              record.key,
              'dayQuote',
              date ? date.format('YYYY-MM-DD HH:mm:ss') : null,
            )}
            style={{ width: '100%' }}
          />
        );
      }
    },
    {
      title: 'CK (%)',
      dataIndex: 'discountRate',
      key: 'discountRate',
      width: 90,
      align: 'right',
      editable: true
    },
    {
      title: `Tiền CK (${currency})`,
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      width: 120,
      align: 'right',
      editable: true
    },
    {
      title: 'Bảo hành',
      dataIndex: 'warrantyPeriod',
      key: 'warrantyPeriod',
      width: 110,
      editable: true
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 90
    },
    {
      title: 'Kho',
      dataIndex: 'warehouse',
      key: 'warehouse',
      editable: true,
      width: 130
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      align: 'right'
    },
    {
      title: 'Sửa',
      dataIndex: 'operation',
      key: 'operation',
      fixed: 'right',
      width: 110,
      render: (_, record) => (
        <EditButton
          editable={record.editable}
          onEdit={() => editRow(record.key)}
          onClose={closeEdit}
          onDelete={() => deleteRow(record.key)}
        />
      )
    }
  ];

  const renderCell = (text, record, index, column) => {
    if ((record.editable && column.editable) || (restrictOrderFields && column.dataIndex === 'quantity')) {
      if (column.dataIndex === 'warehouse') {
        return (
          <Select
            size="small"
            placeholder="Chọn kho"
            disabled={arrayEmpty(record?.warehouseOptions)}
            value={text}
            options={(record?.warehouseOptions ?? []).map(opt => ({
              label: opt.stockName,
              value: opt.id
            }))}
            onChange={value => handleChange(record.key, column.dataIndex, value)}
            style={{ width: '100%' }}
          />
        );
      }
      if (column.dataIndex === 'warrantyPeriod') {
        return (
          <Select
            size="small"
            placeholder="Chọn bảo hành"
            disabled={!record.editable}
            value={text}
            options={warrantyOptions.map(opt => ({
              label: opt.name,
              value: opt.id
            }))}
            onChange={value => handleChange(record.key, column.dataIndex, value)}
            style={{ width: '100%' }}
          />
        );
      }
      if (column.dataIndex === 'quantity') {
        return (
          <InputNumber
            onFocus={selectNumberOnFocus}
            size="small"
            min={1}
            value={text}
            onChange={value => handleChange(record.key, column.dataIndex, value)}
            controls={false}
            style={{ width: '100%', textAlign: 'right' }}
            formatter={formatterInputNumber}
            parser={parserInputNumber}
          />
        );
      }
      return (
        <InputNumber
          onFocus={selectNumberOnFocus}
          size="small"
          min={0}
          max={column.dataIndex === 'profit' ? 99.99 : undefined}
          value={text}
          onChange={value => handleChange(record.key, column.dataIndex, value)}
          controls={false}
          style={{ width: '100%', textAlign: 'right' }}
          formatter={formatterInputNumber}
          parser={parserInputNumber}
        />
      );
    }
      if (column.dataIndex === 'warehouse') {
        return <Text style={{ width: 120 }} ellipsis> {text || '(Chưa nhập)'} </Text>;
      }
      if (column.dataIndex === 'mSkuDetails') {
        const skuDetails = resolveOrderSkuDetails(record);
        const orderLineEntries = Object.entries(parseOrderLine(record.orderLine));

        return (
          <Tooltip
            placement="topLeft"
            mouseEnterDelay={0.2}
            styles={{ root: { maxWidth: 520 } }}
            title={<SkuOrderLineTooltip skuDetails={skuDetails} orderLine={record.orderLine} />}
          >
            <div style={{ cursor: 'help' }}>
              <ShowSkuDetail skuDetails={skuDetails} width={260} />
              {orderLineEntries.map(([key, value]) => (
                <Text key={key} ellipsis style={{ display: 'block', width: 260 }}>
                  <strong>{key}: </strong>
                  <span>{String(value ?? '')}</span>
                </Text>
              ))}
            </div>
          </Tooltip>
        );
      }
      const isFormatted = ['productPrice', 'discountAmount', 'totalPrice'].includes(column.dataIndex);
      if (column.dataIndex === 'profit') {
        return `${Number(text ?? 0)}%`;
      }
      return isFormatted
        ? (column.dataIndex === 'totalPrice' ? formatDisplayAmount(text) : formatCurrencyAmount(text, currency))
        : text;
  };

  return (
      <OpportunityTable
        bordered
        scroll={{ x: 2560 }}
        dataSource={data}
        columns={columns.filter(col => !hideEditColumn || col.key !== 'operation').map(col => ({
          ...col,
          onHeaderCell: () => ({
            style: { whiteSpace: 'nowrap' }
          }),
          onCell: (record, index) => ({
            ...(col.onCell?.(record, index) ?? {}),
            editable: col.editable?.toString()
          }),
          render: [
            'code',
            'profit',
            'salePrice',
            'salePriceVnd',
            'lineAmount',
            'vatAmount',
            'grandTotal',
            'dayQuote',
            'operation'
          ].includes(col.dataIndex)
            ? col.render
            : (text, record, index) => renderCell(text, record, index, col)
        }))}
        pagination={false}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={3}>
              <Space wrap size={12}>
                <Space size={6}>
                  <Text>Loại tiền</Text>
                  <Select
                    size="small"
                    value={currency}
                    options={currencyOptions}
                    style={{ width: 90 }}
                  />
                </Space>
                <Space size={6}>
                  <Text>Tỷ giá</Text>
                  <InputNumber
                    onFocus={selectNumberOnFocus}
                    size="small"
                    min={currency === CURRENCY_USD ? 0.01 : 1}
                    value={exchangeRate}
                    controls={false}
                    disabled={currency === CURRENCY_VND}
                    onChange={handleExchangeRateChange}
                    formatter={formatterInputNumber}
                    parser={parserInputNumber}
                    style={{ width: 170 }}
                  />
                </Space>
              </Space>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3}></Table.Summary.Cell>
            <Table.Summary.Cell index={4}></Table.Summary.Cell>
            <Table.Summary.Cell index={5}></Table.Summary.Cell>
            <Table.Summary.Cell index={6}></Table.Summary.Cell>
            <Table.Summary.Cell index={7} align="right">{totalQuantity}</Table.Summary.Cell>
            <Table.Summary.Cell index={8} align="right">{formatDisplayAmount(totalSubOrder)}</Table.Summary.Cell>
            <Table.Summary.Cell index={9} align="right">{formatDisplayAmount(totalVat)}</Table.Summary.Cell>
            <Table.Summary.Cell index={10} align="right"><Text strong>{formatDisplayAmount(totalOrder)}</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={11}></Table.Summary.Cell>
            <Table.Summary.Cell index={12}></Table.Summary.Cell>
            <Table.Summary.Cell index={13} align="right">{formatCurrencyAmount(totalDiscount, currency)}</Table.Summary.Cell>
            <Table.Summary.Cell index={14} colSpan={hideEditColumn ? 4 : 5}></Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
  );
};

export default OrderItemsTable;
