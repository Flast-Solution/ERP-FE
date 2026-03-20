import moment from 'moment';
import dayjs from 'dayjs';

export const formatDateDashboard = (text) => {
    if (!text) {
      return null;
    }
    const dateTime = moment(text);
    let formatTime = 'h:mma';
    if (dateTime.minutes() === 0) formatTime = 'ha';
    return dateTime.isSame(moment(), 'year')
      ? dateTime.format(`MMM D, ${formatTime}`)
      : dateTime.format(`MMM D YYYY, ${formatTime}`);
};

export const formatDate = (text, pattern = 'DD-MM-YYYY') => {
  return text ? moment(text).format(pattern) : null;
};

export const formatDateDayjs = (date, pattern = 'DD-MM-YYYY') => {
  return date ? dayjs(date).format(pattern) : null;
}

export const formatBirthday = (text) => {
  return text ? moment(text).format('D MMM YYYY') : null;
};

export const formatDateFromNow = (date, showTime = true) => {
  if (!date) {
    return '';
  }
  if (moment().isAfter(date)) {
    /* nếu nhỏ hơn 2 ngày: TODAY , 1 day before */
    if (moment().diff(moment(date).startOf('day'), 'days') < 2) {
      return moment(date).fromNow();
    }
    /* nếu trong năm */
    if (moment(date).isSame(moment(), 'year')) {
      return showTime ? moment(date).format('D MMM, HH:mm') : moment(date).format('D MMM');
    }
    /* lớn hơn năm hiện tại */
    return showTime ? moment(date).format('D MMM YYYY, HH:mm') : moment(date).format('D MMM YYYY');
  }
  return 'Now';
};

export const formatInitialValueDateInput = (value) =>
  value ? moment(value) : null;

export const formatDateTimeComplete = (text) => {
  return text ? moment(text).format('HH:mm DD/MM/YYYY') : null;
};
