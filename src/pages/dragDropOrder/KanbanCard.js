/**************************************************************************/
/*  KanbanCard.js                                                         */
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
import { Tag, Tooltip } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { formatMoney, formatTime } from 'utils/dataUtils';
import { ShowSkuDetail } from 'containers/Product/SkuView';
import {
  KanbanCardWrapper,
  TitleWrapper,
  Title,
  NoteIcon,
  Description,
  MetaInfo,
  TagsContainer,
  DateText,
  AssigneeAvatar,
  getInitials
} from 'css/cardStyle';

const KanbanCard = ({
  code,
  skuInfo,
  productName,
  total,
  updatedAt,
  order
}) => {
  return (
    <KanbanCardWrapper>
      <TitleWrapper>
        <Title ellipsis={{ tooltip: 'Ghi chú đơn hàng' }} style={{ whiteSpace: 'wrap' }}>
          {String(order?.customerReceiverName).concat(" (").concat(order?.customerMobilePhone).concat(")")}
        </Title>
        <Tooltip title="Ghi chú đơn hàng">
          <NoteIcon />
        </Tooltip>
      </TitleWrapper>
      <Description ellipsis={false}>
        <p>{String(code).concat(" (").concat(productName).concat(")")} </p>
        <ShowSkuDetail skuInfo={skuInfo} width={250} />
      </Description>
      <MetaInfo>
        <TagsContainer>
          <Tag icon={<ClockCircleOutlined />} color="default" style={{ fontSize: '12px', padding: '0 8px' }}>
            {formatMoney(total)}
          </Tag>
          <DateText>📅 {formatTime(updatedAt)}</DateText>
        </TagsContainer>
        <AssigneeAvatar>
          {getInitials(order?.customerReceiverName ?? '')}
        </AssigneeAvatar>
      </MetaInfo>
    </KanbanCardWrapper>
  )
};

export default KanbanCard;