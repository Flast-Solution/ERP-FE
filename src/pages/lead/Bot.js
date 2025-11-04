import React, { useCallback, useState } from 'react';
import RestList from "components/RestLayout/RestList";
import useGetList from "hooks/useGetList";
import { Helmet } from "react-helmet";
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import BotDataFilter from './BotDataFilter';
import { Avatar, Button, message, Space } from 'antd';
import { InAppEvent } from "utils/FuseUtils";
import { CHANNEL_SOURCE_MAP_KEYS } from 'configs/localData';
import { HASH_MODAL } from 'configs';
import { arrayEmpty, formatTime } from 'utils/dataUtils';
import OrderService from 'services/OrderService';
import LeadService from 'services/LeadService';
import { useNavigate } from 'react-router-dom';
import RequestUtils from 'utils/RequestUtils';

const BotData = () => {

  const navigation = useNavigate();
  const [ title ] = useState("Bộ sưu tập dữ liệu đa kênh");

  const onEdit = (item) => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/lead.collection', 
    title: 'Sửa dữ liệu # ' + item.id,
    data: item 
  });

  const CUSTOM_ACTION = [
    {
      title:"Người dùng",
      dataIndex:'fullName',
      width:150,
      ellipsis: true
    },
    {
      title:"Nguồn",
      dataIndex:'channel',
      width:110,
      ellipsis: true,
      render: (channel) => CHANNEL_SOURCE_MAP_KEYS[channel].name ?? '(Chưa C/N)'
    },
    {
      title:"Dịch vụ",
      dataIndex:'serviceName',
      width:110,
      ellipsis: true
    },
    {
      title:"SĐT",
      dataIndex:'mobile',
      width:150,
      ellipsis: true
    },
    {
      title:"Avatar",
      dataIndex:'imageSrc',
      width:80,
      render: (imageSrc) => <Avatar src={imageSrc} />
    },
    {
      title:"Đ/C | N.Nghiệp",
      dataIndex:'address',
      width:200,
      ellipsis: true
    },
    {
      title:"Profile",
      width:170,
      ellipsis: true,
      render: ({ profileLink }) => (
        <a
          rel="noopener noreferrer" 
          href={profileLink} 
          target='_blank'
        >
          { profileLink || '(Chưa có)'}
        </a>
      )
    },
    {
      title:"Ngày",
      width:100,
      ellipsis: true,
      render: ({receiveTime}) => formatTime(receiveTime)
    },
    {
      title:"",
      width:110,
      fixed:'right',
      render: (record) => (
        <Space gap={10}>
          <Button 
            size='small' 
            onClick={() => onEdit(record)}
          >
            Edit
          </Button>
          <Button 
            size='small' 
            onClick={() => onCreateOpportunity(record)}
            style={{ color: '#ff6600', borderColor: '#ff6600' }}
          >
            Tạo cơ hội
          </Button>
        </Space>
      )
    }
  ];

  const onCreateOpportunity = useCallback(async (data) => {
    if(!data?.productId) {
      message.error("Vui lòng chọn sản phẩm trước khi tạo cơ hội!");
      return data;
    }

    let [ error, mData ] = await LeadService.fetchByPhone(data.mobile);
    if(!error) {
      navigation(RequestUtils.generateUrlGetParams('/sale/ban-hang', { dataId: mData.id }));
      return data;
    }

    const mLead = {
      level: "L1",
      productId: data.productId,
      productName: data.productName,
      saleId: data.userId,
      serviceId: data.service,
      source: data.channel,
      customerName: data.fullName,
      customerMobile: data.mobile,
      provinceName: data.address,
      customerEmail: data.email,
      customerFacebookId: data.profileLink,
    };
    const { error: mError, data: lead } = await LeadService.createLead(mLead);
    if(mError) {
      message.error("Lỗi tạo mới cơ hội!");
      return data;
    }
    
    navigation(RequestUtils.generateUrlGetParams('/sale/ban-hang', { dataId: lead.dataId }));
  }, [ navigation ]);

  const onData = useCallback(async (data) => {
    if(arrayEmpty(data?.embedded)) {
      return data;
    }
    const services = await OrderService.fetchService();
    const { embedded } = data;
    for(let item of embedded) {
      item.serviceName = services.find(s => s.id === item.service)?.name ?? '';
    }
    return data;
  }, []);

  return (
    <div className="wap-group">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <CustomBreadcrumb 
        data={[ { title: 'Trang chủ' }, { title: title} ]} 
      />
      <RestList 
        onData={onData}
        initialFilter={{ limit: 10, page: 1 }}
        hasCreate={false}
        useGetAllQuery={ useGetList }
        apiPath={ 'data-collection/fetch' }
        filter={ <BotDataFilter /> }
        columns={ CUSTOM_ACTION }
      />
    </div>
  )
};

export default BotData;