
export const theme = {
  common: {
    border: '1px solid #e5e9eb',
    backgroundColor: 'white',
    holiday: { color: '#a83836' },
    saturday: { color: '#005bc1' },
    dayName: { color: '#5a6062' },
    today: { color: '#005bc1' },
    gridSelection: {
      backgroundColor: 'rgba(0, 91, 193, 0.08)',
      border: '1px solid #005bc1',
    },
  },
  month: {
    dayName: {
      borderLeft: 'none',
      backgroundColor: 'inherit',
    },
    holidayExceptThisMonth: { color: '#f3acac' },
    dayExceptThisMonth: { color: '#adb3b5' },
    weekend: { backgroundColor: '#f8f9fa' },
    moreView: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    moreViewTitle: { backgroundColor: '#f1f4f5' },
  },
  week: {
    dayName: {
      borderTop: '1px solid #e5e9eb',
      borderBottom: '1px solid #e5e9eb',
      borderLeft: '1px solid #e5e9eb',
      backgroundColor: 'inherit',
    },
    today: {
      color: '#005bc1',
      backgroundColor: 'inherit',
    },
    pastDay: { color: '#adb3b5' },
    panelResizer: { border: '1px solid #ddd' },
    dayGrid: { borderRight: '1px solid #ddd' },
    dayGridLeft: {
      width: '100px',
      backgroundColor: '',
      borderRight: '1px solid #ddd',
    },
    weekend: { backgroundColor: 'inherit' },
    timeGridLeft: {
      width: '100px',
      backgroundColor: '#fafafa',
      borderRight: '1px solid #ddd',
    },
    timeGridLeftAdditionalTimezone: { backgroundColor: '#fdfdfd' },
    timeGridHourLine: { borderBottom: '1px solid #eee' },
    timeGridHalfHourLine: { borderBottom: '1px dotted #f9f9f9' },
    timeGrid: { borderRight: '1px solid #ddd' },
    nowIndicatorLabel: { color: '#005bc1' },
    nowIndicatorPast: { border: '1px solid rgba(0, 91, 193, 0.3)' },
    nowIndicatorBullet: { backgroundColor: '#005bc1' },
    nowIndicatorToday: { border: '1px solid #005bc1' },
    nowIndicatorFuture: { border: '1px solid #005bc1' },
    pastTime: { color: '#adb3b5' },
    futureTime: { color: '#2d3335' },
    gridSelection: { color: '#005bc1' },
  },
};