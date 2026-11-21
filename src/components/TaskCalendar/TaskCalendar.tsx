import React from 'react';
import { Dayjs } from 'dayjs';
import './TaskCalendar.css';
import { productionCalendarData } from '../../services/productionCalendar/productionCalendarData.ts';

export type CalendarPeriod = [Dayjs, Dayjs];
export type CalendarWeek = Dayjs[];

export interface CalendarGrid {
  period: CalendarPeriod;
  weeks: CalendarWeek[];
}

export interface CalendarCellProps {
  date: Dayjs;
  isCurrentMonth: boolean;
  isCurrentYear: boolean;
  isInPeriod: boolean;
}

export interface RenderCellProps extends CalendarCellProps {
  isWeekend: boolean;
  isWorkingWeekend: boolean;
  isHoliday: boolean;
}

export interface TaskCalendarProps {
  period: CalendarPeriod;
  renderCell?: (props: RenderCellProps) => React.ReactNode;
  className?: string;
}

interface CalendarWeekRowProps {
  week: CalendarWeek;
  period: CalendarPeriod;
  month: number;
  year: number;
  showMonthLabel: boolean;
  renderCell?: TaskCalendarProps['renderCell'];
}

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

// Monday = 0, Sunday = 6
const getMondayOffset = (date: Dayjs): number => (date.day() + 6) % 7;

/**
 * Проверяет, входит ли дата в заданный диапазон включительно.
 */
const isDateInPeriod = (date: Dayjs, periodStart: Dayjs, periodEnd: Dayjs): boolean =>
  !date.isBefore(periodStart, 'day') && !date.isAfter(periodEnd, 'day');

/**
 * Генерирует календарную сетку по полным месяцам,
 * попадающим в выбранный период.
 *
 * Сетка начинается с понедельника и заканчивается воскресеньем.
 * Даты за пределами календарных месяцев заменяются null.
 */
export const generateCalendarGrid = (period: CalendarPeriod): CalendarGrid => {
  const [start, end] = period;

  const periodStart = start.startOf('day');
  const periodEnd = end.startOf('day');

  if (!periodStart.isValid() || !periodEnd.isValid() || periodStart.isAfter(periodEnd, 'day')) {
    return {
      period,
      weeks: [],
    };
  }

  // Полные месяцы календаря
  const calendarStart = periodStart.startOf('month');
  const calendarEnd = periodEnd.endOf('month');

  // Начало сетки: понедельник первой календарной недели
  const gridStart = calendarStart.subtract(getMondayOffset(calendarStart), 'day');

  // Конец сетки: воскресенье последней календарной недели
  const gridEnd = calendarEnd.add(6 - getMondayOffset(calendarEnd), 'day');

  const weeks: CalendarWeek[] = [];
  let current = gridStart;

  while (!current.isAfter(gridEnd, 'day')) {
    const week: CalendarWeek = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      week.push(current);
      current = current.add(1, 'day');
    }

    weeks.push(week);
  }

  return {
    period: [periodStart, periodEnd],
    weeks,
  };
};

/**
 * Определяет месяц, которому принадлежит календарная неделя.
 * Если неделя содержит первое число месяца, используем этот месяц,
 * иначе ориентируемся на первую реальную дату недели.
 */
const getWeekMonth = (week: CalendarWeek): Dayjs | undefined =>
  week.find((date) => date.date() === 1) ?? week[0];

/**
 * Строка календаря.
 */
const CalendarWeekRow: React.FC<CalendarWeekRowProps> = ({
  week,
  period,
  month,
  year,
  showMonthLabel,
  renderCell,
}) => {
  const [periodStart, periodEnd] = period;

  return (
    <div className="task-calendar__week">
      <div className="task-calendar__month-label">
        {showMonthLabel ? (
          <div className="task-calendar__month-label__text">{MONTH_NAMES[month]}</div>
        ) : (
          ''
        )}
      </div>

      {week.map((date) => {
        const isInPeriod = isDateInPeriod(date, periodStart, periodEnd);

        const isCurrentMonth = date.month() === month && date.year() === year;

        const isCurrentYear = date.year() === year;
        const isWeekend = date.day() === 0 || date.day() === 6;

        const yearKey = date.year().toString() as keyof typeof productionCalendarData;

        const isWorkingWeekend =
          isWeekend &&
          (productionCalendarData[yearKey]?.workingWeekends ?? []).includes(
            date.format('YYYY-MM-DD'),
          );

        const isHoliday = (productionCalendarData[yearKey]?.holidays ?? []).includes(
          date.format('YYYY-MM-DD'),
        );

        const cellClassName = [
          'task-calendar__day',
          isInPeriod ? 'task-calendar__day--in-period' : 'task-calendar__day--outside-period',
          !isCurrentMonth ? 'task-calendar__day--outside' : '',
          isWeekend ? 'task-calendar__day--weekend' : '',
          isWorkingWeekend ? 'task-calendar__day--working-weekend' : '',
          isHoliday ? 'task-calendar__day--holiday' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={date.format('YYYY-MM-DD')} className={cellClassName}>
            {renderCell
              ? renderCell({
                  date,
                  isCurrentMonth,
                  isCurrentYear,
                  isInPeriod,
                  isHoliday,
                  isWeekend,
                  isWorkingWeekend,
                })
              : date.date()}
          </div>
        );
      })}
    </div>
  );
};

const hasMonthDaysInPeriod = (
  month: Dayjs,
  weeks: CalendarWeek[],
  period: CalendarPeriod,
): boolean => {
  const [periodStart, periodEnd] = period;

  return weeks.some((week) =>
    week.some(
      (date) =>
        date.month() === month.month() &&
        date.year() === month.year() &&
        isDateInPeriod(date, periodStart, periodEnd),
    ),
  );
};

/**
 * Основной компонент TaskCalendar.
 */
export const TaskCalendar: React.FC<TaskCalendarProps> = ({ period, renderCell, className }) => {
  const calendar = generateCalendarGrid(period);

  return (
    <div className={['task-calendar__grid', className ?? ''].filter(Boolean).join(' ')}>
      {/* Заголовок дней недели */}
      <div className="task-calendar__weekdays">
        <div className="task-calendar__month-column" />

        {WEEK_DAYS.map((day) => (
          <div key={day} className="task-calendar__weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Строки календаря */}
      {calendar.weeks.map((week, weekIndex) => {
        const weekMonth = getWeekMonth(week);

        if (!weekMonth) {
          return null;
        }

        const previousWeekMonth = calendar.weeks[weekIndex - 1]
          ? getWeekMonth(calendar.weeks[weekIndex - 1])
          : undefined;

        const showMonthLabel =
          hasMonthDaysInPeriod(weekMonth, calendar.weeks, calendar.period) &&
          weekMonth.format('YYYY-MM') !== previousWeekMonth?.format('YYYY-MM');

        return (
          <CalendarWeekRow
            key={weekIndex}
            week={week}
            period={calendar.period}
            month={weekMonth.month()}
            year={weekMonth.year()}
            showMonthLabel={showMonthLabel}
            renderCell={renderCell}
          />
        );
      })}
    </div>
  );
};
