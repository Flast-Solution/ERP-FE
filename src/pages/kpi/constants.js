export const KPI_PAGE_TITLE = 'Thiết lập KPI';

export const createKpiPeriods = (year) => [
  ...Array.from({ length: 4 }, (_, index) => ({
    key: `q${index + 1}`,
    label: `Quý ${index + 1}/${year}`,
    evaluation: `Quý ${index + 1}/${year}`,
  })),
  { key: 'year', label: `Cả năm ${year}`, evaluation: `Năm ${year}` },
];
