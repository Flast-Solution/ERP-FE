import { Button, Input } from 'antd';
import styled from 'styled-components';

export const Page = styled.div`
  min-height: 100%;
  color: #0f172a;
`;

export const Dashboard = styled.main`
  padding: 10px 0 32px;
`;

export const Header = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 22px;
  }
`;

export const PageTitle = styled.h1`
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 28px;
  font-weight: 750;
  letter-spacing: -0.6px;
  line-height: 1.25;
`;

export const PageSubtitle = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 15px;
`;

export const AddButton = styled(Button)`
  && {
    min-width: 160px;
    height: 42px;
    padding: 0 20px;
    border-color: #4f46e5;
    border-radius: 8px;
    background: #4f46e5;
    box-shadow: none;
    font-size: 15px;
    font-weight: 600;
  }
`;

export const StatsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 30px;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

export const StatCard = styled.article`
  position: relative;
  min-height: 132px;
  padding: 28px 26px 24px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
`;

export const StatLabel = styled.div`
  margin-bottom: 18px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.3px;
  text-transform: uppercase;
`;

export const StatValue = styled.div`
  color: #0f172a;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1;
`;

export const StatIcon = styled.div`
  position: absolute;
  top: 21px;
  right: 22px;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 7px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 19px;
`;

export const Toolbar = styled.section`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;

  @media (max-width: 900px) {
    align-items: stretch;
    flex-wrap: wrap;
  }
`;

export const PeriodTabs = styled.div`
  display: inline-flex;
  height: 42px;
  padding: 3px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
`;

export const PeriodButton = styled.button`
  padding: 0 18px;
  border: 0;
  border-radius: 6px;
  background: ${({ $active }) => ($active ? '#fff' : 'transparent')};
  box-shadow: ${({ $active }) => ($active ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none')};
  color: ${({ $active }) => ($active ? '#0f172a' : '#64748b')};
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 650 : 500)};
  white-space: nowrap;
`;

export const SearchInput = styled(Input)`
  && {
    width: min(400px, 100%);
    height: 42px;
    border-color: #e2e8f0;
    border-radius: 8px;
    box-shadow: none;
    font-size: 14px;

    .ant-input-prefix {
      margin-right: 10px;
      color: #0f172a;
      font-size: 17px;
    }

    input::placeholder {
      color: #a7b0c0;
    }
  }
`;

export const FilterButton = styled(Button)`
  && {
    height: 42px;
    padding: 0 16px;
    border-color: ${({ $active }) => ($active ? '#4f46e5' : '#e2e8f0')};
    border-radius: 8px;
    background: ${({ $active }) => ($active ? '#eef2ff' : '#fff')};
    color: ${({ $active }) => ($active ? '#4338ca' : '#0f172a')};
    box-shadow: none;
    font-weight: 600;
  }
`;

export const TableShell = styled.section`
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
`;

export const TableScroller = styled.div`
  overflow-x: auto;
`;

export const tableGrid = `
  grid-template-columns:
    minmax(180px, 1.25fr)
    minmax(180px, 1.35fr)
    minmax(120px, 0.8fr)
    minmax(105px, 0.7fr)
    minmax(76px, 0.45fr)
    minmax(170px, 1fr)
    minmax(145px, 0.85fr)
    22px;
`;

export const TableHeader = styled.div`
  ${tableGrid}
  display: grid;
  min-width: 1060px;
  min-height: 48px;
  align-items: center;
  gap: 20px;
  padding: 0 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
`;

export const TableRow = styled.div`
  ${tableGrid}
  display: grid;
  min-width: 1060px;
  min-height: 72px;
  align-items: center;
  gap: 20px;
  padding: 0 16px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition: background 150ms ease;

  &:last-child {
    border-bottom: 0;
  }

  &:hover,
  &:focus-visible {
    outline: none;
    background: #fafbff;
  }
`;

export const MemberCell = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 13px;
`;

export const Avatar = styled.div`
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4f46e5;
  font-size: 14px;
  font-weight: 700;
`;

export const MemberInfo = styled.div`
  min-width: 0;
`;

export const MemberName = styled.div`
  margin-bottom: 2px;
  overflow: hidden;
  color: #172033;
  font-size: 14px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MutedText = styled.div`
  overflow: hidden;
  color: #7b8494;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CellText = styled.div`
  color: #5f697a;
  font-size: 13px;
  white-space: nowrap;
`;

export const EllipsisText = styled(CellText)`
  display: -webkit-box;
  overflow: hidden;
  line-height: 1.45;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const ProgressCell = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
`;

export const ProgressTrack = styled.div`
  width: 110px;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f1f5f9;
`;

export const progressColor = {
  success: '#15803d',
  active: '#4f46e5',
  warning: '#a16207',
  pending: '#cbd5e1',
};

export const ProgressBar = styled.div`
  width: ${({ $width }) => $width}%;
  height: 100%;
  border-radius: inherit;
  background: ${({ $status }) => progressColor[$status]};
`;

export const ProgressValue = styled.span`
  min-width: 42px;
  color: #5f697a;
  font-size: 13px;
  text-align: right;
`;

export const StatusBadge = styled.span`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border: 1px solid ${({ $meta }) => $meta.border};
  border-radius: 999px;
  background: ${({ $meta }) => $meta.background};
  color: ${({ $meta }) => $meta.color};
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
`;

export const StatusDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
`;

export const Chevron = styled.span`
  color: #0f172a;
  font-size: 12px;
  text-align: right;
`;

export const EmptyState = styled.div`
  min-width: 900px;
  padding: 48px 24px;
  color: #94a3b8;
  text-align: center;
`;
