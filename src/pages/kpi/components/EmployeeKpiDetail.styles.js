import { Button } from 'antd';
import styled from 'styled-components';
import { Avatar, progressColor } from './KpiDashboard.styles';

export const DetailPage = styled.div`
  min-height: 100%;
  margin: -16px -24px -24px;
  background: #f8fafc;
  color: #0f172a;

  @media (max-width: 640px) {
    margin: -12px;
  }
`;

export const DetailBreadcrumb = styled.nav`
  display: flex;
  min-height: 64px;
  align-items: center;
  gap: 14px;
  padding: 0 32px;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  color: #7b8494;
  font-size: 14px;

  .anticon {
    color: #64748b;
    font-size: 10px;
  }

  strong {
    color: #0f172a;
    font-weight: 650;
  }

  @media (max-width: 640px) {
    min-height: 54px;
    gap: 7px;
    padding: 0 16px;
    overflow-x: auto;
    font-size: 12px;
    white-space: nowrap;
  }
`;

export const DetailContent = styled.main`
  padding: 26px 32px 48px;

  @media (max-width: 640px) {
    padding: 18px 14px 32px;
  }
`;

export const BackButton = styled(Button)`
  && {
    height: 36px;
    margin: 0 0 18px;
    padding: 0 10px;
    color: #5f697a;
    font-weight: 600;
  }
`;

export const EmployeeSummary = styled.section`
  display: flex;
  min-height: 146px;
  align-items: center;
  gap: 20px;
  padding: 28px 30px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);

  @media (max-width: 700px) {
    align-items: flex-start;
    flex-wrap: wrap;
    padding: 22px 18px;
  }
`;

export const DetailAvatar = styled(Avatar)`
  width: 64px;
  height: 64px;
  flex-basis: 64px;
  font-size: 20px;
`;

export const SummaryMain = styled.div`
  min-width: 0;
  flex: 1;
`;

export const DetailName = styled.h1`
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 28px;
  font-weight: 750;
  letter-spacing: -0.5px;
`;

export const SummaryMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  color: #64748b;
  font-size: 14px;

  @media (max-width: 700px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }
`;

export const MetaSeparator = styled.span`
  color: #94a3b8;

  @media (max-width: 700px) {
    display: none;
  }
`;

export const OverallProgress = styled.div`
  display: flex;
  min-width: 120px;
  align-items: flex-end;
  flex-direction: column;
  gap: 3px;

  strong {
    color: #0f172a;
    font-size: 28px;
    line-height: 1;
  }

  span {
    color: #7b8494;
    font-size: 13px;
  }

  @media (max-width: 700px) {
    width: 100%;
    align-items: flex-start;
    padding-left: 84px;
  }
`;

export const IndicatorHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 30px 0 18px;

  h2 {
    margin: 0;
    color: #0f172a;
    font-size: 24px;
    font-weight: 750;
    letter-spacing: -0.4px;
  }
`;

export const DetailAddButton = styled(Button)`
  && {
    height: 38px;
    padding: 0 14px;
    border-color: #dce2ea;
    border-radius: 8px;
    box-shadow: none;
    color: #172033;
    font-weight: 600;
  }
`;

export const IndicatorList = styled.section`
  display: grid;
  gap: 18px;
`;

export const IndicatorCard = styled.article`
  padding: 24px 28px 22px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #4f46e5;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025);

  @media (max-width: 640px) {
    padding: 18px 16px;
  }
`;

export const IndicatorTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 12px;
  }
`;

export const IndicatorTitleLine = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  h3 {
    margin: 0;
    color: #172033;
    font-size: 16px;
    font-weight: 700;
  }
`;

export const IndicatorCode = styled.code`
  padding: 2px 8px;
  border: 1px solid #dce2ea;
  border-radius: 5px;
  background: #f8fafc;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
`;

export const IndicatorWeight = styled.p`
  margin: 5px 0 0;
  color: #8a93a3;
  font-size: 13px;
`;

export const IndicatorActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
`;

export const EditButton = styled(Button)`
  && {
    color: #0f172a;
    font-size: 16px;
  }
`;

export const IndicatorProgress = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 22px 0 18px;
`;

export const IndicatorTrack = styled.div`
  height: 8px;
  flex: 1;
  overflow: hidden;
  border-radius: 999px;
  background: #f1f5f9;
`;

export const IndicatorBar = styled.div`
  width: ${({ $width }) => $width}%;
  height: 100%;
  border-radius: inherit;
  background: ${({ $status }) => progressColor[$status]};
`;

export const IndicatorPercent = styled.span`
  min-width: 38px;
  color: #5f697a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  text-align: right;
`;

export const IndicatorMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #edf1f5;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`;

export const Metric = styled.div`
  min-width: 0;
`;

export const MetricLabel = styled.div`
  margin-bottom: 5px;
  color: #8a93a3;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

export const MetricValue = styled.div`
  color: #172033;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 15px;
  font-weight: 650;
`;

export const IndicatorDescription = styled.p`
  margin: 16px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
`;
