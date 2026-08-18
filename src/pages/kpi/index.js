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

import React, { useMemo, useState } from 'react';
import EmployeeKpiDetail from './components/EmployeeKpiDetail';
import IndicatorDrawer from './components/IndicatorDrawer';
import KpiDashboard from './components/KpiDashboard';
import { MOCK_EMPLOYEES, PERIODS } from './mockData';

const KpiPage = () => {
  const [period, setPeriod] = useState('q2');
  const [search, setSearch] = useState('');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [drawer, setDrawer] = useState({
    open: false,
    mode: 'create',
    employee: null,
    indicator: null,
  });

  const selectedPeriod = PERIODS.find((item) => item.key === period) || PERIODS[1];

  const employees = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi');

    return MOCK_EMPLOYEES.filter((employee) => {
      const matchesSearch = !normalizedSearch || [employee.name, employee.role, employee.department]
        .some((value) => value.toLocaleLowerCase('vi').includes(normalizedSearch));
      const matchesStatus = !attentionOnly || employee.status === 'warning';
      return matchesSearch && matchesStatus;
    });
  }, [attentionOnly, search]);

  const averageProgress = Math.round(
    MOCK_EMPLOYEES.reduce((total, employee) => total + employee.progress, 0) / MOCK_EMPLOYEES.length,
  );

  const openIndicatorDrawer = (employee, indicator = null) => {
    setDrawer({
      open: true,
      mode: indicator ? 'edit' : 'create',
      employee: employee || MOCK_EMPLOYEES[0],
      indicator,
    });
  };

  const closeIndicatorDrawer = () => {
    setDrawer((current) => ({ ...current, open: false }));
  };

  return (
    <>
      {selectedEmployee ? (
        <EmployeeKpiDetail
          employee={selectedEmployee}
          period={selectedPeriod}
          onBack={() => setSelectedEmployee(null)}
          onAdd={() => openIndicatorDrawer(selectedEmployee)}
          onEdit={(indicator) => openIndicatorDrawer(selectedEmployee, indicator)}
        />
      ) : (
        <KpiDashboard
          attentionOnly={attentionOnly}
          averageProgress={averageProgress}
          employees={employees}
          onAdd={() => openIndicatorDrawer(MOCK_EMPLOYEES[0])}
          onFilterChange={() => setAttentionOnly((current) => !current)}
          onPeriodChange={setPeriod}
          onSearchChange={setSearch}
          onSelectEmployee={setSelectedEmployee}
          period={period}
          search={search}
          selectedPeriod={selectedPeriod}
        />
      )}
      <IndicatorDrawer drawer={drawer} onClose={closeIndicatorDrawer} />
    </>
  );
};

export default KpiPage;
