
import { Row } from 'antd';
import styled from 'styled-components';

export const FilterContent = styled(Row)`
  align-items: center;
  margin-left: 20px;
  .ant-form-item {
    margin-bottom: 0px;
  }
`;

export const SchedulerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
  background: #f8f9fa;
`;

export const SchedulerHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 40;
  width: 100%;
  background: #f8f9fa;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  border-bottom: 1px solid #e5e9eb;
  transition: all 0.3s ease;
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
`;

export const HeaderTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #2d3335;
  margin: 0;
  letter-spacing: -0.02em;
`;

export const NavGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const NavButton = styled.button`
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #5a6062;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e9eb;
    color: #2d3335;
  }

  &.active {
    color: #005bc1;
    font-weight: 700;
  }
`;

export const TodayButton = styled.button`
  padding: 6px 16px;
  background: #e5e9eb;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #2d3335;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #dee3e6;
  }
`;

export const CalendarBody = styled.div`
  flex: 1;
  overflow: auto;
  background: #fff;
  padding: 24px;
  margin: 24px;
  margin-top: 0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;
