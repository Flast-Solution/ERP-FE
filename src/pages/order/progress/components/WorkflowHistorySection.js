import React from 'react'
import { HistoryOutlined } from '@ant-design/icons'

import { HistoryList } from '../HistoryList'

const WorkflowHistorySection = ({ data }) => (
  <div className="workflow-progress-section">
    <div className="workflow-history-header">
      <div className="workflow-history-title">
        <HistoryOutlined className="workflow-progress-section-icon" />
        <span>Lịch sử chuyển bước</span>
      </div>
      <div className="workflow-history-count">{data.length} mục</div>
    </div>
    <HistoryList data={data} />
  </div>
)

export default WorkflowHistorySection
