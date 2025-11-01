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
import { SelectOutlined, UserAddOutlined } from '@ant-design/icons';
import RestList from 'components/RestLayout/RestList';
import LeadFilter from './LeadFilter';
import useGetList from "hooks/useGetList";
import { Button, Form, Tag, Tooltip } from 'antd';
import { dateFormatOnSubmit, f5List } from 'utils/dataUtils';
import { HASH_MODAL } from 'configs';
import { InAppEvent } from 'utils/FuseUtils';
import RequestUtils from 'utils/RequestUtils';
import { cloneDeep } from 'lodash';
import ModaleStyles from './style';
import FormSelect from 'components/form/FormSelect';
import { NoFooter } from 'components/common/NoFooter';
import { useNavigate } from "react-router-dom";
import { CHANNEL_SOURCE_MAP_KEYS } from 'configs/localData';

const LeadPage = () => {

  const [form] = Form.useForm();
  const [title] = useState("Danh sách Lead");
  const [listSale, setListSale] = useState([]);
  const [detailRecord, setDetailRecord] = useState({});
  const [listServices, setlistServices] = useState([])

  useEffect(() => {
    RequestUtils.GetAsList('/service/list').then(setlistServices);
    RequestUtils.GetAsList('/user/list-name-id').then(setListSale);
  }, [])

  useEffect(() => {
    form.setFieldsValue({ saleId: detailRecord?.saleId })
  }, [form, detailRecord])

  const onEdit = (item) => {
    let data = cloneDeep(item);
    InAppEvent.emit(HASH_MODAL, {
      hash: '#draw/lead.edit',
      title: 'Cập nhật lead #' + item.id,
      data: {
        record: data,
        listServices,
        listSale
      }
    });
  }

  let navigate = useNavigate();
  const onCreateOpportunity = useCallback(({ id }) => {
    navigate(RequestUtils.generateUrlGetParams("/sale/ban-hang", { dataId: id }));
  }, [navigate]);

  const CUSTOM_ACTION = [
    {
      title: "Create",
      dataIndex: 'staff',
      width: 150
    },
    {
      title: "Khách hàng",
      dataIndex: 'customerName',
      width: 200,
      ellipsis: true
    },
    {
      title: "Số đ/t",
      dataIndex: 'customerMobile',
      width: 120,
      ellipsis: true
    },
    {
      title: "Dịch vụ",
      dataIndex: 'serviceId',
      width: 150,
      ellipsis: true,
      render: (serviceId) => {
        const nameService = listServices.find(f => f.id === serviceId)
        return <Tag color="orange">{nameService?.name || 'N/A'} </Tag>
      }
    },
    {
      title: "Nguồn",
      dataIndex: 'source',
      width: 170,
      render: (source) => CHANNEL_SOURCE_MAP_KEYS[source]?.name
    },
    {
      title: "Sản phẩm",
      dataIndex: 'productName',
      width: 200,
      ellipsis: true
    },
    {
      title: "Ngày",
      dataIndex: 'inTime',
      width: 150,
      ellipsis: true,
      render: (inTime) => dateFormatOnSubmit(inTime)
    },
    {
      title: "Sale",
      dataIndex: 'assignTo',
      width: 100,
      ellipsis: true
    },
    {
      title: "Cơ hội",
      width: 100,
      fixed: 'right',
      render: (record) => (
        <Button
          color="danger"
          variant="dashed" onClick={() => onCreateOpportunity(record)}
          size='small'
        >
          Tạo cơ hội
        </Button>
      )
    },
    {
      title: "Thao tác",
      width: 100,
      fixed: 'right',
      ellipsis: true,
      render: (record) => (
        <div style={{ display: 'flex', gap: 20 }}>
          <Tooltip style={{ cursor: 'pointer' }} title="Chuyển sale">
            <UserAddOutlined style={{ color: '#1677ff', fontSize: 16 }} onClick={() => {
              setDetailRecord(record)
            }} />
          </Tooltip>
          <Tooltip style={{ cursor: 'pointer' }} title={'Cập nhật'}>
            <SelectOutlined style={{ color: '#1677ff', fontSize: 16 }} onClick={() => onEdit(record)} />
          </Tooltip>
        </div>
      )
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onCreateLead = () => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/lead.edit',
    title: 'Tạo mới Lead',
    data: {
      record: {},
      listServices,
      listSale
    }
  });

  const onHandleSubmitSaleLead = async (value) => {
    const data = await RequestUtils.Post('/data/re-assign', {}, {
      dataId: detailRecord.id,
      saleId: value.saleId
    });
    if (data?.errorCode === 200) {
      f5List('data/lists');
      InAppEvent.normalSuccess("Lead đã được chuyển.");
      setDetailRecord({});
    } else {
      InAppEvent.normalError("Lỗi chuyển lead!");
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
        initialFilter={{ limit: 10, page: 1 }}
        filter={<LeadFilter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={'data/lists'}
        customClickCreate={onCreateLead}
        columns={CUSTOM_ACTION}
      />

      <ModaleStyles
        title={
          <div style={{ color: '#fff' }}>
            Chọn sale chăm sóc lead
          </div>
        }
        open={(detailRecord?.id ?? 0) !== 0}
        footer={<NoFooter />}
        onCancel={() => setDetailRecord({})}
      >
        <div style={{ padding: 15 }}>
          <Form
            layout='vertical'
            form={form}
            onFinish={onHandleSubmitSaleLead}
          >
            <FormSelect
              required={true}
              label="Chọn sale"
              name="saleId"
              placeholder="Sale phụ trách"
              resourceData={listSale || []}
              valueProp="id"
              titleProp="name"
            />
            <Form.Item style={{ display: 'flex', justifyContent: 'end', marginTop: 10 }}>
              <Button type="primary" htmlType="submit"> Submit </Button>
            </Form.Item>
          </Form>
        </div>
      </ModaleStyles>
    </div>
  )
}

export default LeadPage
