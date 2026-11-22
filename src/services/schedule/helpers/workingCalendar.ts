// ======================================================
// WORKING CALENDAR
// ======================================================

import type { Dayjs } from 'dayjs';
import { PeriodCalendar } from '../schedule.types.ts';

/**
 * Проверяет, является ли дата рабочей.
 * dayjs.day():
 * 0 - воскресенье
 * 6 - суббота
 */
export const isWorkingDay = (date: Dayjs, calendar: PeriodCalendar): boolean => {
  const dateString = date.format('YYYY-MM-DD');

  if (calendar.holidays.has(dateString)) {
    return false;
  }

  if (calendar.workingWeekends.has(dateString)) {
    return true;
  }

  return date.day() !== 0 && date.day() !== 6;
};
