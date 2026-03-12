import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Input, Table, Form, message, Tag } from 'antd';
import {
  yCellDataCreate,
  AMPM,
  COLUMNS_SUMMARY,
  genColumnsTimeSheet,
  calendarByEvent,
  CALEN_CONG_TAC_XA,
  dataSourceTimesheet
} from './utils';
import RequestUtils from 'utils/RequestUtils';
import dayjs from 'dayjs';
import { arrayNotEmpty, dataArray, dataObj, dateFormatOnSubmit, f5List } from 'utils/dataUtils';
import useGetMe from 'hooks/useGetMe';
import { SUCCESS_CODE } from 'configs';
import UserService from 'services/UserService';
import { useUpdateEffect } from 'hooks/MyHooks';
import { cloneDeep } from 'lodash';
import CustomButton from 'components/CustomButton';
import { APP_FOLLOW_STATUS_CONFIRM, APP_FOLLOW_STATUS_DONE, APP_FOLLOW_STATUS_REJECT, APP_FOLLOW_STATUS_WAITING } from 'configs/constant';
import { InAppEvent } from 'utils/FuseUtils';

const ITEM_AMPM_IN_TABLE = 1;
const ITEM_SUMAMY_IN_TABLE = 2;
const EditableContext = React.createContext(null);

const toHours = (min) => {
  if (min <= 0) {
    return "0";
  }
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return String(hours).concat(" H ").concat(minutes);
}

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);
  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };
  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };
  let childNode = children;
  if (editable) {
    childNode = editing ? (
      <Form.Item style={{ margin: 0 }}
        name={dataIndex}
      >
        <Input style={{ width: 80 }} ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingInlineEnd: 10 }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }
  return <td {...restProps}>{childNode}</td>;
};

const sharedOnCell = (_, index) => {
  if (index >= 1) {
    return { colSpan: 0 };
  }
  return {};
};

const TITLE_COLUMNS = [
  {
    title: () => <div>No.<br /> STT</div>,
    dataIndex: 'stt',
    key: 'stt',
    width: 100,
    onCell: (_, index) => ({
      colSpan: index >= 1 ? 4 : 1,
    }),
  },
  {
    title: () => <div>Name<br />Họ và tên</div>,
    dataIndex: 'name',
    key: 'name',
    width: 300,
    onCell: sharedOnCell
  },
  {
    title: () => <div>Position<br />Chức vụ</div>,
    dataIndex: 'position',
    key: 'position',
    width: 300,
    onCell: sharedOnCell
  },
  {
    title: '',
    dataIndex: 'amORpm',
    key: 'amORpm',
    width: 100,
    onCell: sharedOnCell,
    render: (value) => <span>{value} <AMPM /> PM </span>
  }
];

const checkEditInBusinessTrip = (y, aCal, additional) => {
  let iBusinessTrip = aCal[y.value]?.filter(i => i.calendarId === CALEN_CONG_TAC_XA);
  if (arrayNotEmpty(iBusinessTrip)) {
    const { start, end } = iBusinessTrip[0];
    const date = dayjs(start).format("YYYY-MM-DD");
    const dateEdit = additional?.find(i => i.date === date);
    y.dateStartValue = dateEdit?.dateStartValue || dayjs(start).format("HH:mm");
    y.dateEndValue = dateEdit?.dateEndValue || dayjs(end).format("HH:mm");
    return;
  }

  let isExitInAddtion = false;
  for (let item of additional) {
    let date = dayjs(item.date).get("date");
    if (date === y.value) {
      y.dateStartValue = item.dateStartValue;
      y.dateEndValue = item.dateEndValue;
      isExitInAddtion = true;
      break;
    }
  }

  /* Nếu trong additional không có */
  if (!isExitInAddtion) {
    let dayValue = y.value, eItem = null;
    /* eslint-disable-next-line */
    for (const [key, value] of Object.entries(aCal)) {
      const cals = value?.filter(i => i.calendarId === CALEN_CONG_TAC_XA) || [];
      for (let cal of cals) {
        const sDay = dayjs(cal.start).get("date");
        const eDay = dayjs(cal.end).get("date");
        if (sDay <= dayValue && eDay >= dayValue) {
          eItem = cal;
        }
      }
    }
    if (eItem) {
      y.dateStartValue = "00:00";
      y.dateEndValue = "23:59";
    }
  }
}

