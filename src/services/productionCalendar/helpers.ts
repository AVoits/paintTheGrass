import { Dayjs } from 'dayjs';
import { PROD_CALENDAR_FORMAT, productionCalendarData } from './productionCalendarData.ts';
import { PeriodCalendar } from '../schedule/schedule.types.ts';
import {
  CalendarYear,
  ProductionCalendarDataType,
  ProductionDataState,
} from './prodCalendat.types.ts';

const isCalendarYear = (year: string): year is CalendarYear => year in productionCalendarData;

export const getProductionState = (current: Dayjs): ProductionDataState => {
  const year = current.year().toString();

  if (!isCalendarYear(year)) {
    return {
      year: current.year(),
      holidays: false,
      workingWeekends: false,
      shortDays: false,
    };
  }

  const prodData = productionCalendarData[year];

  const formatted = current.format(PROD_CALENDAR_FORMAT);

  return {
    year: current.year(),
    holidays: prodData?.holidays.includes(formatted),
    workingWeekends: prodData?.workingWeekends
      ? prodData.workingWeekends.includes(formatted)
      : false,
    shortDays: prodData?.shortDays ? prodData?.shortDays.includes(formatted) : false,
  };
};

export const getPeriodCalendar = (
  periodStart: Dayjs,
  periodEnd: Dayjs,
  calendar: ProductionCalendarDataType,
): PeriodCalendar => {
  const result: PeriodCalendar = {
    holidays: new Set(),
    workingWeekends: new Set(),
    shortDays: new Set(),
  };

  if (periodEnd?.isBefore(periodStart, 'day')) {
    throw new Error('Дата окончания периода раньше даты начала.');
  }

  let date = periodStart?.startOf('day');
  const endDate = periodEnd?.startOf('day');

  while (date?.isBefore(endDate) || date?.isSame(endDate, 'day')) {
    const yearKey = date.year().toString();
    if (isCalendarYear(yearKey)) {
      const year = calendar[yearKey];
      const dateString = date.format('YYYY-MM-DD');

      if (year) {
        if (year.holidays.includes(dateString)) {
          result.holidays.add(dateString);
        }

        if (year?.workingWeekends?.includes(dateString)) {
          result.workingWeekends.add(dateString);
        }

        if (year?.shortDays?.includes(dateString)) {
          result.shortDays.add(dateString);
        }
      }

      date = date.add(1, 'day');
    }
  }

  return result;
};
