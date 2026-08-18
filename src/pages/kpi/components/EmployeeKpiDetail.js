import React from 'react';
import { EditOutlined, LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { Helmet } from 'react-helmet';
import { MOCK_KPI_DETAILS, STATUS_META, TITLE } from '../mockData';
import { BackButton, DetailAddButton, DetailAvatar, DetailBreadcrumb, DetailContent, DetailName, DetailPage, EditButton, EmployeeSummary, IndicatorActions, IndicatorBar, IndicatorCard, IndicatorCode, IndicatorDescription, IndicatorHeading, IndicatorList, IndicatorMetrics, IndicatorPercent, IndicatorProgress, IndicatorTitleLine, IndicatorTop, IndicatorTrack, IndicatorWeight, MetaSeparator, Metric, MetricLabel, MetricValue, OverallProgress, SummaryMain, SummaryMeta } from './EmployeeKpiDetail.styles';
import { StatusBadge, StatusDot } from './KpiDashboard.styles';

const EmployeeKpiDetail = ({ employee, period, onBack, onAdd, onEdit }) => {
  const employeeStatus = STATUS_META[employee.status];

  return (
    <DetailPage>
      <Helmet>
        <title>{employee.name} | {TITLE}</title>
      </Helmet>

      <DetailBreadcrumb>
        <span>Hệ thống</span><RightOutlined />
        <span>Nhân sự</span><RightOutlined />
        <span>Bảng KPI</span><RightOutlined />
        <strong>{employee.name}</strong>
      </DetailBreadcrumb>

      <DetailContent>
        <BackButton type="text" icon={<LeftOutlined />} onClick={onBack}>
          Về danh sách
        </BackButton>

        <EmployeeSummary>
          <DetailAvatar>{employee.initials}</DetailAvatar>
          <SummaryMain>
            <DetailName>{employee.name}</DetailName>
            <SummaryMeta>
              <span>{employee.role}</span>
              <MetaSeparator>·</MetaSeparator>
              <span>{employee.department}</span>
              <MetaSeparator>·</MetaSeparator>
              <span>{period.evaluation}</span>
            </SummaryMeta>
            <StatusBadge $meta={employeeStatus}>
              <StatusDot />
              {employeeStatus.label}
            </StatusBadge>
          </SummaryMain>
          <OverallProgress>
            <strong>{employee.progress}%</strong>
            <span>tiến độ chung</span>
          </OverallProgress>
        </EmployeeSummary>

        <IndicatorHeading>
          <h2>Chỉ tiêu kỳ này</h2>
          <DetailAddButton icon={<PlusOutlined />} onClick={onAdd}>
            Thêm chỉ tiêu
          </DetailAddButton>
        </IndicatorHeading>

        <IndicatorList>
          {MOCK_KPI_DETAILS.map((indicator) => {
            const status = STATUS_META[indicator.status];
            return (
              <IndicatorCard key={indicator.id} $status={indicator.status}>
                <IndicatorTop>
                  <div>
                    <IndicatorTitleLine>
                      <h3>{indicator.name}</h3>
                      <IndicatorCode>{indicator.code}</IndicatorCode>
                    </IndicatorTitleLine>
                    <IndicatorWeight>Trọng số {indicator.weight}% trong đánh giá kỳ này</IndicatorWeight>
                  </div>
                  <IndicatorActions>
                    <StatusBadge $meta={status}>
                      <StatusDot />
                      {status.label}
                    </StatusBadge>
                    <EditButton
                      type="text"
                      aria-label={`Sửa ${indicator.name}`}
                      icon={<EditOutlined />}
                      onClick={() => onEdit(indicator)}
                    />
                  </IndicatorActions>
                </IndicatorTop>

                <IndicatorProgress>
                  <IndicatorTrack>
                    <IndicatorBar
                      $status={indicator.status}
                      $width={Math.min(indicator.progress, 100)}
                    />
                  </IndicatorTrack>
                  <IndicatorPercent>{indicator.progress}%</IndicatorPercent>
                </IndicatorProgress>

                <IndicatorMetrics>
                  <Metric>
                    <MetricLabel>Mục tiêu</MetricLabel>
                    <MetricValue>{indicator.target}</MetricValue>
                  </Metric>
                  <Metric>
                    <MetricLabel>Kết quả thực tế</MetricLabel>
                    <MetricValue>{indicator.actual}</MetricValue>
                  </Metric>
                  <Metric>
                    <MetricLabel>Đơn vị đo</MetricLabel>
                    <MetricValue>{indicator.unit}</MetricValue>
                  </Metric>
                </IndicatorMetrics>

                <IndicatorDescription>{indicator.description}</IndicatorDescription>
              </IndicatorCard>
            );
          })}
        </IndicatorList>
      </DetailContent>
    </DetailPage>
  );
};


export default EmployeeKpiDetail;
