/**************************************************************************/
/*  GiaoHang.js                                                           */
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

import React, { useState } from 'react'
import { Col, Form, Row, message, Table } from 'antd'
import CustomButton from 'components/CustomButton';
import FormAddress from 'components/form/FormAddress';
import FormInput from 'components/form/FormInput';
import FormInputNumber from 'components/form/FormInputNumber';
import FormSelectAPI from 'components/form/FormSelectAPI';
import FormInfiniteOrderCode from 'components/form/SelectInfinite/FormInfiniteOrderCode';
import FormSelect from 'components/form/FormSelect';
import WarehouseService from 'services/WarehouseService';
import { useEffectAsync } from 'hooks/MyHooks';
import { arrayEmpty } from 'utils/dataUtils';
import OrderTextTableOnly from 'containers/Order/OrderTextTableOnly';
import RequestUtils from 'utils/RequestUtils';
import FormTextArea from 'components/form/FormTextArea';
import { SUCCESS_CODE } from 'configs';

const GiaoHangForm = ({ title, data }) => {

  const [form] = Form.useForm();
  const [submitStock, setSubmitStock] = useState({});
  const [details, setDetails] = useState([]);
  const [ship, setShip] = useState({});

  const onChangeGetOrderItem = (value, order) => {
    let { id, details, ...values } = order;
    const {
      customerProvinceId: provinceId,
      customerWardId: wardId,
      customerAddress: address,
      ...params
    } = values;

    form.setFieldsValue({ ...params, provinceId, wardId, address });
    if (arrayEmpty(details)) {
      return;
    }
    for (let detail of details) {
      detail.mSkuDetails = JSON.parse(detail.skuInfo);
    }
    setDetails(details || []);
  }

  const onFinish = async (values) => {
    if (data?.onSubmit && typeof data.onSubmit === 'function') {
      await data.onSubmit(values);
      return;
    }

    if (!submitStock.id) {
      message.error("Chưa chọn kho giao !");
      return;
    }
    const { quality } = values;
    if (submitStock.quantity < quality) {
      message.error("Kho không đủ số lượng giao !");
      return;
    }
    const { data: response, message: MSG, errorCode } = await RequestUtils.Post("/warehouse/delivery", {
      warehouseId: submitStock.id,
      id: ship.id,
      ...values
    });
    if (errorCode === SUCCESS_CODE) {
      setShip(response);
    }
    message.success(MSG);
  }

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col md={12} xs={24}>
          <FormInfiniteOrderCode
            required
            onChangeGetSelectedItem={onChangeGetOrderItem}
            formatText={(_, order) => `${order.code} (${order.customerMobilePhone})`}
            label="Mã đơn"
            placeholder={"Nhập mã đơn"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelect
            required
            formatText={(_, detail) => `${detail.code} (${detail.productName}), SL: ${detail.quantity}`}
            resourceData={details}
            label="Mã đơn con"
            valueProp='code'
            name="detailCode"
            placeholder={"Nhập mã đơn nhỏ"}
          />
        </Col>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, curValues) => prevValues.detailCode !== curValues.detailCode}
        >
          {({ getFieldValue }) => (
            <Col md={24} xs={24}>
              <ShowSkuInStockByDetailCode
                details={details}
                detailCode={getFieldValue('detailCode')}
                onChoiseStock={setSubmitStock}
              />
            </Col>
          )}
        </Form.Item>
        <Col md={12} xs={24}>
          <FormInput
            required
            label="Người nhận"
            name="customerReceiverName"
            placeholder={"Nhập họ tên"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            required
            label="Số điện thoại"
            name="customerMobilePhone"
            placeholder={"Số điện thoại"}
          />
        </Col>
        <FormAddress />
        <Col md={12} xs={24}>
          <FormSelectAPI
            required
            apiPath="transporter/fetch"
            label="Đơn vị vận chuyển"
            name="transporterId"
            placeholder={"Chọn đơn vị vận chuyển"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            required
            label="Mã vận đơn"
            name="transporterCode"
            placeholder={"Mã vận đơn"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInputNumber
            label="Phí vận chuyển"
            name="shippingCost"
            placeholder={"Phí"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInputNumber
            required={false}
            label="Tiền thu hộ"
            name="cod"
            placeholder={"Tiền COD"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInputNumber
            mix={1}
            required
            label="Số lượng"
            name="quantity"
            placeholder={"Số lượng"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelectAPI
            required
            apiPath='shipping/fetch-status'
            apiAddNewItem='shipping/created-status'
            onData={(data) => data ?? []}
            label="Trang thái"
            name="status"
            placeholder="Trạng thái"
          />
        </Col>
        <Col md={24} xs={24}>
          <FormTextArea
            rows={2}
            label="Ghi chú giao hàng"
            name="note"
            placeholder="Nghi chú nếu có"
          />
        </Col>
        <Col md={24} xs={24}>
          <CustomButton
            htmlType="submit"
            title="Hoàn thành"
          />
        </Col>
      </Row>
    </Form>
  )
}

const ShowSkuInStockByDetailCode = ({
  details,
  detailCode,
  onChoiseStock = (value) => value
}) => {

  const [skusInStock, setSkuInStock] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffectAsync(async () => {
    onChoiseStock({});
    if (!detailCode) {
      return;
    }
    const detail = details.find(i => i.code === detailCode);
    if (!detail?.skuInfo) {
      setSkuInStock([]);
      return;
    }
    const skuHash = await WarehouseService.hashSku(detail.skuInfo);
    const { embedded } = await WarehouseService.fetch({ skuHash });
    setSkuInStock(embedded);
  }, [details, detailCode]);

  const rowSelection = {
    type: 'radio',
    selectedRowKeys,
    onChange: (selectedKeys, selectedRows) => {
      setSelectedRowKeys(selectedKeys);
      const [rowSelect] = selectedRows;
      onChoiseStock(rowSelect);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id' },
    { title: 'Kho', dataIndex: 'stockName' },
    { title: 'Tên SKU', dataIndex: 'skuName' },
    { title: 'Số lượng', dataIndex: 'quantity' },
    { title: 'NCC', dataIndex: 'providerName' }
  ];

  return arrayEmpty(skusInStock) ? '' : (
    <div className='item-detail'>
      <p><strong>Đơn hàng #{detailCode}</strong></p>
      <OrderTextTableOnly
        details={details.filter(i => i.code === detailCode) || []}
      />
      <p style={{ margin: '20px 0px' }}><strong>Chọn một trong các kho</strong></p>
      <Table
        rowKey={'id'}
        style={{ marginBottom: 20 }}
        rowSelection={rowSelection}
        columns={columns}
        dataSource={skusInStock}
        pagination={false}
      />
    </div>
  );
}

export default GiaoHangForm;
