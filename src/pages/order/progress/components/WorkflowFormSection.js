import React from 'react'
import { Button, Empty, Spin, Tag } from 'antd'
import { FormOutlined } from '@ant-design/icons'

import { getStepSubmitButtonConfig, isSameStepRef } from '../workflowHelpers'
import {
  RemoteFormBoundary,
  RemoteFormErrorFallback,
  RemoteFormHost,
} from '../RemoteForm'
import { InspectionResultList } from '../InspectionResults'

const WorkflowFormSection = ({
  bare = false,
  order,
  selectedLot,
  workflowEntity,
  workflowInstance,
  displayStep,
  displayForm,
  displaySubmission,
  displaySubmissionValues,
  inspectionResults,
  viewingStepCode,
  isReviewingSubmission,
  isAuxiliaryStep,
  submitButtonConfig,
  onBack,
  formState,
}) => {
  const {
    remoteFormRef,
    remoteFormContainerRef,
    currentFormName,
    remoteEntry,
    remoteRenderKey,
    RemoteForm,
    loadingRemote,
    remoteError,
    submittingForm,
    handleRemoteFormSubmit,
    handleRemoteFormSubmitError,
    submitCurrentForm,
  } = formState
  const submitButton = submitButtonConfig ?? getStepSubmitButtonConfig(displayStep)
  const canSubmitForm = !isReviewingSubmission && submitButton.visible
  const submitStyle = String(submitButton.style ?? 'PRIMARY').toUpperCase()

  const remoteFormContent = (
    <>
      {!remoteEntry && !isReviewingSubmission && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bước hiện tại chưa có remoteEntry form" />
      )}
      {!remoteEntry && isReviewingSubmission && displaySubmission && (
        <InspectionResultList
          data={inspectionResults.filter((item) => isSameStepRef(item?.stepCode, viewingStepCode))}
        />
      )}
      {remoteEntry && loadingRemote && <Spin />}
      {remoteEntry && remoteError && <RemoteFormErrorFallback message={remoteError} />}
      {remoteEntry && RemoteForm && (
        <div ref={remoteFormContainerRef}>
          <RemoteFormBoundary key={remoteRenderKey} remoteKey={remoteRenderKey}>
            <RemoteFormHost
              key={remoteRenderKey}
              ref={isReviewingSubmission ? undefined : remoteFormRef}
              Component={RemoteForm}
              allowSubmit={canSubmitForm}
              order={order}
              record={order}
              data={order}
              lot={selectedLot}
              entity={workflowEntity}
              entityType={workflowEntity?.entityType}
              entityId={workflowEntity?.entityId}
              workflowInstance={workflowInstance}
              workflowInstanceId={workflowInstance?.id}
              step={displayStep}
              formTemplate={displayForm}
              submission={displaySubmission}
              initialValues={displaySubmissionValues}
              values={displaySubmissionValues}
              defaultValues={displaySubmissionValues}
              readOnly={isReviewingSubmission}
              disabled={isReviewingSubmission}
              canSubmit={canSubmitForm}
              showSubmit={canSubmitForm}
              hideSubmit={!canSubmitForm}
              submitDisabled={!canSubmitForm}
              submitLabel={submitButton.label}
              submitText={submitButton.label}
              submitButtonText={submitButton.label}
              hideTitle
              showTitle={false}
              onSubmit={isReviewingSubmission ? undefined : handleRemoteFormSubmit}
              onSubmitError={isReviewingSubmission ? undefined : handleRemoteFormSubmitError}
            />
          </RemoteFormBoundary>
        </div>
      )}
    </>
  )

  if (bare) {
    return remoteFormContent
  }

  return (
    <div className="workflow-progress-section">
      <div className="workflow-progress-section-head">
        <div className="workflow-progress-section-title">
          <FormOutlined className="workflow-progress-section-icon" />
          <span>
            {currentFormName || 'Form bắt buộc tại bước'}
            {selectedLot?.code ? ` - Lô ${selectedLot.code}` : ''}
          </span>
          {isReviewingSubmission && (
            <Tag color="blue">Đang xem lại</Tag>
          )}
          {isAuxiliaryStep && (
            <Tag color="purple">Bước ẩn</Tag>
          )}
        </div>
        {isReviewingSubmission || isAuxiliaryStep ? (
          <Button type="link" onClick={onBack}>
            Quay lại bước hiện tại
          </Button>
        ) : null}
      </div>

      {isReviewingSubmission && !displaySubmission && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bước này chưa có dữ liệu đã gửi" />
      )}
      {remoteFormContent}
      {remoteEntry && RemoteForm && canSubmitForm ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button
            type={submitStyle === 'PRIMARY' ? 'primary' : 'default'}
            danger={submitStyle === 'DANGER'}
            loading={submittingForm}
            disabled={loadingRemote || Boolean(remoteError)}
            onClick={submitCurrentForm}
          >
            {submitButton.label}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default WorkflowFormSection
