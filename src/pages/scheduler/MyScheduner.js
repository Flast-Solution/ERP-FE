import '@toast-ui/calendar/toastui-calendar.css';
import 'tui-date-picker/dist/tui-date-picker.min.css';
import 'tui-time-picker/dist/tui-time-picker.min.css';
import './style.css';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LeftCircleOutlined, RightCircleOutlined } from '@ant-design/icons';
import { Link } from "react-router-dom";
import { Button, Col, Radio, Row } from 'antd';

import Calendar from './Calendar';
import { theme } from './theme';
import { initialCalendars, clone } from './utils';
import RequestUtils from 'utils/RequestUtils';
import { arrayEmpty, dateFormatOnSubmit, formatTime } from 'utils/dataUtils';
import useGetMe from 'hooks/useGetMe';
import { SUCCESS_CODE } from 'configs';
import dayjs from 'dayjs';
import { cloneDeep, random } from 'lodash';
import UserService from 'services/UserService';
import FormSelectUser from 'components/form/FormSelectUser';
import { FilterContent } from './styles';
import { InAppEvent } from 'utils/FuseUtils';
import { HASH_POPUP } from 'configs/constant';

const MyScheduner = ({
  showTimeSheet = (value) => value
}) => {

  const calendarRef = useRef(null);
  const [selectedDateRangeText, setSelectedDateRangeText] = useState('');
  const [selectedView, setSelectedView] = useState("month");
  const { user } = useGetMe();

  const [filter, setFilter] = useState({
    from: dayjs().startOf('month'),
    to: dayjs().endOf('month')
  });
  const [dataCalender, setDataCalender] = useState([]);

  useEffect(() => {
    let dataFilter = cloneDeep(filter);
    dateFormatOnSubmit(dataFilter, ['from', 'to']);
    RequestUtils.Get("/calendar/fetch", dataFilter).then(async ({ data, errorCode }) => {
      if (errorCode !== SUCCESS_CODE || arrayEmpty(data)) {
        setDataCalender([]);
        return;
      }
      
      let uIds = data.map(i => i.userId);
      await UserService.loadByIds(uIds);
      for (let item of data) {
        item.start = clone(item.start);
        item.end = clone(item.end);
        item.attendees = [ UserService.fetchSSoById(item.userId) ];
        item.isReadOnly = item.userId !== user.id;
      }
      setDataCalender(data);
    });
  }, [filter, user]);

  const getCalInstance = useCallback(() => calendarRef.current?.getInstance?.(), []);
  const updateRenderRangeText = useCallback(() => {
    const calInstance = getCalInstance();
    if (!calInstance) {
      setSelectedDateRangeText('');
    }

    const viewName = calInstance.getViewName();
    const calDate = calInstance.getDate();
    const rangeStart = calInstance.getDateRangeStart();
    const rangeEnd = calInstance.getDateRangeEnd();

    let year = calDate.getFullYear();
    let month = calDate.getMonth() + 1;
    let date = calDate.getDate();
    let dateRangeText;
    switch (viewName) {
      case 'month': {
        dateRangeText = `${year}-${month}`;
        const from = dayjs(new Date(year, month - 1, 1), "YYYY-MM-DD 00:00:00");
        const to = from.endOf('month');
        setFilter(pre => ({ ...pre, from, to }));
        break;
      }
      case 'week': {
        year = rangeStart.getFullYear();
        month = rangeStart.getMonth() + 1;
        date = rangeStart.getDate();
        const endMonth = rangeEnd.getMonth() + 1;
        const endDate = rangeEnd.getDate();
        const start = `${year}-${month < 10 ? '0' : ''}${month}-${date < 10 ? '0' : ''}${date}`;
        const end = `${year}-${endMonth < 10 ? '0' : ''}${endMonth}-${endDate < 10 ? '0' : ''}${endDate}`;
        dateRangeText = `${start} ~ ${end}`;
        break;
      }
      default:
        dateRangeText = `${year}-${month}-${date}`;
    }
    setSelectedDateRangeText(dateRangeText);
  }, [getCalInstance]);

  useEffect(() => {
    updateRenderRangeText();
  }, [selectedView, updateRenderRangeText]);

  const onAfterRenderEvent = (res) => {
    /*
    console.group('onAfterRenderEvent');
    console.log('Event Info : ', res);
    console.groupEnd();
    */
  };

  const onBeforeDeleteEvent = (res) => {
    const { id, calendarId } = res;
    getCalInstance().deleteEvent(id, calendarId);
    RequestUtils.Post("/calendar/delete", { id });
  };

  const onChangeSelect = (ev) => {
    setSelectedView(ev?.target?.value ?? 'month');
  };

  const onClickDayName = (res) => {
    /*
    console.group('onClickDayName');
    console.log('Date : ', res.date);
    console.groupEnd();
    */
  };

  /** @breif eslint-disable-next-line
   * KHi useCreationPopup: false, useDetailPopup: false
   * Thì sẽ không bật Form nên action này để custome Form
   */
  const onClickNavi = (action) => {
    getCalInstance()[action]();
    updateRenderRangeText();
  };

  const onClickEvent = (res) => {
    /*
    console.group('onClickEvent');
    console.log('MouseEvent : ', res.nativeEvent);
    console.log('Event Info : ', res.event);
    console.groupEnd();
    */
  };

  const onClickTimezonesCollapseBtn = (timezoneCollapsed) => {
    /*
    console.group('onClickTimezonesCollapseBtn');
    console.log('Is Timezone Collapsed?: ', timezoneCollapsed);
    console.groupEnd();
    */
    const newTheme = {
      'week.daygridLeft.width': '100px',
      'week.timegridLeft.width': '100px',
    };
    getCalInstance().setTheme(newTheme);
  };

  const onBeforeUpdateEvent = (updateData) => {
    const targetEvent = updateData.event;
    const changes = { ...updateData.changes };
    const { start, end, ...values } = targetEvent;
    const [ ssoId ] = targetEvent.attendees;
    const userId = UserService.fetchIdBySSoId(ssoId);
    let data = { ...values, ...changes, userId, start: start.d?.d, end: end.d?.d };
    dateFormatOnSubmit(data, ['start', 'end']);
    RequestUtils.Post("/calendar/create", data);
    getCalInstance().updateEvent(targetEvent.id, targetEvent.calendarId, changes);
  };

  const onBeforeCreateEvent = useCallback(async (eventData) => {
    let event = {
      calendarId: eventData.calendarId || '0',
      id: String(Math.random()),
      title: eventData.title,
      isAllday: eventData.isAllday,
      start: eventData.start,
      end: eventData.end,
      category: eventData.isAllday ? 'allday' : 'time',
      dueDateClass: '',
      location: eventData.location,
      state: eventData.state,
      isPrivate: eventData.isPrivate,
      isVisible: true,
      isReadOnly: false,
      isPending: false,
      isFocused: false,
      userId: user.id
    };
    const { id, start, end, ...values } = event;
    let data = { ...values, start: start.d?.d, end: end.d?.d };
    dateFormatOnSubmit(data, ['start', 'end']);
    const { data: ret, errorCode } = await RequestUtils.Post("/calendar/create", { ...data });
    if (errorCode === SUCCESS_CODE && (ret.id ?? 0) !== 0) {
      event.id = String(ret.id);
      getCalInstance().createEvents([event]);
    }
  }, [user, getCalInstance]);

  const onCreateAction = () => InAppEvent.emit(HASH_POPUP, {
    hash: 'calendar.add',
    title: 'Add new Scheduner (Ex: Meet, Holiday ...)',
    data: {
      callback: (_) => setFilter((pre) => ({ ...pre, random: random() }))
    }
  });

  return (
    <div>
      <Row style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Col className='c__action_calender' xs={24} md={19}>
          <Link className="c__today" to="#">Today</Link>
          <LeftCircleOutlined onClick={() => onClickNavi("prev")} style={{ fontSize: 25, paddingLeft: 10, cursor: 'pointer' }} />
          <RightCircleOutlined onClick={() => onClickNavi("next")} style={{ fontSize: 25, paddingLeft: 10, cursor: 'pointer' }} />
          <span style={{ fontSize: 15, paddingLeft: 10 }}>{selectedDateRangeText}</span>
          <div className='hidden-xs'>
            <Radio.Group value={'small'} onChange={onChangeSelect} style={{ marginLeft: 15 }}>
              <Radio.Button value="day">Ngày</Radio.Button>
              <Radio.Button value="week">Tuần</Radio.Button>
              <Radio.Button value="month">Tháng</Radio.Button>
            </Radio.Group>
          </div>
          <FilterContent className='filter'>
            <Col xs={24} md={19}>
              <FormSelectUser
                allowClear
                name={"userIds"}
                placeholder="Chọn tài khoản"
                onChange={(value) => setFilter((pre) => ({ ...pre, userIds: value }))}
              />
            </Col>
            <Col xs={24} md={5}>
              <Button
                onClick={() => onCreateAction()}
                color="danger"
                variant="outlined"
                style={{ marginLeft: 10 }}
              >
                + Add Scheduler
              </Button>
            </Col>
          </FilterContent>
        </Col>
        <Col className='c__action_table m-top-20-xs' xs={24} md={5}>
          <Button color="primary" variant="dashed" onClick={() => showTimeSheet(true)}>Timesheet</Button>
          <Button color="danger" variant="outlined" style={{ marginLeft: 10 }} onClick={() => showTimeSheet(false)}>Scheduler</Button>
        </Col>
      </Row>
      <Calendar
        height="100vh"
        calendars={initialCalendars}
        month={{ startDayOfWeek: 1 }}
        events={dataCalender}
        template={{
          milestone(event) {
            return `<span style="color: #fff; background-color: ${event.backgroundColor};">${event.title}</span>`;
          },
          allday(event) {
            return `[All day] ${event.title}`;
          },
          time(event) {
            const [ uName ] = event.attendees;
            const tStart = formatTime(event.start, "HH:mm");
            const showName = String(uName ? '[' + uName + ']' : '').concat(" ").concat(tStart).concat(" ").concat(event.title)
            return showName;
          }
        }}
        theme={theme}
        timezone={{
          zones: [
            { timezoneName: 'Asia/Ho_Chi_Minh', displayLabel: 'HaNoi', tooltip: 'UTC+07:00' },
            { timezoneName: 'Asia/Tokyo', displayLabel: 'Tokyo', tooltip: 'UTC+09:00' }
          ]
        }}
        useDetailPopup={true}
        useFormPopup={true}
        view={selectedView}
        week={{
          showTimezoneCollapseButton: true,
          timezonesCollapsed: false,
          eventView: true,
          taskView: true,
        }}
        ref={calendarRef}
        onAfterRenderEvent={onAfterRenderEvent}
        onBeforeDeleteEvent={onBeforeDeleteEvent}
        onClickDayname={onClickDayName}
        onClickEvent={onClickEvent}
        onClickTimezonesCollapseBtn={onClickTimezonesCollapseBtn}
        onBeforeUpdateEvent={onBeforeUpdateEvent}
        onBeforeCreateEvent={onBeforeCreateEvent}
      />
    </div>
  );
}

export default MyScheduner;