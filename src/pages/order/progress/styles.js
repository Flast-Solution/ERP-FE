export const workflowProgressPageStyles = `
          @media (min-width: 992px) {
            .workflow-progress-main-col {
              flex: 0 0 calc(100% - 384px) !important;
              max-width: calc(100% - 384px) !important;
            }

            .workflow-progress-side-col {
              flex: 0 0 384px !important;
              max-width: 384px !important;
            }
          }

          @media (max-width: 991px) {
            .workflow-progress-main-col,
            .workflow-progress-side-col {
              flex: 0 0 100% !important;
              max-width: 100% !important;
            }

            .workflow-progress-fixed-panel {
              position: static !important;
              width: 100% !important;
              max-width: none !important;
              min-width: 0 !important;
              max-height: none !important;
              overflow-y: visible !important;
            }
          }

          .workflow-progress-layout {
            display: flex;
            align-items: flex-start;
            width: 100%;
          }

          .workflow-progress-content-panel {
            width: 100%;
            padding: 18px 20px;
            border: 1px solid #e5e7eb;
            border-right: 0;
            border-radius: 8px 0 0 8px;
            background: #fff;
          }

          .workflow-progress-fixed-panel .ant-card {
            width: 100%;
            min-height: 100%;
            height: 100%;
            border-left: 1px solid #e5e7eb;
            border-radius: 0 8px 8px 0 !important;
            box-shadow: none !important;
          }

          .workflow-progress-section {
            padding: 0;
          }

          .workflow-progress-section + .workflow-progress-section {
            margin-top: 22px;
            padding-top: 22px;
            border-top: 1px solid #f0f2f5;
          }

          .workflow-progress-section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 14px;
            color: #111827;
            font-size: 15px;
            font-weight: 700;
          }

          .workflow-progress-section-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }

          .workflow-progress-section-head .workflow-progress-section-title {
            margin-bottom: 0;
          }

          .workflow-progress-content-panel .ant-card {
            border: 0;
            box-shadow: none;
          }

          .workflow-progress-content-panel .ant-card-head {
            min-height: 0;
            padding: 0;
            border-bottom: 0;
          }

          .workflow-progress-content-panel .ant-card-body {
            padding: 0;
          }

          .workflow-progress-content-panel .ant-table-wrapper .ant-table {
            border-radius: 4px;
          }

          .workflow-progress-customer-info .ant-descriptions-item-container {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
          }

          .workflow-progress-customer-info .ant-descriptions-item-label {
            flex: 0 0 auto;
            color: #6b7280;
          }

          .workflow-progress-customer-info .ant-descriptions-item-content {
            flex: 1 1 auto;
            justify-content: flex-end;
            min-width: 0;
            color: #111827;
            font-weight: 600;
            text-align: right;
          }
        `
