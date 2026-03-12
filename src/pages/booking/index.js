import React, { useState } from 'react';
import { Helmet } from "react-helmet";
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import { Tabs } from 'antd';
import Car from './Car';
import Flight from './Flight';
import Hotel from './Hotel';

const Booking = () => {

  const [activeTab, setActiveTab] = useState('car');

  const items = [
    {
      key: 'car',
      label: 'Đặt Xe',
      children: <Car />
    },
    {
      key: 'flight',
      label: 'Đặt Máy Bay',
      children: <Flight />
    },
    {
      key: 'hotel',
      label: 'Đặt Khách Sạn',
      children: <Hotel />
    }
  ];

  return (
    <>
      <Helmet>
        <title>Booking - Quản lý hành chính</title>
      </Helmet>
      <CustomBreadcrumb
        data={[
          { title: 'Quản lý hành chính' },
          { title: 'Booking' }
        ]}
      />
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
      />
    </>
  );
};

export default Booking;