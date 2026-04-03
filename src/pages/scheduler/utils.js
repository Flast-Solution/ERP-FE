import { TZDate } from '@toast-ui/calendar';
import dayjs from 'dayjs';
import UserService from 'services/UserService';
import { arrayEmpty, arrayNotEmpty } from '@flast-erp/core/utils/dataUtils';

export function clone(date) {
  return new TZDate(date);
}

export function addHours(d, step) {
  const date = clone(d);
  date.setHours(d.getHours() + step);
  return date;
}

export function addDate(d, step) {
  const date = clone(d);
  date.setDate(d.getDate() + step);
  return date;
}

export function subtractDate(d, steps) {
  const date = clone(d);
  date.setDate(d.getDate() - steps);
  return date;
}

/* Editorial palette (ref: a.html) — names via i18n: calendarPage.types.{id} */
export const calendarPalettes = [
  { id: '0', backgroundColor: '#e3f2fd', borderColor: '#005bc1', dragBackgroundColor: '#005bc1' },
  { id: '1', backgroundColor: '#ffebee', borderColor: '#a83836', dragBackgroundColor: '#a83836' },
  { id: '2', backgroundColor: '#fff8e1', borderColor: '#f5a623', dragBackgroundColor: '#f5a623' },
  { id: '3', backgroundColor: '#f5f7fa', borderColor: '#5c5f62', dragBackgroundColor: '#5c5f62' },
  { id: '4', backgroundColor: '#eceff1', borderColor: '#455a64', dragBackgroundColor: '#455a64' },
  { id: '5', backgroundColor: '#e8f5e9', borderColor: '#2e7d32', dragBackgroundColor: '#2e7d32' },
  { id: '6', backgroundColor: '#e3f2fd', borderColor: '#0066b2', dragBackgroundColor: '#0066b2' },
  { id: '7', backgroundColor: '#e0f7fa', borderColor: '#00838f', dragBackgroundColor: '#00838f' },
  { id: '8', backgroundColor: '#ede7f6', borderColor: '#4b23c9', dragBackgroundColor: '#4b23c9' },
  { id: '9', backgroundColor: '#f3e5f5', borderColor: '#6a1b9a', dragBackgroundColor: '#6a1b9a' },
];

/** @param {(key: string) => string} t - useTranslation().t */
export function buildCalendarsWithNames(t) {
  return calendarPalettes.map((c) => ({
    ...c,
    name: t(`calendarPage.types.${c.id}`),
  }));
}

/** Fallback English labels (e.g. AddAction before i18n wiring) */
export const initialCalendars = buildCalendarsWithNames((key) => {
  const map = {
    'calendarPage.types.0': 'Overtime',
    'calendarPage.types.1': 'Unpaid leave',
    'calendarPage.types.2': 'Work in the office',
    'calendarPage.types.3': 'Weekly break',
    'calendarPage.types.4': 'Sick leave with social insurance',
    'calendarPage.types.5': 'Paid leave',
    'calendarPage.types.6': 'Holiday',
    'calendarPage.types.7': 'Leave according to company policy',
    'calendarPage.types.8': 'Business trip',
    'calendarPage.types.9': 'Meeting schedule',
  };
  return map[key] || key;
});

export const AMPM = () => <><br /><br /></>;

const CALEN_NGHI_HANG_TUAN = '3';
const CALEN_OVER_TIME = '0';
const CALEN_NGHI_LE = '6';
const CALEN_HUONG_BHXH = '4';
const CALEN_NGHI_CO_LUONG = '5';
const CALEN_NGHI_KO_LUONG = '1';
const CALEN_NGHI_CHE_DO_CONG_TY = '7';
export const CALEN_CONG_TAC_XA = '8';

