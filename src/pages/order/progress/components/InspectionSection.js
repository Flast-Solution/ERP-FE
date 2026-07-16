import React from 'react'
import { ExperimentOutlined } from '@ant-design/icons'

import { InspectionResultList, InspectionSummary } from '../InspectionResults'

const InspectionSection = ({ data, onOpenForm }) => (
  <div className="workflow-progress-section">
    <div className="workflow-progress-section-title">
      <ExperimentOutlined className="workflow-progress-section-icon" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span>Kết quả kiểm tra</span>
        <InspectionSummary data={data} />
      </div>
    </div>
    <InspectionResultList data={data} onOpenForm={onOpenForm} />
  </div>
)

export default InspectionSection
