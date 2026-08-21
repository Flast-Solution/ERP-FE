/**************************************************************************/
/*  pages.kpi.index.js                                                    */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/**************************************************************************/

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { RequestUtils } from '@flast-erp/core/utils';
import EmployeeKpiDetail from './components/EmployeeKpiDetail';
import IndicatorDrawer from './components/IndicatorDrawer';
import KpiDashboard from './components/KpiDashboard';
import { createKpiPeriods } from './constants';

const getInitials = (name = '') => name
  .trim()
  .split(/\s+/)
  .slice(-2)
  .map((part) => part.charAt(0).toLocaleUpperCase('vi'))
  .join('');

const getAverageProgress = (kpis = []) => {
  if (!kpis.length) return 0;

  const totalProgress = kpis.reduce((total, kpi) => {
    const target = Number(kpi.target) || 0;
    const achieve = Number(kpi.achieve) || 0;
    return total + (target > 0 ? (achieve / target) * 100 : 0);
  }, 0);

  return Math.round(totalProgress / kpis.length);
};

const KpiPage = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const periods = useMemo(() => createKpiPeriods(currentYear), [currentYear]);
  const [period, setPeriod] = useState(`q${Math.floor(now.getMonth() / 3) + 1}`);
  const [search, setSearch] = useState('');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [users, setUsers] = useState([]);
  const [kpiLoading, setKpiLoading] = useState(false);
  const kpiRequestIdRef = useRef(0);
  const [drawer, setDrawer] = useState({
    open: false,
    mode: 'create',
    employee: null,
    indicator: null,
  });

  const kpiQueryParams = useMemo(() => {
    if (period === 'year') {
      return {
        year: currentYear,
        frequency: 'year',
      };
    }

    const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
    const selectedQuarter = Number(period.replace('q', '')) || currentQuarter;

    return {
      year: currentYear,
      quarter: selectedQuarter,
      frequency: 'quarter',
    };
  }, [currentYear, period]);

  const loadKpis = useCallback(async () => {
    const requestId = kpiRequestIdRef.current + 1;
    kpiRequestIdRef.current = requestId;
    setKpiLoading(true);

    try {
      const response = await RequestUtils.Get('/user/kpi', kpiQueryParams);
      if (requestId !== kpiRequestIdRef.current) return;

      const isSuccess = response?.success === true || Number(response?.errorCode) === 200;

      if (!isSuccess) {
        setUsers([]);
        message.error(response?.message || 'Không tải được danh sách KPI.');
        return;
      }

      setUsers(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      if (requestId !== kpiRequestIdRef.current) return;

      console.error('[KPI] Không tải được danh sách KPI:', error);
      setUsers([]);
      message.error('Không tải được danh sách KPI.');
    } finally {
      if (requestId === kpiRequestIdRef.current) setKpiLoading(false);
    }
  }, [kpiQueryParams]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  const selectedPeriod = periods.find((item) => item.key === period) || periods[0];

  const employeeRows = useMemo(() => users.map((user) => {
      const employeeKpis = Array.isArray(user.kpi) ? user.kpi : [];

      return {
        ...user,
        initials: getInitials(user.fullName),
        indicatorCount: employeeKpis.length,
        kpiNames: employeeKpis.map((kpi) => kpi.name).filter(Boolean).join(', '),
        kpiTypes: [...new Set(employeeKpis.map((kpi) => kpi.type).filter(Boolean))].join(', '),
        averageProgress: getAverageProgress(employeeKpis),
      };
    }), [users]);

  const employees = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi');

    return employeeRows.filter((employee) => {
      const matchesSearch = !normalizedSearch || [employee.fullName, employee.ssoId, employee.email]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase('vi').includes(normalizedSearch));
      const matchesStatus = !attentionOnly || employee.indicatorCount === 0;
      return matchesSearch && matchesStatus;
    });
  }, [attentionOnly, employeeRows, search]);

  const selectedEmployeeView = selectedEmployee
    ? employeeRows.find((employee) => employee.id === selectedEmployee.id) || selectedEmployee
    : null;

  const selectedEmployeeKpis = useMemo(() => {
    if (!selectedEmployeeView) return [];

    const selectedUser = users.find(
      (user) => String(user.id) === String(selectedEmployeeView.id),
    );
    return Array.isArray(selectedUser?.kpi) ? selectedUser.kpi : [];
  }, [selectedEmployeeView, users]);

  const openIndicatorDrawer = (employee, indicator = null) => {
    setDrawer({
      open: true,
      mode: indicator ? 'edit' : 'create',
      employee: employee || null,
      indicator,
    });
  };

  const closeIndicatorDrawer = () => {
    setDrawer((current) => ({ ...current, open: false }));
  };

  return (
    <>
      {selectedEmployeeView ? (
        <EmployeeKpiDetail
          employee={selectedEmployeeView}
          indicators={selectedEmployeeKpis}
          loading={kpiLoading}
          period={selectedPeriod}
          onBack={() => setSelectedEmployee(null)}
          onAdd={() => openIndicatorDrawer(selectedEmployeeView)}
          onEdit={(indicator) => openIndicatorDrawer(selectedEmployeeView, indicator)}
        />
      ) : (
        <KpiDashboard
          attentionOnly={attentionOnly}
          employees={employees}
          loading={kpiLoading}
          periods={periods}
          onAdd={() => openIndicatorDrawer(null)}
          onFilterChange={() => setAttentionOnly((current) => !current)}
          onPeriodChange={setPeriod}
          onSearchChange={setSearch}
          onSelectEmployee={setSelectedEmployee}
          period={period}
          search={search}
          selectedPeriod={selectedPeriod}
        />
      )}
      <IndicatorDrawer drawer={drawer} onClose={closeIndicatorDrawer} onSaved={loadKpis} />
    </>
  );
};

export default KpiPage;
