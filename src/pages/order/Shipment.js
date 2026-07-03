import React, { useState} from 'react';
import { Helmet } from "react-helmet";
import { BreadcrumbCustom } from '@flast-erp/core/components';

const Shipment = () => {

  const [ title ] = useState("Lô hàng");

  return (
    <div style={{ padding: 16 }}>
      <Helmet>
        <title>{title}</title>
      </Helmet>

      <BreadcrumbCustom
        data={[{ title: 'Trang chủ' }, { title: title }]}
      />
      <div style={{background: '#fff', padding: 20, borderRadius: 10}}>
        
      </div>
    </div>
  )
};

export default Shipment;