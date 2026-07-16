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

          .workflow-history-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 22px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e7eb;
          }

          .workflow-history-title {
            color: #111827;
            font-size: 20px;
            font-weight: 700;
            line-height: 1.4;
          }

          .workflow-history-count {
            flex: 0 0 auto;
            color: #4b5563;
            font-size: 16px;
          }

          .workflow-history-list {
            width: 100%;
          }

          .workflow-history-item {
            position: relative;
            padding: 0 0 26px 34px;
          }

          .workflow-history-item::before {
            position: absolute;
            top: 11px;
            bottom: -11px;
            left: 7px;
            width: 1px;
            background: #dbe2ea;
            content: '';
          }

          .workflow-history-item.is-last {
            padding-bottom: 0;
          }

          .workflow-history-item.is-last::before {
            display: none;
          }

          .workflow-history-dot {
            position: absolute;
            z-index: 1;
            top: 7px;
            left: 0;
            width: 15px;
            height: 15px;
            border: 3px solid #fff;
            border-radius: 50%;
            background: #2f5be7;
            box-sizing: content-box;
          }

          .workflow-history-dot.is-error {
            background: #ef4444;
          }

          .workflow-history-transition {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
          }

          .workflow-history-step-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-height: 30px;
            padding: 3px 12px;
            border: 1px solid #b8d1ff;
            border-radius: 999px;
            background: #eaf3ff;
            color: #2457d6;
            font-size: 15px;
            font-weight: 500;
            line-height: 22px;
          }

          .workflow-history-step-bullet {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #3367db;
          }

          .workflow-history-arrow {
            color: #94a3b8;
            font-size: 13px;
          }

          .workflow-history-meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
            color: #6b7280;
            font-size: 14px;
          }

          .workflow-history-meta-separator {
            color: #9ca3af;
          }

          .workflow-history-note {
            margin-top: 12px;
            padding: 11px 14px;
            border-left: 3px solid #cbd5e1;
            border-radius: 5px;
            background: #f6f7f9;
            color: #172033;
            font-size: 15px;
            line-height: 1.5;
          }

          .workflow-history-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
          }

          .workflow-history-action {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 4px 12px;
            border: 1px solid #a7efc2;
            border-radius: 999px;
            background: #dcfce7;
            color: #15803d;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 13px;
          }

          @media (max-width: 575px) {
            .workflow-history-title {
              font-size: 18px;
            }

            .workflow-history-item {
              padding-left: 28px;
            }

            .workflow-history-note {
              font-size: 14px;
            }
          }
        `
