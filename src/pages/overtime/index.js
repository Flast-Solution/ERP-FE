import React, { useCallback, useState } from 'react';
import RestList from "@flast-erp/core/components/RestLayout/RestList";
import useGetList from "@flast-erp/core/hooks/useGetList";
import { Helmet } from "react-helmet";
import CustomBreadcrumb from '@flast-erp/core/components/BreadcrumbCustom';
import Filter from './Filter';
import { Button, Typography } from 'antd';
import { InAppEvent } from "@flast-erp/core/utils/FuseUtils";
import { HASH_MODAL } from 'configs';
import { arrayEmpty, dateFormatOnSubmit, formatTime } from '@flast-erp/core/utils/dataUtils';
import useGetMe from '@flast-erp/core/hooks/useGetMe';
import {
  NGHI_PHEP_STATUS_TEXT, 
  NGHI_PHEP_STATUS_WAITING,
} from 'configs/constant';
import { formatDateDayjs } from '@flast-erp/core/utils/textUtils'
import { OTContent } from './styles';

const { Paragraph, Text } = Typography;

const Overtime = () => {

  const { isLeader } = useGetMe();
  const showPreviewOnly = isLeader();

  const textBtn = useCallback((item) => {
    let text = "Xem đơn";
    if (isLeader()) {
      const reEditStatus = item?.overTimeReality?.status ?? item.status;
      if (reEditStatus === NGHI_PHEP_STATUS_WAITING) {
        text = "Duyệt";
      } else {
        text = "Xem";
      }
    }
    return text;
  }, [isLeader]);
  
  const onEdit = (item) => {
    let title = 'Sửa đơn làm thêm giờ # ' + item.id;
    let hash = '#draw/overtime.edit';
    if(showPreviewOnly) {
      title = 'Duyệt đơn làm thêm giờ # ' + item.id;
      hash = '#draw/overtime.confirm';
    }
    InAppEvent.emit(HASH_MODAL, { hash, title, data: item });
  }

  const onCreate = () => InAppEvent.emit(HASH_MODAL, { 
    hash: '#draw/overtime.edit', 
    title: 'Tạo mới đơn làm thêm giờ',
    data: { createdAt: new Date() } 
  });

	const [ title ] = useState("Đăng ký làm thêm giờ");
	const CUSTOM_ACTION = [
		{
      title:"Id",
      dataIndex:'id',
      width:100
    },
		{
      title:"Employe",
      dataIndex:'userCreate',
      width:150,
      ellipsis: true
    },
		{
      title:"Review",
      dataIndex:'userCheck',
      width:150,
      ellipsis: true
    },
		{
      title:"Appoved",
      dataIndex:'userAppoved',
      width:150,
      ellipsis: true
    },
		{
      title:"Content",
      dataIndex:'listRegis',
      width:400,
      ellipsis: true,
      render: (listRegis) => <RenderOTItem listRegis={listRegis} />
    },
    {
      title:"Created",
      dataIndex:'createdAt',
      width:120,
      ellipsis: true,
			render: (createdAt) => formatTime(createdAt)
    },
		{
      title:"Status",
      width:100,
      ellipsis: true,
			render: (item) => NGHI_PHEP_STATUS_TEXT.find(i => i.id === (item?.overTimeReality?.status ?? item.status ))?.name ?? '(Unknow)'
    },
		{
      title:"",
      width:100,
      fixed:'right',
      render: (record) => (
        <Button color="danger" variant="dashed" onClick={() => onEdit(record)} size='small'>{textBtn(record)}</Button>
      )
    }
	];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

	return (
		<div className='my__content'>
			<Helmet>
				<title>{title}</title>
			</Helmet>
			<CustomBreadcrumb 
				data={[ { title: 'Home' }, { title: title} ]} 
			/>
			<RestList 
				xScroll={1200}
				initialFilter={{ limit: 10, page: 1 }}
				filter={<Filter />}
        beforeSubmitFilter={beforeSubmitFilter}
				useGetAllQuery={ useGetList }
				apiPath={'over-time/fetch'}
        customClickCreate={onCreate}
				columns={CUSTOM_ACTION}
			/>
		</div>
	)
}

const RenderOTItem = ({ listRegis }) => {
  return arrayEmpty(listRegis) ? '(No Content)' : 
    <OTContent>
      { listRegis.map( (regis, id) => (
      <Typography key={id}>
        <Paragraph >
          <Text>{regis?.jobs}</Text>
        </Paragraph>
        <Paragraph >
          <Text strong type={regis.type === 2 ? "warning" : "success"}>
            Từ {formatDateDayjs(regis.startTime, "MM-DD HH:mm")}, đến {formatDateDayjs(regis.endTime, "MM-DD HH:mm")}
          </Text>
        </Paragraph>
      </Typography>
    ))}
  </OTContent>
}

export default Overtime;