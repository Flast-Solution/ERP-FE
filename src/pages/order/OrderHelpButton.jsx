import React from 'react';
import { Button, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const OrderHelpButton = () => (
  <Tooltip title="Hướng dẫn Danh sách đơn hàng">
    <Button
      type="default"
      style={{ color: '#096ab2', borderColor: '#b8d6ed', background: '#fff' }}
      shape="circle"
      icon={<QuestionCircleOutlined style={{ fontSize: 21 }} />}
      href={`${process.env.PUBLIC_URL || ''}/help/hatenko/orders/index.html`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Mở hướng dẫn Danh sách đơn hàng trong tab mới"
    />
  </Tooltip>
);

export default OrderHelpButton;
