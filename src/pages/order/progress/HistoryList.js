import React from 'react'
import { Empty, Timeline, Typography } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { formatTime } from '@flast-erp/core/utils'

const { Text } = Typography

export const HistoryList = ({ data }) => {
  if (!data.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu lịch sử chuyển bước từ BE" />
  }

  return (
    <Timeline
      items={data.map((item, index) => ({
        color: item?.success === false ? 'red' : 'green',
        dot: item?.success === false ? <ClockCircleOutlined /> : <CheckCircleOutlined />,
        children: (
          <div key={item?.id ?? index}>
            <div style={{ fontWeight: 600 }}>
              {item?.title ?? `${item?.fromStepName ?? item?.fromStep ?? 'Bước trước'} → ${item?.toStepName ?? item?.toStep ?? item?.stepName ?? 'Bước tiếp theo'}`}
            </div>
            <Text type="secondary">
              {formatTime(item?.createdAt ?? item?.createdDate ?? item?.time) || '-'}
              {item?.createdByName || item?.userName ? ` · ${item?.createdByName ?? item?.userName}` : ''}
            </Text>
            {item?.note && <div>{item.note}</div>}
          </div>
        ),
      }))}
    />
  )
}