const CellRenderSatSun = ({ dayValue, acal }) => {
  const TEMPLATE = <span>O <AMPM /> O</span>;
  if (arrayEmpty(acal[dayValue])) {
    UserService.addWorkOff(1, 1);
    return TEMPLATE
  }

  const calItem = acal[dayValue];
  const item = calItem.find(i => i.calendarId === CALEN_NGHI_HANG_TUAN);
  if (!item) {
    UserService.addWorkOff(1, 1);
    return TEMPLATE;
  }
  const itemOT = calItem?.filter(i => i.calendarId === CALEN_OVER_TIME);
  const { start } = item;
  const startHour = dayjs(start).get("hour");
  let am = "O";
  /* Nếu lớn hơn 12 thì sáng vẫn làm việc là X */
  if (startHour >= 12) {
    UserService.addWorkOff(0, 1);
    am = "X";
  } else {
    UserService.addWorkOff(1, 1);
  }
  const isOt = arrayNotEmpty(itemOT);
  if (isOt) {
    let minute = sumaryOT(itemOT);
    UserService.timeSheetSetOt("Woff", minute);
  }
  return <span> {am} <AMPM /> {String("O").concat(isOt ? ", OT" : "")} </span>
}

const RenderAmPmNoOT = ({ item, text }) => {
  const { start } = item;
  const startHour = dayjs(start).get("hour");
  let am = text;
  /* Nếu thời gian bắt đầu nghỉ lớn hơn 12 thì sáng vẫn làm việc là X */
  if (startHour >= 12) {
    am = "X";
  }
  return <span> {am} <AMPM /> {text} </span>
}

const calRatioOverTime = (m) => {
  if (m <= 0) {
    return '0.0';
  } else if (m > 0 && m <= 30) {
    return '0.5';
  } else if (m > 30 && m <= 60) {
    return '1.0';
  } else if (m > 60 && m <= 90) {
    return '1.5';
  } else if (m > 90 && m <= 120) {
    return '2.0';
  } else if (m > 120 && m <= 150) {
    return '2.5';
  } else {
    return '3.0';
  }
}

const sumaryOT = (calItem) => {
  let minute = 0;
  for (let item of calItem) {
    const { start, end } = item;
    const dateStart = dayjs(start)
    const dateEnd = dayjs(end)
    minute += dateEnd.diff(dateStart, "minute");
  }
  return minute;
}

const RenderOTItem = ({ dayValue, acal }) => {
  const calItem = acal[dayValue]?.filter(i => i.calendarId === CALEN_OVER_TIME);
  if (!calItem) {
    return '';
  }
  let minute = sumaryOT(calItem);
  return calRatioOverTime(minute);
}

const CellRenderWork = ({ dayName, dayValue, acal }) => {
  /* Nghỉ hàng tuần */
  if (dayName === 'Sat' || dayName === 'Sun') {
    return <CellRenderSatSun dayValue={dayValue} acal={acal} />
  }
  const calItem = acal[dayValue];
  const itemOT = calItem?.filter(i => i.calendarId === CALEN_OVER_TIME) ?? [];
  const isOT = arrayNotEmpty(itemOT);

  /* Nghỉ lễ */
  if (calItem?.find(i => i.calendarId === CALEN_NGHI_LE)) {
    let minute = sumaryOT(itemOT);
    UserService.timeSheetSetOt("holiday", minute);
    /* Chưa xử lý trong khoản ngày */
    UserService.addHoliday(1, 1);
    return <span> H {isOT ? " , OT" : ""} <AMPM /> H </span>
  }

  let item = calItem?.find(i => i.calendarId === CALEN_HUONG_BHXH);
  if (item) {
    return <RenderAmPmNoOT item={item} text={"SL"} />
  }

  /* Nghi có lương */
  item = calItem?.find(i => i.calendarId === CALEN_NGHI_CO_LUONG);
  if (item) {
    /* Chưa xử lý trong khoản ngày */
    const startHour = dayjs(item.start).get("hour");
    /* Bắt đầu nghỉ > 12h thì buổi sáng không tính nghỉ */
    UserService.addAnnualLeave(startHour > 12 ? 0 : 1, 1);
    return <RenderAmPmNoOT item={item} text={"AP"} />
  }

  /* Nghi không lương */
  item = calItem?.find(i => i.calendarId === CALEN_NGHI_KO_LUONG);
  if (item) {
    return <RenderAmPmNoOT item={item} text={"UP"} />
  }

  /* Nghi chế độ công ty */
  item = calItem?.find(i => i.calendarId === CALEN_NGHI_CHE_DO_CONG_TY);
  if (item) {
    return <RenderAmPmNoOT item={item} text={"SP"} />
  }

  /* Công tác xa */
  item = calItem?.find(i => i.calendarId === CALEN_CONG_TAC_XA);
  if (item) {
    if (isOT) {
      let minute = sumaryOT(itemOT);
      UserService.timeSheetSetOt("businessTrip", minute);
    }
    /* Chưa xử lý ngày công tác nằm trong khoản ngày */
    UserService.addBusinessTrip(1, 1);
    return <RenderAmPmNoOT item={item} text={"X*"} />
  }

  /* Làm việc tại văn phòng */
  if (isOT) {
    let minute = sumaryOT(itemOT);
    UserService.timeSheetSetOt("Working", minute);
  }
  UserService.addWorkday(1, 1);
  return <span> X <AMPM /> X </span>
}

