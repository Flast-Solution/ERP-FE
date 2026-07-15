import React from 'react'

import { HistoryList } from '../HistoryList'

const WorkflowHistorySection = ({ data }) => (
  <div className="workflow-progress-section">
    <div className="workflow-progress-section-title">Lịch sử chuyển bước</div>
    <HistoryList data={data} />
  </div>
)

export default WorkflowHistorySection
