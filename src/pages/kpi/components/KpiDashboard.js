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
  SearchInput,
  StatCard,
  StatIcon,
  StatLabel,
  StatsGrid,
  StatValue,
  TableHeader,
  TableRow,
  TableScroller,
  TableShell,
  Toolbar,
} from './KpiDashboard.styles';

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
            <span>Tổng trọng số</span>
            <span>Email</span>
            <span />
          </TableHeader>

          {employees.map((employee) => (
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
                <CellText>{employee.totalWeight}%</CellText>
                <EllipsisText title={employee.email || ''}>{employee.email || '-'}</EllipsisText>
                <Chevron><RightOutlined /></Chevron>
              </TableRow>
          ))}

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