export const yCellDataCreate = (y, acal, handleSaveRow) => ({
  title: () => <div style={{ color: y.color }}>{y.day}</div>,
  children: [{
    title: () => <div style={{ color: y.color }}>{y.value}</div>,
    render: (x, item) => {
      let cellRender = '';
      if (item.id === 1) {
        cellRender = <CellRenderWork dayName={y.day} dayValue={y.value} acal={acal} />
      }
      if (item.id === 2) {
        cellRender = <RenderOTItem dayValue={y.value} acal={acal} />
      }
      if (item.id === 3) {
        cellRender = y.dateStartValue || ''
      }
      if (item.id === 4) {
        cellRender = y.dateEndValue || ''
      }
      return (
        <div style={{ color: y.color }}> {cellRender} </div>
      );
    },
    key: y.value,
    width: 60,
    ...(y.editBusinessTrip && {
      onCell: (record) => ({
        record: { ...record, dateEdit: y.value, dateStartValue: y.dateStartValue || "", dateEndValue: y.dateEndValue || "" },
        editable: record.id <= 2 ? false : true,
        dataIndex: record.id === 3 ? 'dateStartValue' : 'dateEndValue',
        title: 'Value',
        handleSave: (row) => handleSaveRow(row)
      })
    })
  }]
});

