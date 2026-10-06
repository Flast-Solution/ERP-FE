import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export const parseDayQuote = value => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) return dayjs(value, 'DD/MM/YYYY', true);
  return dayjs(value);
};

export const formatDayQuoteForPayload = value => {
  const date = parseDayQuote(value);
  return date?.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : null;
};
