import React from 'react';
import {
  BarChartOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Helmet } from 'react-helmet';
import { KPI_PAGE_TITLE } from '../constants';
import {
  AddButton,
  Avatar,
  CellText,
  Chevron,
  Dashboard,
  EllipsisText,
  EmptyState,
  FilterButton,
  Header,
  MemberCell,
  MemberInfo,
  MemberName,
  MutedText,
  Page,
  PageSubtitle,
  PageTitle,
  PeriodButton,
  PeriodTabs,
  ProgressBar,
  ProgressCell,
  ProgressTrack,
  ProgressValue,
  SearchInput,
  StatCard,
  StatIcon,
  StatLabel,
  StatsGrid,
  StatValue,
  StatusBadge,
  StatusDot,
  TableHeader,
  TableRow,
  TableScroller,
  TableShell,
  Toolbar,
} from './KpiDashboard.styles';

const getProgressMeta = (progress) => {
  if (progress >= 100) {
    return {
      key: 'success',
      label: 'Đạt mục tiêu',
      border: '#a7f3c5',
      background: '#e9fbef',
      color: '#15803d',
    };
  }

  if (progress >= 70) {
    return {
      key: 'active',
      label: 'Đang thực hiện',
      border: '#bfdbfe',
      background: '#eff6ff',
      color: '#2563eb',
    };
  }

  if (progress > 0) {
    return {
      key: 'warning',
      label: 'Cần theo dõi',
      border: '#fde68a',
      background: '#fffbeb',
      color: '#a16207',
    };
  }

  return {
    key: 'pending',
    label: 'Chưa bắt đầu',
    border: '#d5dde8',
    background: '#f1f5f9',
    color: '#64748b',
  };
};

const KpiDashboard = ({
  attentionOnly,
  employees,
  loading,
  onAdd,
  onFilterChange,
  onPeriodChange,
  onSearchChange,
  onSelectEmployee,
  period,
  periods,
  search,
  selectedPeriod,
}) => (
  <Page>
    <Helmet>
      <title>{KPI_PAGE_TITLE}</title>
    </Helmet>

    <Dashboard>
      <Header>
        <div>
          <PageTitle>KPI nhân viên</PageTitle>
          <PageSubtitle>
            {employees.length} thành viên — kỳ đánh giá {selectedPeriod.evaluation}
          </PageSubtitle>
        </div>
        <AddButton type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Thêm chỉ tiêu
        </AddButton>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatLabel>Tổng thành viên</StatLabel>
          <StatValue>{employees.length}</StatValue>
          <StatIcon><TeamOutlined /></StatIcon>
        </StatCard>
        <StatCard>
          <StatLabel>Tổng chỉ tiêu KPI</StatLabel>
          <StatValue>{employees.reduce((total, item) => total + item.indicatorCount, 0)}</StatValue>
          <StatIcon><BarChartOutlined /></StatIcon>
        </StatCard>
        <StatCard>
          <StatLabel>Đã gắn KPI</StatLabel>
          <StatValue>{employees.filter((item) => item.indicatorCount > 0).length}</StatValue>
          <StatIcon><CheckCircleOutlined /></StatIcon>
        </StatCard>
        <StatCard>
          <StatLabel>Chưa có KPI</StatLabel>
          <StatValue>{employees.filter((item) => item.indicatorCount === 0).length}</StatValue>
          <StatIcon><WarningOutlined /></StatIcon>
        </StatCard>
      </StatsGrid>

      <Toolbar>
        <PeriodTabs>
          {periods.map((item) => (
            <PeriodButton
              key={item.key}
              type="button"
              $active={period === item.key}
              onClick={() => onPeriodChange(item.key)}
            >
              {item.label}
            </PeriodButton>
          ))}
        </PeriodTabs>
        <SearchInput
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo tên hoặc vai trò..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <FilterButton
          icon={<FilterOutlined />}
          $active={attentionOnly}
          onClick={onFilterChange}
        >
          Chưa có KPI
        </FilterButton>
      </Toolbar>

      <TableShell>
        <TableScroller>
          <TableHeader>
            <span>Thành viên</span>
            <span>Tên KPI</span>
            <span>Loại KPI</span>
            <span>Kỳ đánh giá</span>
            <span>Số chỉ tiêu</span>
            <span>Tiến độ trung bình</span>
            <span>Trạng thái</span>
            <span />
          </TableHeader>

          {employees.map((employee) => {
            const progress = employee.averageProgress;
            const progressMeta = getProgressMeta(progress);

            return (
              <TableRow
                key={employee.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectEmployee(employee)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') onSelectEmployee(employee);
                }}
              >
                <MemberCell>
                  <Avatar>{employee.initials}</Avatar>
                  <MemberInfo>
                    <MemberName>{employee.fullName}</MemberName>
                    <MutedText>{employee.ssoId || employee.phone || '-'}</MutedText>
                  </MemberInfo>
                </MemberCell>
                <EllipsisText title={employee.kpiNames || ''}>
                  {employee.kpiNames || 'Chưa có KPI'}
                </EllipsisText>
                <EllipsisText title={employee.kpiTypes || ''}>
                  {employee.kpiTypes || '-'}
                </EllipsisText>
                <CellText>{selectedPeriod.evaluation}</CellText>
                <CellText>{employee.indicatorCount}</CellText>
                <ProgressCell>
                  <ProgressTrack>
                    <ProgressBar
                      $status={progressMeta.key}
                      $width={Math.min(Math.max(progress, 0), 100)}
                    />
                  </ProgressTrack>
                  <ProgressValue>{progress}%</ProgressValue>
                </ProgressCell>
                <StatusBadge $meta={progressMeta}>
                  <StatusDot />
                  {progressMeta.label}
                </StatusBadge>
                <Chevron><RightOutlined /></Chevron>
              </TableRow>
            );
          })}

          {!employees.length && (
            <EmptyState>
              {loading ? 'Đang tải dữ liệu KPI...' : 'Không tìm thấy thành viên phù hợp.'}
            </EmptyState>
          )}
        </TableScroller>
      </TableShell>
    </Dashboard>
  </Page>
);

export default KpiDashboard;
