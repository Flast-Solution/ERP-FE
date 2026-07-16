import React, { useMemo } from 'react'
import { Empty } from 'antd'
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const formatHistoryTime = (value) => {
  const date = dayjs(value)
  return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : '-'
}

const getActionName = (action) => {
  if (typeof action === 'string') return action
  return action?.actionType
}

export const HistoryList = ({ data }) => {
  const historyItems = useMemo(() => (
    [...data].sort((left, right) => (
      dayjs(right?.createdAt).valueOf() - dayjs(left?.createdAt).valueOf()
    ))
  ), [data])

  if (!data.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu lịch sử chuyển bước từ BE" />
  }

  return (
    <div className="workflow-history-list">
      {historyItems.map((item, index) => {
        const actions = (item?.actionResults ?? []).map(getActionName).filter(Boolean)
        const userName = item?.createdByName ? `KTV. ${item.createdByName}` : 'Hệ thống'

        return (
          <div
            className={`workflow-history-item${index === historyItems.length - 1 ? ' is-last' : ''}`}
            key={item?.id ?? `${item?.fromStepCode}-${item?.toStepCode}-${item?.createdAt}`}
          >
            <span className={`workflow-history-dot${item?.success === false ? ' is-error' : ''}`} />

            <div className="workflow-history-content">
              <div className="workflow-history-transition">
                <span className="workflow-history-step-pill">
                  <span className="workflow-history-step-bullet" />
                  {item?.fromStepName || 'Bước trước'}
                </span>
                <ArrowRightOutlined className="workflow-history-arrow" />
                <span className="workflow-history-step-pill">
                  <span className="workflow-history-step-bullet" />
                  {item?.toStepName || 'Bước tiếp theo'}
                </span>
              </div>

              <div className="workflow-history-meta">
                <UserOutlined />
                <span>{userName}</span>
                <span className="workflow-history-meta-separator">·</span>
                <ClockCircleOutlined />
                <span>{formatHistoryTime(item?.createdAt)}</span>
              </div>

              {item?.note && <div className="workflow-history-note">{item.note}</div>}

              {actions.length > 0 && (
                <div className="workflow-history-actions">
                  {actions.map((action, actionIndex) => (
                    <span className="workflow-history-action" key={`${action}-${actionIndex}`}>
                      <CheckCircleOutlined />
                      {action}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