const TimeSheet = ({
  listTimesheet,
  userId,
  month,
  year
}) => {

  const { user } = useGetMe();
  const [dataSource, setDataSource] = useState([]);
  const [record, setRecord] = useState({});
  const [columns, setColumns] = useState([]);
  const [reload, setReload] = useState(false);

  useEffect(() => {
    if (userId) {
      UserService.fetchId(userId).then(u => u?.id && setDataSource(dataSourceTimesheet(u)));
    } else {
      setDataSource(dataSourceTimesheet(user));
    }
  }, [userId, user]);
  useEffect(() => {
    if (arrayNotEmpty(listTimesheet))
      for (let item of listTimesheet) {
        const { userId: u, month: m, year: y } = item;
        if (u === userId && m === month && y === year) {
          setRecord(item);
          break;
        }
      }
    return () => UserService.timeSheetClear();
  }, [listTimesheet, userId, month, year]);

  const updateSumary = (sumary) => {
    const datas = cloneDeep(dataSource);
    /* Over Time */
    let item = datas.find(i => i.id === ITEM_SUMAMY_IN_TABLE);
    if (item) {
      item.working = toHours(sumary["Working"].ot);
      item.businessTrip = toHours(sumary["businessTrip"].ot);
      item.weekOff = toHours(sumary["Woff"].ot);
      item.holiday = toHours(sumary["holiday"].ot);
      item.sl = toHours(sumary["Working"].ot + sumary["businessTrip"].ot + sumary["Woff"].ot + sumary["holiday"].ot);
    }
    /* AM/PM */
    let aPm = datas.find(i => i.id === ITEM_AMPM_IN_TABLE);
    if (aPm) {
      aPm.weekOff = cloneDeep(sumary.Woff);
      aPm.working = cloneDeep(sumary.Working);
      aPm.businessTrip = cloneDeep(sumary.businessTrip);
      aPm.holiday = cloneDeep(sumary.holiday);
      aPm.annualLeave = cloneDeep(sumary.annualLeave);

      aPm.sl.am = aPm.weekOff.am + aPm.working.am + aPm.businessTrip.am + aPm.holiday.am + aPm.annualLeave.am;
      aPm.sl.pm = aPm.weekOff.pm + aPm.working.pm + aPm.businessTrip.pm + aPm.holiday.am + aPm.annualLeave.pm;
    }
    setDataSource(datas);
  };

  useUpdateEffect(() => {
    let sumary = UserService.getTimeSheetSumary();
    setTimeout(() => updateSumary(sumary), 3000);
  }, [columns])

  const handleSaveRow = useCallback((row) => {
    const { dateEdit, dateStartValue, dateEndValue } = row;
    if (!dateStartValue || !dateEndValue) {
      message.error("Error change time business trip .!");
      return;
    }

    const date = dayjs(new Date(year, month, dateEdit));
    let data = { date, dateStartValue, dateEndValue };
    dateFormatOnSubmit(data, ['date'], "YYYY-MM-DD");
    RequestUtils.Post("/time-sheet/update-additional", data).then(d => {
      if (d.errorCode === SUCCESS_CODE) {
        setReload(pre => !pre);
      }
    })
  }, [month, year]);

  const genarateColumns = useCallback((datas, calendars, additional) => {
    /* 1. Nghỉ hàng tuần, 2. Nghỉ phép, 3. Công tác, 4. Làm hàng ngày */
    /* OT thì check tất cả các ngày */
    const { idata, cdata } = calendars;
    let aCal = calendarByEvent(idata, cdata);
    /* console.log({ aCal }) */
    let iColumns = [];
    const [dataColumnPathOne, dataColumnPathTwo] = datas;

    dataColumnPathOne.forEach(x => {
      let data = { title: x.period, children: [] }
      x.dataPeriods?.forEach(y => {
        checkEditInBusinessTrip(y, aCal, additional);
        data.children.push(yCellDataCreate(y, aCal, handleSaveRow))
      });
      iColumns.push(data);
    });

    dataColumnPathTwo.forEach(x => {
      let data = { title: x.period, children: [] }
      x.dataPeriods?.forEach(y => {
        checkEditInBusinessTrip(y, aCal, additional);
        data.children.push(yCellDataCreate(y, aCal, handleSaveRow));
      });
      iColumns.push(data);
    });
    return [...iColumns, ...COLUMNS_SUMMARY(datas, aCal)];
    /* eslint-disable-next-line */
  }, []);

  useEffect(() => {

    const date = new Date(year, (month - 1), 1);
    let filter = { userIds: [userId], from: dayjs(date).startOf("month"), to: dayjs(date).endOf("month") };
    dateFormatOnSubmit(filter, ['from', 'to']);
    let additionalFilter = { userId, month, year, limit: 100 };

    Promise.all([
      RequestUtils.Get("/calendar/fetch", filter).then(dataArray),
      //RequestUtils.Get("/calendar/fetch", { ...filter, userIds: '0' }).then(dataArray),
      RequestUtils.Get("/time-sheet/get-additional", additionalFilter).then(dataObj).then(d => d?.embedded ?? [])
    ]).then(([idata, additional]) => {
      UserService.timeSheetClear();
      let periods = genColumnsTimeSheet({ date });
      let iColumns = genarateColumns(periods, { idata }, additional);
      setColumns([...TITLE_COLUMNS, ...iColumns]);
    });
    /* eslint-disable-next-line */
  }, [userId, month, year, reload]);

  const components = {
    body: { row: EditableRow, cell: EditableCell }
  };

  const onSubmit = async () => {
    let params = { userId, month, year, status: APP_FOLLOW_STATUS_WAITING }
    const { errorCode } = await RequestUtils.Post("/time-sheet/create-form", params);
    InAppEvent.normalInfo(errorCode === SUCCESS_CODE ? 'Success submit timesheet !' : 'Error submit timesheet !');
    f5List("time-sheet/fetch-tickes");
    return true;
  }

  return (
    <Table
      components={components}
      rowKey={'id'}
      pagination={false}
      scroll={{ x: 2900 }}
      columns={columns}
      dataSource={dataSource}
      bordered
      footer={() => <Footer record={record} onSubmit={onSubmit} />}
    />
  )
}

