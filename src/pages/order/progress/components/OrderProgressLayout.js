import React from 'react'
import { Breadcrumb, Col, Row, Spin } from 'antd'
import { Helmet } from 'react-helmet'

import { workflowFixedPanelStyle } from '../constants'
import { workflowProgressPageStyles } from '../styles'
import { WorkflowProgressPanel } from '../WorkflowPanel'
import CustomerInfoSection from './CustomerInfoSection'
import OrderInfoSection from './OrderInfoSection'
import OrderLotsSection from './OrderLotsSection'
import WorkflowFormSection from './WorkflowFormSection'
import InspectionSection from './InspectionSection'
import WorkflowHistorySection from './WorkflowHistorySection'

const OrderProgressLayout = ({
  orderState,
  lotState,
  workflowState,
  submissionState,
  formState,
}) => {
  const { order, loadingOrder } = orderState
  const {
    lots,
    selectedLot,
    loadingLots,
    selectLot,
  } = lotState
  const {
    workflow,
    steps,
    currentStep,
    currentStepCode,
    displayStep,
    histories,
    processTypeLabelMap,
    stepTransitionOptions,
    selectedToStepCode,
    setSelectedToStepCode,
    viewingStepCode,
    isReviewingSubmission,
    reviewStep,
    reviewInspectionResult,
    backToCurrentStep,
    transitioning,
    advanceWorkflow,
    loadingPreview,
  } = workflowState
  const {
    submissions,
    currentForm,
    displayForm,
    currentSubmission,
    displaySubmission,
    displaySubmissionValues,
    inspectionResults,
    completedRefs,
    submittedRefs,
    hasCurrentSubmission,
  } = submissionState

  return (
    <>
      <Helmet>
        <title>Tiến trình workflow đơn hàng</title>
      </Helmet>
      <style>{workflowProgressPageStyles}</style>
      <Breadcrumb
        style={{ marginBottom: 10 }}
        items={[
          { title: 'Trang chủ' },
          { title: 'Đơn hàng' },
          { title: 'Tiến trình workflow' },
        ]}
      />

      <Spin spinning={loadingOrder || loadingPreview}>
        <div style={{ paddingBottom: 24 }}>
          <Row gutter={0} align="top" className="workflow-progress-layout">
            <Col xs={24} lg={16} className="workflow-progress-main-col">
              <div className="workflow-progress-content-panel">
                <div className="workflow-progress-section">
                  <Row gutter={16}>
                    <Col xs={24} lg={12}>
                      <CustomerInfoSection order={order} />
                    </Col>
                    <Col xs={24} lg={12}>
                      <OrderInfoSection order={order} />
                    </Col>
                  </Row>
                </div>

                <OrderLotsSection
                  lots={lots}
                  selectedLot={selectedLot}
                  loading={loadingLots}
                  onSelect={selectLot}
                />

                <WorkflowFormSection
                  order={order}
                  selectedLot={selectedLot}
                  displayStep={displayStep}
                  displayForm={displayForm}
                  displaySubmission={displaySubmission}
                  displaySubmissionValues={displaySubmissionValues}
                  inspectionResults={inspectionResults}
                  viewingStepCode={viewingStepCode}
                  isReviewingSubmission={isReviewingSubmission}
                  onBack={backToCurrentStep}
                  formState={formState}
                />

                <InspectionSection
                  data={inspectionResults}
                  onOpenForm={reviewInspectionResult}
                />

                <WorkflowHistorySection data={histories} />
              </div>
            </Col>

            <Col xs={24} lg={8} className="workflow-progress-side-col">
              <div
                className="workflow-progress-fixed-panel"
                style={workflowFixedPanelStyle}
              >
                <WorkflowProgressPanel
                  workflow={workflow}
                  steps={steps}
                  currentStep={currentStep}
                  currentStepCode={currentStepCode}
                  processTypeLabelMap={processTypeLabelMap}
                  completedRefs={completedRefs}
                  submittedRefs={submittedRefs}
                  submissions={submissions}
                  selectedStepCode={viewingStepCode}
                  onStepClick={reviewStep}
                  currentForm={currentForm}
                  hasCurrentSubmission={hasCurrentSubmission}
                  transitioning={transitioning}
                  onAdvance={() => advanceWorkflow({
                    currentSubmission,
                    currentForm,
                  })}
                  transitionOptions={stepTransitionOptions}
                  selectedToStepCode={selectedToStepCode}
                  onToStepCodeChange={setSelectedToStepCode}
                />
              </div>
            </Col>
          </Row>
        </div>
      </Spin>
    </>
  )
}

export default OrderProgressLayout
