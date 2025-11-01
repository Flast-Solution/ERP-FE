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

import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import RestList from 'components/RestLayout/RestList';
import LeadFilter from './Filter';
import useGetList from "hooks/useGetList";
import { dateFormatOnSubmit, f5List } from 'utils/dataUtils';
import { InAppEvent } from 'utils/FuseUtils';
import { Button, Col, Form, Row } from 'antd';
import ModaleStyles from 'pages/lead/style';
import { useForm } from 'antd/es/form/Form';
import FormInput from 'components/form/FormInput';
import RequestUtils from 'utils/RequestUtils';

const ListWareHouse = () => {

  const [ title ] = useState("Danh sách kho");
  const [ isOpen, setIsOpen ] = useState(false);
  const [ detailWareHouse, setDetailWareHouse ] = useState({});
  const [ form ] = useForm();

  useEffect(() => {
    form.setFieldsValue(detailWareHouse);
  }, [form, detailWareHouse])

  const CUSTOM_ACTION = [
    {
      title: "Tên kho",
      dataIndex: 'name',
      width: 200,
      ellipsis: true
    },
    {
      title: "Số điện thoại",
      dataIndex: 'mobile',
      width: 200,
      ellipsis: true
    },
    {
      title: "Địa chỉ",
      dataIndex: 'address',
      width: 200,
      ellipsis: true
    },
    {
      title: "Khu vực",
      dataIndex: 'area',
      width: 200,
      ellipsis: true
    },
    {
      title: "Thao tác",
      width: 120,
      fixed: 'right',
      render: (record) => (
        <Button color="primary" variant="dashed" size='small' onClick={() => {
          setDetailWareHouse(record)
          setIsOpen(true)
        }}>
          Update
        </Button>
      )
    }
  ];

  const onData = useCallback((values) => {
    const newData = { embedded: values, page: { pageSize: 10, total: 1 } }
    return newData;
  }, []);

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onCreateLead = () => {
    setIsOpen(true);
    setDetailWareHouse({});
  }

  const onHandleCreateWareHouse = async (value) => {
    const data = detailWareHouse ? await RequestUtils.Post('/warehouse/update-stock', value) : await RequestUtils.Post('/warehouse/created-stock', value);
    if (data.errorCode) {
      f5List('warehouse/fetch-stock');
      setIsOpen(false);
      InAppEvent.normalSuccess('Tạo kho thành công');
    }
  }

  return (
    <div>
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
        filter={<LeadFilter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={'warehouse/fetch-stock'}
        customClickCreate={onCreateLead}
        columns={CUSTOM_ACTION}
      />
      <ModaleStyles 
        title={<div style={{ color: '#fff' }}>Tạo kho</div>}
        open={isOpen} 
        footer={false} 
        onCancel={() => {
          setIsOpen(false);
        }}
      >
        <div style={{ padding: 15 }}>
          <Form
            name="basic"
            layout='vertical'
            form={form}
            onFinish={onHandleCreateWareHouse}
          >
            <Row gutter={14}>
              <Col xs={24} xl={12}>
                <FormInput
                  maxLength={255}
                  name="name"
                  label="Tên kho"
                  placeholder="Nhập tên kho "
                  required
                />
              </Col>
              <Col xs={24} xl={12}>
                <FormInput
                  maxLength={255}
                  name="mobile"
                  label="Số điện thoại"
                  placeholder="Nhập Số điện thoại "
                  required
                />
              </Col>
              <Col xs={24} xl={12}>
                <FormInput
                  maxLength={255}
                  name="address"
                  label="Địa chỉ"
                  placeholder="Nhập địa chỉ "
                  required
                />
              </Col>
              <Col xs={24} xl={12}>
                <FormInput
                  maxLength={255}
                  name="area"
                  label="Khu vực"
                  placeholder="Nhập khu vực"
                  required
                />
              </Col>
            </Row>
            <Form.Item style={{ display: 'flex', justifyContent: 'end', marginTop: 10 }}>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </ModaleStyles>
    </div>
  )
}

export default ListWareHouse