const Footer = ({ onSubmit, record }) => {

  const { user, isUser, isLeader, isManager } = useGetMe();
  const [loading, setLoading] = useState(false);

  const isShowSend = record?.status === APP_FOLLOW_STATUS_WAITING
    || record?.status === APP_FOLLOW_STATUS_REJECT
    || ((record?.id || '') === '' && isUser());

  const onClick = async () => {
    setLoading(true);
    Promise.resolve(onSubmit()).then(() => setLoading(false));
  }

  const onClickChecked = async (status) => {
    let params = { ...record, status };
    const { errorCode } = await RequestUtils.Post("/time-sheet/create-form", params);
    InAppEvent.normalInfo(errorCode === SUCCESS_CODE ? 'Success confirm timesheet !' : 'Error confirm timesheet !');
    f5List("time-sheet/fetch-tickes");
  }

  if (isLeader() && record?.status === APP_FOLLOW_STATUS_WAITING) {
    return (
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <CustomButton
          title="Checked"
          color="primary"
          variant="outlined"
          loading={loading}
          onClick={() => onClickChecked(APP_FOLLOW_STATUS_CONFIRM)}
        />
      </div>
    )
  }

  if (isManager() && record?.status === APP_FOLLOW_STATUS_CONFIRM) {
    return (
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <CustomButton
          title="Confirm"
          color="primary"
          variant="outlined"
          loading={loading}
          onClick={() => onClickChecked(APP_FOLLOW_STATUS_DONE)}
        />
      </div>
    )
  }

  if (record?.status === APP_FOLLOW_STATUS_DONE) {
    return (
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <Tag color="#3b5999">Đã duyệt / Confirm </Tag>
      </div>
    )
  }

  const isUserOwner = user.id === record.userId && isUser();
  if ((isUserOwner && record?.status === APP_FOLLOW_STATUS_CONFIRM)
    || (isLeader() && record?.status === APP_FOLLOW_STATUS_CONFIRM)
  ) {
    return (
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <Tag color="#3b5999">Đã kiểm trả / Checked </Tag>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'end' }}>
      {isShowSend && user.id === record.userId &&
        <CustomButton
          title="Send Timesheet"
          color="primary"
          variant="outlined"
          loading={loading}
          onClick={() => onClick()}
        />
      }
    </div>
  )
}

export default TimeSheet;