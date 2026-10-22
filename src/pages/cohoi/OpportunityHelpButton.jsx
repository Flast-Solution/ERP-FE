import React from 'react';
import { Button, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const OpportunityHelpButton = () => (
  <Tooltip title="Hướng dẫn Danh sách cơ hội bán hàng">
    <Button
      type="default"
      style={{ color: '#096ab2', borderColor: '#b8d6ed', background: '#fff' }}
      shape="circle"
      icon={<QuestionCircleOutlined style={{ fontSize: 21 }} />}
      href={`${process.env.PUBLIC_URL || ''}/help/hatenko/opportunities/index.html`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Mở hướng dẫn Cơ hội bán hàng trong tab mới"
    />
  </Tooltip>
);

export default OpportunityHelpButton;
