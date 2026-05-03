import '@toast-ui/calendar/toastui-calendar.css';
import 'tui-date-picker/dist/tui-date-picker.min.css';
import 'tui-time-picker/dist/tui-time-picker.min.css';
import './style.css';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LeftOutlined, RightOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';

import Calendar from './Calendar';
import { theme } from './theme';
import { buildCalendarsWithNames, clone } from './utils';
import RequestUtils from '@flast-erp/core/utils/RequestUtils';
import { arrayEmpty, dateFormatOnSubmit, formatTime } from '@flast-erp/core/utils/dataUtils';
import useGetMe from '@flast-erp/core/hooks/useGetMe';
import { SUCCESS_CODE } from 'configs';
import dayjs from 'dayjs';
import { cloneDeep, random } from 'lodash';
import UserService from 'services/UserService';
import FormSelectUser from '@/form-flast/FormSelectUser';
import {
  FilterContent,
  SchedulerWrapper,
  SchedulerHeader,
  HeaderLeft,
  HeaderTitle,
  NavGroup,
  NavButton,
  TodayButton,
  CalendarBody
} from './styles';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';
import { HASH_POPUP } from '@/configs/constant';

const MyScheduner = ({
  showTimeSheet = (value) => value
}) => {

  const { t, i18n } = useTranslation();
  const calendars = useMemo(() => buildCalendarsWithNames(t), [t]);
  const dayNames = useMemo(
    () => [
      t('calendarPage.day.sun'),
      t('calendarPage.day.mon'),
      t('calendarPage.day.tue'),
      t('calendarPage.day.wed'),
      t('calendarPage.day.thu'),
      t('calendarPage.day.fri'),
      t('calendarPage.day.sat'),
    ],
    [t],
  );

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

  const dayjsLocale = String(i18n.language || 'vi').toLowerCase().startsWith('vi') ? 'vi' : 'en';

  useEffect(() => {
    dayjs.locale(dayjsLocale);
  }, [dayjsLocale]);

  const calendarTemplates = useMemo(() => ({
    milestone(event) {
      return `<span style="color: #fff; background-color: ${event.backgroundColor};">${event.title}</span>`;
    },
    allday(event) {
      return `[${t('calendarPage.allDayPrefix')}] ${event.title}`;
    },
    time(event) {
      const [ uName ] = event.attendees;
      const tStart = formatTime(event.start, "HH:mm");
      return String(uName ? '[' + uName + ']' : '').concat(" ").concat(tStart).concat(" ").concat(event.title);
    },
    /* Form popup (create / edit) — Toast UI template hooks */
    popupIsAllday: () => t('calendarPage.popup.allDay'),
    popupStateFree: () => t('calendarPage.popup.free'),
    popupStateBusy: () => t('calendarPage.popup.busy'),
    titlePlaceholder: () => t('calendarPage.popup.subject'),
    locationPlaceholder: () => t('calendarPage.popup.location'),
    startDatePlaceholder: () => t('calendarPage.popup.startDatePlaceholder'),
    endDatePlaceholder: () => t('calendarPage.popup.endDatePlaceholder'),
    popupSave: () => t('calendarPage.popup.save'),
    popupUpdate: () => t('calendarPage.popup.update'),
    popupEdit: () => t('calendarPage.popup.edit'),
    popupDelete: () => t('calendarPage.popup.delete'),
    popupDetailState({ state }) {
      if (state === 'Free') return t('calendarPage.popup.free');
      if (state === 'Busy' || !state) return t('calendarPage.popup.busy');
      return state;
    },
    monthGridHeaderExceed(hiddenEventsCount) {
      return t('calendarPage.popup.moreEvents', { count: hiddenEventsCount });
    },
    weekGridFooterExceed(hiddenEventsCount) {
      return t('calendarPage.popup.moreEvents', { count: hiddenEventsCount });
    },
  }), [t]);

  const timezoneZones = useMemo(() => ([
    { timezoneName: 'Asia/Ho_Chi_Minh', displayLabel: t('calendarPage.timezoneHanoi'), tooltip: 'UTC+07:00' },
    { timezoneName: 'Asia/Tokyo', displayLabel: t('calendarPage.timezoneTokyo'), tooltip: 'UTC+09:00' }
  ]), [t]);

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
    title: t('calendarPage.popupAddTitle'),
    data: {
      callback: (_) => setFilter((pre) => ({ ...pre, random: random() }))
    }
  });

  const onToday = () => {
    const calInstance = getCalInstance();
    if (calInstance) {
      calInstance.today();
      updateRenderRangeText();
    }
  };

  /** Tháng/năm header — luôn theo i18n (tránh locale mặc định EN trước khi useEffect chạy) */
  const headerDateLabel = useMemo(() => {
    const raw = selectedDateRangeText;
    if (!raw) return '';
    const loc = dayjsLocale;

    const monthOnly = raw.match(/^(\d{4})-(\d{1,2})$/);
    if (monthOnly) {
      const y = parseInt(monthOnly[1], 10);
      const m = parseInt(monthOnly[2], 10);
      return dayjs(new Date(y, m - 1, 1)).locale(loc).format('MMMM YYYY');
    }

    const dayOnly = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (dayOnly) {
      const y = parseInt(dayOnly[1], 10);
      const mo = parseInt(dayOnly[2], 10);
      const d = parseInt(dayOnly[3], 10);
      return dayjs(new Date(y, mo - 1, d)).locale(loc).format('D MMMM YYYY');
    }

    return raw;
  }, [selectedDateRangeText, dayjsLocale]);

  return (
    <SchedulerWrapper>
      <SchedulerHeader>
        <HeaderLeft>
          <div className="scheduler-nav-main">
            <HeaderTitle>{headerDateLabel}</HeaderTitle>
            <NavGroup style={{ marginLeft: 16 }}>
              <button
                type="button"
                className="scheduler-nav-arrow"
                onClick={() => onClickNavi("prev")}
                aria-label={t('calendarPage.ariaPrev')}
              >
                <LeftOutlined />
              </button>
              <button
                type="button"
                className="scheduler-nav-arrow"
                onClick={() => onClickNavi("next")}
                aria-label={t('calendarPage.ariaNext')}
              >
                <RightOutlined />
              </button>
            </NavGroup>
            <TodayButton onClick={onToday}>{t('calendarPage.today')}</TodayButton>
          </div>
          <nav className="scheduler-view-nav">
            <NavButton
              className={selectedView === 'day' ? 'active' : ''}
              onClick={() => setSelectedView('day')}
            >
              {t('calendarPage.viewDay')}
            </NavButton>
            <NavButton
              className={selectedView === 'week' ? 'active' : ''}
              onClick={() => setSelectedView('week')}
            >
              {t('calendarPage.viewWeek')}
            </NavButton>
            <NavButton
              className={selectedView === 'month' ? 'active' : ''}
              onClick={() => setSelectedView('month')}
            >
              {t('calendarPage.viewMonth')}
            </NavButton>
          </nav>
          <FilterContent className="scheduler-filter" style={{ marginLeft: 0, flex: 1 }} gutter={12}>
            <Col xs={24} md={12} lg={8}>
              <FormSelectUser
                allowClear
                placeholder={t('calendarPage.selectAccount')}
                onChange={(value) => setFilter((pre) => ({ ...pre, userIds: value }))}
                name="userIds"
              />
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Button type="primary" icon={<PlusOutlined />} onClick={onCreateAction}>
                {t('calendarPage.addEvent')}
              </Button>
            </Col>
          </FilterContent>
        </HeaderLeft>
        <NavGroup>
          <Button type="primary" ghost onClick={() => showTimeSheet(true)}>{t('calendarPage.timesheet')}</Button>
          <Button style={{ marginLeft: 8 }} onClick={() => showTimeSheet(false)}>{t('calendarPage.scheduler')}</Button>
        </NavGroup>
      </SchedulerHeader>
      <CalendarBody className="scheduler-calendar-body">
      <Calendar
        height="calc(100vh - 180px)"
        calendars={calendars}
        month={{ startDayOfWeek: 1, dayNames }}
        events={dataCalender}
        template={calendarTemplates}
        theme={theme}
        timezone={{ zones: timezoneZones }}
        useDetailPopup={true}
        useFormPopup={true}
        view={selectedView}
        week={{
          startDayOfWeek: 1,
          dayNames,
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
      </CalendarBody>
    </SchedulerWrapper>
  );
}

export default MyScheduner;