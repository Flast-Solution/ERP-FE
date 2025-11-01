import React from 'react';
import { Row, Col, Typography } from 'antd';
const { Text } = Typography;

const HeaderCompany = () => {
  return (
    <Row justify="start" align="middle">
      <Col span={7} className='logo'>
        <img
          src="/logo.png"
          alt="Logo"
          style={{ maxHeight: 40, width: 'auto' }}
        />
      </Col>
      <Col span={14} className='company'>
        <p><strong>CÔNG TY CỔ PHẦN FLAST SOLUTUON</strong></p>
        <div className='contact'>
          <Text>Hà Nội: Số 35 Lê Văn Lương, Thanh Xuân, TP.Hà Nội</Text>
          <Row justify="start" style={{ marginTop: '5px' }}>
            <Text>(0987) 938-491</Text>
            <Text className='left20'>flast.vn@printgo.vn</Text>
            <Text className='left20'>www.flast.vn</Text>
          </Row>
        </div>
      </Col>
    </Row>
  )
}

export default HeaderCompany;