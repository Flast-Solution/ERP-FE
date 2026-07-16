import React from 'react'
import { Button, Empty, Spin, Tag } from 'antd'
import { FormOutlined } from '@ant-design/icons'

import { isSameStepRef } from '../workflowHelpers'
import {
  RemoteFormBoundary,
  RemoteFormErrorFallback,
  RemoteFormHost,
} from '../RemoteForm'
import { InspectionResultList } from '../InspectionResults'

const WorkflowFormSection = ({
  order,
  selectedLot,
  displayStep,
  displayForm,
  displaySubmission,
  displaySubmissionValues,
  inspectionResults,
  viewingStepCode,
  isReviewingSubmission,
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
        </div>
        {isReviewingSubmission ? (
          <Button type="link" onClick={onBack}>
            Quay lại bước hiện tại
          </Button>
        ) : null}
      </div>

      {isReviewingSubmission && !displaySubmission && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bước này chưa có dữ liệu đã gửi" />
      )}
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
              allowSubmit={!isReviewingSubmission}
              order={order}
              record={order}
              data={order}
              step={displayStep}
              formTemplate={displayForm}
              submission={displaySubmission}
              initialValues={displaySubmissionValues}
              values={displaySubmissionValues}
              defaultValues={displaySubmissionValues}
              readOnly={isReviewingSubmission}
              disabled={isReviewingSubmission}
              canSubmit={!isReviewingSubmission}
              showSubmit={!isReviewingSubmission}
              hideSubmit={isReviewingSubmission}
              submitDisabled={isReviewingSubmission}
              hideTitle
              showTitle={false}
              onSubmit={isReviewingSubmission ? undefined : handleRemoteFormSubmit}
              onSubmitError={isReviewingSubmission ? undefined : handleRemoteFormSubmitError}
            />
          </RemoteFormBoundary>
        </div>
      )}
      {remoteEntry && RemoteForm && !isReviewingSubmission ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button
            type="primary"
            loading={submittingForm}
            disabled={loadingRemote || Boolean(remoteError)}
            onClick={submitCurrentForm}
          >
            Cập nhật
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default WorkflowFormSection