const SumaryWrap = ({ children }) => (
  <div style={{ marginLeft: -17, marginRight: -17, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <span style={{ display: 'block', width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
      {children}
    </span>
  </div>
)

const RenderSumaryWorkData = ({ action, record }) => {
  if (record.id < 2) {
    return (
      <SumaryWrap>
        <span> {record[action]?.am ?? ''} <hr /> {record[action]?.pm ?? ''}</span>
      </SumaryWrap>
    )
  }

  /* 2 <==> Overtime */
  return record.id === 2 ? <SumaryWrap>{record[action] || 0}</SumaryWrap> : '';
}

export const COLUMNS_SUMMARY = (datas, aCal) => [
  {
    title: 'Total',
    children: [
      {
        title: 'Working Date',
        width: 200,
        children: [
          {
            title: 'Working', dataIndex: 'working', key: 'working', width: 100,
            render: (_, record) => <RenderSumaryWorkData action='working' record={record} />
          },
          {
            title: 'Business', dataIndex: 'businessTrip', key: 'businessTrip', width: 100,
            render: (_, record) => <RenderSumaryWorkData action='businessTrip' record={record} />
          }
        ]
      },
      {
        title: 'W.Off', dataIndex: 'weekOff', key: 'weekOff', width: 100,
        render: (_, record) => <RenderSumaryWorkData action='weekOff' record={record} />
      },
      {
        title: 'Holiday', dataIndex: 'holiday', key: 'holiday', width: 100,
        render: (_, record) => <RenderSumaryWorkData action='holiday' record={record} />
      },
      {
        title: 'A.Leave', dataIndex: 'annualLeave', key: 'aleave', width: 100,
        render: (_, record) => <RenderSumaryWorkData action='annualLeave' record={record} />
      },
      {
        title: 'SL', dataIndex: 'sl', key: 'sl', width: 100,
        render: (_, record) => <RenderSumaryWorkData action='sl' record={record} />
      }
    ]
  },
  {
    title: () => <div>Remarks<br /> Ghi chú</div>,
    dataIndex: 'note',
    key: 'note',
    width: 200
  }
];

const getDayName = (dateString) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(dateString);
  return days[d.getDay()];
}

const getMonthName = (date) => {
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const d = new Date(date);
  return monthNames[d.getMonth()];
}

export const genColumnsTimeSheet = ({ date }) => {

  const from = dayjs(date).startOf("month"), to = dayjs(date).endOf("month");
  const startMonth = from.get('date'), endOfMonth = to.get('date');

  const titleFirst = `FROM 01 ~ 15/${getMonthName(date)}/${from.get('year')}`;
  const titleSecon = `FROM 15 ~ ${endOfMonth}/${getMonthName(date)}/${from.get('year')}`;
  const libColor = { 'Sun': 'red', 'Sat': 'blue' };

  let firstPartition = [], secondPartition = [];
  for (let d = startMonth; d <= endOfMonth; d++) {
    const current = new Date(from.get('year'), from.get('month'), d);
    const dname = getDayName(current);
    let color = { day: dname, value: d, editBusinessTrip: true, ...(libColor[dname] && { color: libColor[dname] }) };
    if (d <= 15) {
      firstPartition.push(color);
    } else {
      secondPartition.push(color);
    }
  }

  const dataFirst = [{ period: titleFirst, dataPeriods: firstPartition }]
  const dataSecon = [{ period: titleSecon, dataPeriods: secondPartition }]
  return [dataFirst, dataSecon];
}

export const calendarByEvent = (idata, cdata) => {

  let datas = {};
  const IGNIOR = ['9'];

  const createItem = (valuse) => {
    for (let item of valuse) {
      if (IGNIOR.includes(item.calendarId)) {
        continue;
      }
      const { start } = item;
      const day = dayjs(start).get('date');
      if (datas[day]) {
        datas[day].push(item);
      } else {
        datas[day] = [item];
      }
    }
  }

  if (arrayNotEmpty(idata)) {
    createItem(idata);
  }

  if (arrayNotEmpty(cdata)) {
    createItem(cdata);
  }

  return datas;
}

export const dataSourceTimesheet = (user) => user ? ([
  {
    id: 1,
    stt: '1',
    name: user.fullName,
    position: user?.userBranch?.department || '',
    amORpm: 'AM',
    working: {
      am: 0, pm: 0
    },
    businessTrip: {
      am: 0, pm: 0
    },
    weekOff: {
      am: 0, pm: 0
    },
    holiday: {
      am: 0, pm: 0
    },
    annualLeave: {
      am: 0, pm: 0
    },
    sl: {
      am: 0, pm: 0
    }
  },
  {
    id: 2,
    stt: 'Overtime (30min = 0.5)',
    name: '',
    position: '',
    amORpm: 'AM',
    working: 0,
    businessTrip: 0,
    weekOff: 0,
    holiday: 0,
    annualLeave: 0,
    sl: 0
  },
  {
    id: 3,
    stt: <span>Thời gian tính bắt đầu công tác thực tế <br />Business Trip Start Time</span>,
    name: '',
    position: 'A',
    amORpm: 'AM',
    businessTrip: '',
    weekOff: '',
    holiday: '',
    annualLeave: '',
    sl: ''
  },
  {
    id: 4,
    stt: <span>Thời gian kết thúc công tác <br />Business Trip Return Time</span>,
    name: '',
    position: 'A',
    amORpm: 'AM',
    businessTrip: '',
    weekOff: '',
    holiday: '',
    annualLeave: '',
    sl: ''
  }
]) : [];
