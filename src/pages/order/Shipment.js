import React, { useState} from 'react';

import moment from 'moment';
import { Helmet } from "react-helmet";
import { useLocation } from 'react-router-dom';
import CustomBreadcrumb from '@flast-erp/core/components/BreadcrumbCustom';
import QcInspectionBatchForm from '@/containers/Qc/QcInspectionBatchForm';

const Shipment = () => {
  const [title] = useState("Lô hàng");
  const location = useLocation();

  const orderDetails = location.state?.orderDetails || [];

  return (
    <div style={{ padding: 16 }}>
      <Helmet>
        <title>{title}</title>
      </Helmet>

      <CustomBreadcrumb
        data={[{ title: 'Trang chủ' }, { title: title }]}
      />
      <div style={{background: '#fff', padding: 20, borderRadius: 10}}>
        <QcInspectionBatchForm data={orderDetails}/>
      </div>
    </div>
  );
};

export default Shipment;