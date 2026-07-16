import React from 'react'

import { HistoryList } from '../HistoryList'

const WorkflowHistorySection = ({ data }) => (
  <div className="workflow-progress-section">
    <div className="workflow-history-header">
      <div className="workflow-history-title">Lịch sử chuyển bước</div>
      <div className="workflow-history-count">{data.length} mục</div>
    </div>
    <HistoryList data={data} />
  </div>
)

export default WorkflowHistorySection
