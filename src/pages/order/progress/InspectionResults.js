import React, { useState } from 'react'
import { Button, Empty, Space, Typography } from 'antd'
import dayjs from 'dayjs'

const { Text } = Typography

const INSPECTION_STATUS_STYLES = {
  pass: { accent: '#16a34a', pillBg: '#dcfce7', pillText: '#15803d', dot: '#16a34a', label: 'Đạt' },
  fail: { accent: '#dc2626', pillBg: '#fee2e2', pillText: '#b91c1c', dot: '#dc2626', label: 'Không đạt' },
  pending: { accent: '#f59e0b', pillBg: '#f1f5f9', pillText: '#64748b', dot: '#94a3b8', label: 'Chưa có kết quả' },
}

const InspectionStatusPill = ({ status, label }) => {
  const style = INSPECTION_STATUS_STYLES[status] ?? INSPECTION_STATUS_STYLES.pending
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 12px',
        borderRadius: 999,
        background: style.pillBg,
        color: style.pillText,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: style.dot }} />
      {label ?? style.label}
    </span>
  )
}

const InspectionResultDot = ({ pass }) => {
  const color = pass === true ? '#16a34a' : pass === false ? '#dc2626' : '#cbd5e1'
  const background = pass === true ? '#dcfce7' : pass === false ? '#fee2e2' : '#fff'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        background,
        color,
        fontSize: 11,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      {pass === true ? '✓' : pass === false ? '✕' : ''}
    </span>
  )
}

const InspectionResultCard = ({ item, index, defaultExpanded = true, onOpenForm }) => {
  const style = INSPECTION_STATUS_STYLES[item?.status] ?? INSPECTION_STATUS_STYLES.pending
  const accentColor = item?.processTypeColor || style.accent
  const hasRows = item?.rows?.length > 0
  const [expanded, setExpanded] = useState(defaultExpanded)
  const toggle = () => setExpanded((value) => !value)

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 12,
        border: '1px solid #eef1f5',
        borderLeft: `4px solid ${accentColor}`,
        background: '#fff',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggle()
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          padding: '14px 18px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
            {item?.stepName ?? item?.name ?? `Kết quả ${index + 1}`}
          </span>
          {item?.standard && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                background: '#f1f5f9',
                color: '#475569',
                fontSize: 12,
                fontFamily: 'monospace',
              }}
            >
              {item.standard}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 13 }}>
          {item?.submittedName && <span>KTV. {item.submittedName}</span>}
          {item?.submittedName && <span>·</span>}
          {item?.executionState !== 'current' && item?.submittedAt && (
            <span>{dayjs(item.submittedAt).format('DD/MM HH:mm')}</span>
          )}
          {item?.executionState !== 'current' && item?.submittedAt && <span>·</span>}
          {item?.executionLabel && <span>{item.executionLabel}</span>}
          <InspectionStatusPill status={item?.status} label={item?.statusName} />
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              color: '#64748b',
              fontSize: 12,
              transition: 'transform 0.15s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {expanded && hasRows && (
        <div style={{ padding: '0 18px 16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 130px 120px 44px',
              gap: 12,
              padding: '10px 0',
              borderTop: '1px solid #f1f5f9',
              color: '#94a3b8',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            <span>Chỉ tiêu</span>
            <span style={{ textAlign: 'center' }}>Giá trị đo</span>
            <span style={{ textAlign: 'right' }}>Yêu cầu</span>
            <span style={{ textAlign: 'center' }}>KQ</span>
          </div>

          {item.rows.map((row) => (
            <div
              key={row.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 130px 120px 44px',
                gap: 12,
                alignItems: 'center',
                padding: '10px 0',
                borderTop: '1px solid #f6f8fb',
                fontSize: 14,
              }}
            >
              <span style={{ color: '#334155' }}>{row.label}</span>
              <span style={{ textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>{row.displayValue}</span>
              <span style={{ textAlign: 'right', color: '#64748b' }}>{row.requirement || '—'}</span>
              <span style={{ display: 'flex', justifyContent: 'center' }}>
                <InspectionResultDot pass={row.resultPass} />
              </span>
            </div>
          ))}
        </div>
      )}

      {expanded && !item?.hasSubmission && (
        <div style={{ padding: '0 18px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              padding: '14px 16px',
              borderRadius: 10,
              border: '1px dashed #e2e8f0',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
              <span
                style={{
                  flex: '0 0 auto',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: '2px solid #cbd5e1',
                  marginTop: 2,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#334155', marginBottom: 2 }}>
                  Chưa nhập kết quả thử
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  KTV cần điền form <em>{item?.formName ?? item?.stepName}</em> để ghi nhận kết quả kiểm tra.
                </Text>
              </div>
            </div>
            {onOpenForm && item?.canOpenForm && (
              <Button
                onClick={(event) => {
                  event.stopPropagation()
                  onOpenForm(item)
                }}
              >
                Mở form nhập
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const InspectionResultList = ({ data, defaultExpanded = true, onOpenForm }) => {
  if (!data.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kết quả kiểm tra" />
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {data.map((item, index) => (
        <InspectionResultCard
          key={item?.id ?? item?.stepCode ?? index}
          item={item}
          index={index}
          defaultExpanded={item?.defaultExpanded ?? defaultExpanded}
          onOpenForm={onOpenForm}
        />
      ))}
    </Space>
  )
}

export const InspectionSummary = ({ data }) => {
  const passCount = data.filter((item) => item?.status === 'pass').length
  const failCount = data.filter((item) => item?.status === 'fail').length
  const pendingCount = data.filter((item) => item?.status === 'pending').length

  return (
    <Text type="secondary" style={{ fontSize: 13 }}>
      {passCount} đạt · {failCount} không đạt · {pendingCount} chưa xong
    </Text>
  )
}
