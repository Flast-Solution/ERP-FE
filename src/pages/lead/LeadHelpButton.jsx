import React from 'react';
import { Button, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const LeadHelpButton = () => (
  <Tooltip title="Hướng dẫn sử dụng Lead">
    <Button
      type="text"
      shape="circle"
      icon={<QuestionCircleOutlined style={{ fontSize: 21 }} />}
      href={`${process.env.PUBLIC_URL || ''}/help/hatenko/leads/index.html`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Mở hướng dẫn Lead trong tab mới"
    />
  </Tooltip>
);

export default LeadHelpButton;
