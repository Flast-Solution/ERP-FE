import React from 'react';
import { Button, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const ProductHelpButton = () => (
  <Tooltip title="Hướng dẫn Danh sách sản phẩm">
    <Button
      type="text"
      shape="circle"
      icon={<QuestionCircleOutlined style={{ fontSize: 21 }} />}
      href={`${process.env.PUBLIC_URL || ''}/help/hatenko/products/index.html`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Mở hướng dẫn Danh sách sản phẩm trong tab mới"
    />
  </Tooltip>
);

export default ProductHelpButton;
