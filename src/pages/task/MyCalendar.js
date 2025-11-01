import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { message } from 'antd';
import dayjs from 'dayjs';
import { InAppEvent } from 'utils/FuseUtils';
import { HASH_POPUP } from 'configs/constant';
import RequestUtils from 'utils/RequestUtils';
import { useParams } from 'react-router-dom';
import { useEffectAsync } from 'hooks/MyHooks';
import { EventTime, EventTitle, EventContainer, LayoutWrapper } from './style'

export default function MyCalendar() {
  
  const { id: projectId } = useParams();
  const [ events, setEvents ] = useState([]);

  useEffectAsync(async () => {
    const { data, errorCode } = await RequestUtils.Get("/works/find/" + projectId);
    if(errorCode !== 200) {
      return;
    }
    const { tasks } = data;
    setEvents(tasks.map(i => ({...i, id: String(i.taskIdentity)})))
  }, [projectId]);

  const handleDelete = async (id) => {
    const { errorCode, message: MSG } = await RequestUtils.Post(String("/works/delete/task/").concat(id), {});
    message.success(MSG);
    if(errorCode === 200) {
      setEvents(events.filter(event => event.id !== id));
    }
  };

  const handleSubmit = async (id, values) => {
    try {
      const { dateRange, ...params } = values;
      const [ startDate, endDate ] = values.dateRange;
      const newEvent = {
        id: id || Date.now().toString(),
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        ...params
      };
      if (id) {
        setEvents(events.map(event => event.id === id ? newEvent : event));
      } else {
        setEvents([...events, newEvent]);
      }
      let { id: taskIdentity, ...dataPost } = newEvent;
      let { message: MSG, data } = await RequestUtils.Post("/works/save/task", {
        ...dataPost,
        projectId,
        taskIdentity
      });
      message.success(MSG);
      return data?.taskIdentity || '';
    } catch (error) {
      console.log('Validate Failed:', error);
    }
    return '';
  };

  const handleDateClick = (arg) => {
    const event = { start: arg.dateStr, end: arg.dateStr }
    InAppEvent.emit(HASH_POPUP, {
      hash: "task.add",
      title: "Cập nhật công việc dự án",
      data: { record: event, onSave: handleSubmit, onDelete: handleDelete }
    });
  };

  const handleEventClick = ({ event }) => {
    InAppEvent.emit(HASH_POPUP, {
      hash: "task.add",
      title: "Cập nhật công việc dự án",
      data: { record: event, onSave: handleSubmit, onDelete: handleDelete }
    })
  };

  const eventContent = (eventInfo) => (
    <EventContainer>
      <EventTitle title={eventInfo.event.title}>
        {eventInfo.event.title}
      </EventTitle>
      <EventTime>
        [ {eventInfo.event?.extendedProps?.ssoId} ] {dayjs(eventInfo.event.start).format('HH:mm')} - {dayjs(eventInfo.event.end).format('HH:mm')}
      </EventTime>
    </EventContainer>
  );

  return (
    <LayoutWrapper className="min-h-screen bg-gray-50 p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        initialView="dayGridMonth"
        events={events.map(event => ({
          ...event,
          backgroundColor: event.color,
          borderColor: event.color
        }))}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventContent={eventContent}
        timeZone="Asia/Ho_Chi_Minh"
        locale="vi"
        buttonText={{
          today: 'Hôm nay',
          month: 'Tháng',
          week: 'Tuần',
          day: 'Ngày',
          list: 'Danh sách'
        }}
        allDayText="Cả ngày"
        moreLinkText={(num) => `+ ${num} Sự kiện`}
        noEventsText="Không có sự kiện nào để hiển thị"
      />
    </LayoutWrapper>
  )
};
