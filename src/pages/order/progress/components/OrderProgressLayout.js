import React from 'react'
import { Breadcrumb, Col, Empty, Row, Spin } from 'antd'
import { Helmet } from 'react-helmet'

import { workflowFixedPanelStyle } from '../constants'
import { workflowProgressPageStyles } from '../styles'
import { WorkflowProgressPanel } from '../WorkflowPanel'
import CustomerInfoSection from './CustomerInfoSection'
import OrderInfoSection from './OrderInfoSection'
import OrderLotsSection from './OrderLotsSection'
import WorkflowContextSection from './WorkflowContextSection'
import WorkflowFormSection from './WorkflowFormSection'
import InspectionSection from './InspectionSection'
import WorkflowHistorySection from './WorkflowHistorySection'

const OrderProgressLayout = ({
  orderState,
  lotState,
  workflowEntity,
  orderWorkflowState,
  onSelectLot,
  onSelectOrder,
  onOpenNcr,
  workflowState,
  submissionState,
  formState,
}) => {
  const { order, loadingOrder } = orderState
  const {
    lots,
    selectedLot,
    loadingLots,
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
    openedHiddenStepCode,
    currentStepButtons,
    openHiddenStep,
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

                <WorkflowContextSection
                  order={order}
                  selectedLot={selectedLot}
                  workflowInstances={orderWorkflowState.workflowInstances}
                  selectedInstanceId={orderWorkflowState.selectedInstanceId}
                  loading={orderWorkflowState.loadingWorkflowInstance}
                  onSelectOrder={onSelectOrder}
                  onSelectWorkflow={orderWorkflowState.selectWorkflowInstance}
                />

                <OrderLotsSection
                  lots={lots}
                  selectedLot={selectedLot}
                  loading={loadingLots}
                  onSelect={onSelectLot}
                  onOpenNcr={onOpenNcr}
                />

                {orderWorkflowState.workflowInstance ? (
                  <>
                    <WorkflowFormSection
                      order={order}
                      selectedLot={selectedLot}
                      workflowEntity={workflowEntity}
                      workflowInstance={orderWorkflowState.workflowInstance}
                      displayStep={displayStep}
                      displayForm={displayForm}
                      displaySubmission={displaySubmission}
                      displaySubmissionValues={displaySubmissionValues}
                      inspectionResults={inspectionResults}
                      viewingStepCode={viewingStepCode}
                      isReviewingSubmission={isReviewingSubmission}
                      isAuxiliaryStep={Boolean(openedHiddenStepCode)}
                      onBack={backToCurrentStep}
                      formState={formState}
                    />

                    <InspectionSection
                      data={inspectionResults}
                      onOpenForm={reviewInspectionResult}
                    />

                    <WorkflowHistorySection data={histories} />
                  </>
                ) : null}
              </div>
            </Col>

            <Col xs={24} lg={8} className="workflow-progress-side-col">
              <div
                className="workflow-progress-fixed-panel"
                style={workflowFixedPanelStyle}
              >
                {orderWorkflowState.workflowInstance ? (
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
                    stepButtons={currentStepButtons}
                    onStepButtonClick={(button) => {
                      if (button?.type === 'OPEN_HIDDEN_STEP') {
                        openHiddenStep(button.targetStepCode)
                        return
                      }
                      advanceWorkflow({
                        currentSubmission,
                        currentForm,
                        toStepCode: button?.targetStepCode,
                        requireSubmission: Boolean(button?.requireSubmission),
                      })
                    }}
                    transitionOptions={stepTransitionOptions}
                    selectedToStepCode={selectedToStepCode}
                    onToStepCodeChange={setSelectedToStepCode}
                  />
                ) : (
                  <div className="workflow-progress-empty-panel">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chọn đối tượng đã được gắn workflow để xem tiến trình"
                    />
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </div>
      </Spin>
    </>
  )
}

export default OrderProgressLayout
