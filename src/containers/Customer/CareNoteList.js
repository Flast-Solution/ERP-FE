/**************************************************************************/
/*  CareNoteList.js                                                    */
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

import React, { useState } from 'react';
import { Card, Row, Col, Tag, Flex, Typography, Divider, Space, Popover } from 'antd';
import { StarOutlined, SmileOutlined, FlagOutlined, EditOutlined } from '@ant-design/icons';
import { useEffectAsync } from 'hooks/MyHooks';
import RequestUtils from 'utils/RequestUtils';
import { arrayEmpty } from 'utils/dataUtils';

const { Text, Paragraph } = Typography;
const GetIssueLabels = (issues) => {
  if(arrayEmpty(issues)) {
    return "(Chưa xác định)";
  }
  const map = {
    product: "Sản phẩm",
    service: "Dịch vụ"
  };
  const labels = issues.map(i => map[i]).filter(Boolean);
  return labels.join(", ");
};

const getPriorityTag = (priority) => {
  const colorMap = {
    cao: "red",
    trung_binh: "orange",
    thap: "green"
  };
  return <Tag color={colorMap[priority]}>{priority === 'cao' ? 'Cao' : priority === 'trungbinh' ? 'Trung bình' : 'Thấp'}</Tag>;
};

const CustomerCareNoteCard = ({ note }) => {
  return (
    <div style={{ marginBottom: 16, backgroundColor: '#fff' }}>
      <Row gutter={[16, 8]} style={{ marginBottom: 12 }}>
        <Col span={8}>
          <Row align="middle">
            <Col span={2}>
              <StarOutlined style={{ color: '#faad14', fontSize: '16px' }} />
            </Col>
            <Col span={22}>
              <Text strong>Đánh giá:</Text> <Text>{note.rating}/10</Text>
              {note.satisfactionPercent && (
                <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
                  {note.satisfactionPercent} % hài lòng
                </Text>
              )}
            </Col>
          </Row>
        </Col>
        <Col span={8}>
          <Row align="middle">
            <Col span={2}>
              <FlagOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
            </Col>
            <Col span={22}>
              <Text strong>Ưu tiên:</Text> {getPriorityTag(note.priority)}
              {note.issues?.length > 0 && (
                <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
                  Yêu cầu: {GetIssueLabels(note.issues)}
                </Text>
              )}
            </Col>
          </Row>
        </Col>
        <Col span={8}>
          <Flex justify="space-between" align="start">
            <div>
              <Space gap={4}>
                <StarOutlined style={{ color: '#faad14', fontSize: '16px' }} />
                <Text strong>Lý do: {note.cause}</Text>
              </Space>
              <br />
              <Text>{note.title}</Text>
            </div>
            <Space gap={8} style={{ marginTop: 4 }}>
              <Popover
                content={
                  <div style={{ maxWidth: 300 }}>
                    <Text strong>Tính năng mới:</Text>
                    <Paragraph style={{ marginTop: 4, marginBottom: 0 }} type="secondary">
                      {note.newFeatures}
                    </Paragraph>
                  </div>
                }
                title=""
                trigger="click"
              >
                <span style={{ cursor: 'pointer', color: '#52c41a', marginRight: 8 }}>
                  <SmileOutlined style={{ fontSize: '16px' }} />
                </span>
              </Popover>
              <Popover
                content={
                  <div style={{ maxWidth: 300 }}>
                    <Text strong>Hỗ trợ:</Text>
                    <Paragraph style={{ marginTop: 4, marginBottom: 0 }} type="secondary">
                      {note.supportRequest}
                    </Paragraph>
                  </div>
                }
                title=""
                trigger="click"
              >
                <span style={{ cursor: 'pointer', color: '#722ed1' }}>
                  <EditOutlined style={{ fontSize: '16px' }} />
                </span>
              </Popover>
            </Space>
          </Flex>
        </Col>
      </Row>
      <Row gutter={[12, 8]} align="top" style={{ marginBottom: 12 }}>
        <Col span={24}>
          <Paragraph style={{ marginBottom: 0 }} type="secondary">
            {note.action}
          </Paragraph>
        </Col>
      </Row>
      <Divider dashed style={{ margin: '8px 0' }} />
    </div>
  )
};

const GenerateCareData = (note) => {
  const { information, ...rest } = note;
  return { ...rest, ...information };
}

const CareNoteList = ({ customerId }) => {

  const [ customerCareNotes, setCustomerCareNotes ] = useState([]);
  useEffectAsync(async () => {
    if (!customerId) {
      return;
    }
    const cares = await RequestUtils.GetAsList("/cs/fetch", { customerId, asList: true });
    setCustomerCareNotes(cares);
  }, [customerId]);

  return (
    <Card
      title="Nhật ký chăm sóc khách hàng"
      style={{
        margin: '20px auto',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      {arrayEmpty(customerCareNotes) && (
        <Text type="secondary">Chưa có nhật ký chăm sóc khách hàng được ghi nhận.</Text>
      )}
      <div style={{ maxHeight: 600, overflowY: 'auto', overflowX: 'hidden' }}>
        {customerCareNotes.map((note) => (
          <CustomerCareNoteCard key={note.id} note={GenerateCareData(note)} />
        ))}
      </div>
    </Card>
  )
};

export default CareNoteList;
