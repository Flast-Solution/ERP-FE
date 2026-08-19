import React from 'react';
import { EditOutlined, LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { Empty, Spin } from 'antd';
import { Helmet } from 'react-helmet';
import { KPI_PAGE_TITLE } from '../constants';
import { BackButton, DetailAddButton, DetailAvatar, DetailBreadcrumb, DetailContent, DetailName, DetailPage, EditButton, EmployeeSummary, IndicatorActions, IndicatorCard, IndicatorCode, IndicatorDescription, IndicatorHeading, IndicatorList, IndicatorMetrics, IndicatorTitleLine, IndicatorTop, IndicatorWeight, MetaSeparator, Metric, MetricLabel, MetricValue, OverallProgress, SummaryMain, SummaryMeta } from './EmployeeKpiDetail.styles';

const EmployeeKpiDetail = ({ employee, indicators = [], loading, period, onBack, onAdd, onEdit }) => {
  return (
    <DetailPage>
      <Helmet>
        <title>{employee.fullName} | {KPI_PAGE_TITLE}</title>
      </Helmet>

      <DetailBreadcrumb>
        <span>Hệ thống</span><RightOutlined />
        <span>Nhân sự</span><RightOutlined />
        <span>Bảng KPI</span><RightOutlined />
        <strong>{employee.fullName}</strong>
      </DetailBreadcrumb>

      <DetailContent>
        <BackButton type="text" icon={<LeftOutlined />} onClick={onBack}>
          Về danh sách
        </BackButton>

        <EmployeeSummary>
          <DetailAvatar>{employee.initials}</DetailAvatar>
          <SummaryMain>
            <DetailName>{employee.fullName}</DetailName>
            <SummaryMeta>
              <span>{employee.ssoId || '-'}</span>
              <MetaSeparator>·</MetaSeparator>
              <span>{employee.email || '-'}</span>
              <MetaSeparator>·</MetaSeparator>
              <span>{period.evaluation}</span>
            </SummaryMeta>
          </SummaryMain>
          <OverallProgress>
            <strong>{employee.indicatorCount}</strong>
            <span>chỉ tiêu KPI</span>
          </OverallProgress>
        </EmployeeSummary>

        <IndicatorHeading>
          <h2>Chỉ tiêu kỳ này</h2>
          <DetailAddButton icon={<PlusOutlined />} onClick={onAdd}>
            Thêm chỉ tiêu
          </DetailAddButton>
        </IndicatorHeading>

        <IndicatorList>
          {loading && <Spin />}
          {!loading && !indicators.length && (
            <Empty description="Chưa có chỉ tiêu KPI" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
          {!loading && indicators.map((indicator) => (
              <IndicatorCard key={indicator.id}>
                <IndicatorTop>
                  <div>
                    <IndicatorTitleLine>
                      <h3>{indicator.name}</h3>
                      <IndicatorCode>{indicator.code}</IndicatorCode>
                    </IndicatorTitleLine>
                    <IndicatorWeight>Trọng số {indicator.weight}% trong đánh giá kỳ này</IndicatorWeight>
                  </div>
                  <IndicatorActions>
                    <IndicatorCode>{indicator.type}</IndicatorCode>
                    <EditButton
                      type="text"
                      aria-label={`Sửa ${indicator.name}`}
                      icon={<EditOutlined />}
                      onClick={() => onEdit(indicator)}
                    />
                  </IndicatorActions>
                </IndicatorTop>

                <IndicatorMetrics>
                  <Metric>
                    <MetricLabel>Mục tiêu</MetricLabel>
                    <MetricValue>{indicator.target}</MetricValue>
                  </Metric>
                  <Metric>
                    <MetricLabel>Hướng mục tiêu</MetricLabel>
                    <MetricValue>{indicator.targetDirection}</MetricValue>
                  </Metric>
                  <Metric>
                    <MetricLabel>Đơn vị đo</MetricLabel>
                    <MetricValue>{indicator.unit}</MetricValue>
                  </Metric>
                </IndicatorMetrics>

                <IndicatorDescription>{indicator.description}</IndicatorDescription>
              </IndicatorCard>
          ))}
        </IndicatorList>
      </DetailContent>
    </DetailPage>
  );
};


export default EmployeeKpiDetail;
