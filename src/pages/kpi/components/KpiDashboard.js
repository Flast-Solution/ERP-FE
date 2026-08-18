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
import {
  KPI_NAMES,
  MOCK_EMPLOYEES,
  PERIODS,
  STATUS_META,
  TITLE,
} from '../mockData';
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

const KpiDashboard = ({
  attentionOnly,
  averageProgress,
  employees,
  onAdd,
  onFilterChange,
  onPeriodChange,
  onSearchChange,
  onSelectEmployee,
  period,
  search,
  selectedPeriod,
}) => (
  <Page>
    <Helmet>
      <title>{TITLE}</title>
    </Helmet>

    <Dashboard>
      <Header>
        <div>
          <PageTitle>KPI nhân viên</PageTitle>
          <PageSubtitle>
            {MOCK_EMPLOYEES.length} thành viên — kỳ đánh giá {selectedPeriod.evaluation}
          </PageSubtitle>
        </div>
        <AddButton type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Thêm chỉ tiêu
        </AddButton>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatLabel>Tổng thành viên</StatLabel>
          <StatValue>{MOCK_EMPLOYEES.length}</StatValue>
          <StatIcon><TeamOutlined /></StatIcon>
        </StatCard>
        <StatCard>
          <StatLabel>Tiến độ trung bình</StatLabel>
          <StatValue>{averageProgress}%</StatValue>
          <StatIcon><BarChartOutlined /></StatIcon>
        </StatCard>
        <StatCard>
          <StatLabel>Đạt mục tiêu</StatLabel>
          <StatValue>{MOCK_EMPLOYEES.filter((item) => item.status === 'success').length}</StatValue>
          <StatIcon><CheckCircleOutlined /></StatIcon>
        </StatCard>
        <StatCard>
          <StatLabel>Cần theo dõi</StatLabel>
          <StatValue>{MOCK_EMPLOYEES.filter((item) => item.status === 'warning').length}</StatValue>
          <StatIcon><WarningOutlined /></StatIcon>
        </StatCard>
      </StatsGrid>

      <Toolbar>
        <PeriodTabs>
          {PERIODS.map((item) => (
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
          Bộ lọc
        </FilterButton>
      </Toolbar>

      <TableShell>
        <TableScroller>
          <TableHeader>
            <span>Thành viên</span>
            <span>Tên KPI</span>
            <span>Phòng ban</span>
            <span>Kỳ đánh giá</span>
            <span>Số chỉ tiêu</span>
            <span>Tiến độ trung bình</span>
            <span>Trạng thái</span>
            <span />
          </TableHeader>

          {employees.map((employee) => {
            const status = STATUS_META[employee.status];
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
                    <MemberName>{employee.name}</MemberName>
                    <MutedText>{employee.role}</MutedText>
                  </MemberInfo>
                </MemberCell>
                <EllipsisText title={KPI_NAMES}>{KPI_NAMES}</EllipsisText>
                <EllipsisText title={employee.department}>{employee.department}</EllipsisText>
                <CellText>{selectedPeriod.evaluation}</CellText>
                <CellText>{employee.indicatorCount}</CellText>
                <ProgressCell>
                  <ProgressTrack>
                    <ProgressBar $status={employee.status} $width={Math.min(employee.progress, 100)} />
                  </ProgressTrack>
                  <ProgressValue>{employee.progress}%</ProgressValue>
                </ProgressCell>
                <StatusBadge $meta={status}>
                  <StatusDot />
                  {status.label}
                </StatusBadge>
                <Chevron><RightOutlined /></Chevron>
              </TableRow>
            );
          })}

          {!employees.length && (
            <EmptyState>Không tìm thấy thành viên phù hợp.</EmptyState>
          )}
        </TableScroller>
      </TableShell>
    </Dashboard>
  </Page>
);

export default KpiDashboard;
