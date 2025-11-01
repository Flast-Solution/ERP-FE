/**************************************************************************/
/*  ProductSumary.js                                                      */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import React from 'react';
import { Row, Col } from 'antd';
import { GiftTwoTone, DollarOutlined } from "@ant-design/icons";
import SkuView, { PriceView } from './SkuView';

const ProductSumary = ({ data }) => {
  return (
    <div className="lead__info">
      <div style={{ height: 10 }}></div>
      <p><strong>Thông tin sản phẩm</strong></p>
      <div className="line-dash"></div>
      <Row gutter={24} style={{ marginTop: 10 }}>
        <Col span={12}>
          <p>Sản phẩm: {data?.name}</p>
        </Col>
        <Col span={12}>
          <p>Mã S/P: {data?.code}</p>
        </Col>
      </Row>
      <Row gutter={24} style={{ marginTop: 10 }}>
        <Col span={12}>
          <p><GiftTwoTone style={{ fontSize: 20 }} /> SKUS</p>
          <SkuView skus={data?.skus ?? []} />
        </Col>
        <Col span={12}>
          <p><DollarOutlined style={{ fontSize: 20 }} /> Giá bán</p>
          <PriceView skus={data?.skus ?? []} />
        </Col>
      </Row>
    </div>
  )
}

export default ProductSumary;