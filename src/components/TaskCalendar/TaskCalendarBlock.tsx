import { CalendarPeriod, RenderCellProps, TaskCalendar } from './TaskCalendar.tsx';
import React, { useMemo } from 'react';
import { ScheduledTask, ScheduleFullResult } from '../../services/schedule/schedule.types.ts';
import { Empty, Tooltip, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { clsx } from 'clsx';
const { Text } = Typography;
interface TaskCalendarBlockProps {
  schedule?: ScheduleFullResult;
}

const isInRange = (current: Dayjs, event: ScheduledTask) => {
  return !current.isBefore(event.start, 'day') && !current.isAfter(event.end, 'day');
};

const getRangePosition = (current: Dayjs, event: ScheduledTask): string[] => {
  const result = [];
  const starts = current.isSame(event.start, 'day');
  const ends = current.isSame(event.end, 'day');
  const single = starts && ends;

  const halfStart = starts && event.startHour == 13;
  const halfEnd = ends && event.endHour == 13;

  if (single) {
    result.push('bar__single');
  }

  if (!single && starts) {
    result.push('bar__start');
  }

  if (!single && ends) {
    result.push('bar__end');
  }

  if (starts && halfStart) {
    result.push('bar__halfStart');
  }

  if (ends && halfEnd) {
    result.push('bar__halfEnd');
  }

  if (!starts && !ends) {
    result.push('bar__middle');
  }

  return result;
};

const getTitleByPosition = (position: string[]): boolean => {
  if (position && position.length > 0) {
    return position.includes('bar__single') || position.includes('bar__start');
  }

  return false;
};

const TaskCalendarBlock = ({ schedule }: TaskCalendarBlockProps) => {
  const period = useMemo((): CalendarPeriod => {
    const start = schedule?.periodStart || dayjs();
    const end = schedule?.periodEnd || dayjs();
    return [start, end];
  }, [schedule]);

  const renderCell = ({ date, isHoliday, isWorkingWeekend }: RenderCellProps): React.ReactNode => {
    const currentEvents = schedule?.tasks.filter((item) => isInRange(date, item));
    const holiday = (
      <Tooltip title="Нерабочий праздничный день" color="green">
        <span>{date.date()}</span>
      </Tooltip>
    );

    const workingWeekend = (
      <Tooltip title="Рабочие выходные :(" color={'#780513'}>
        <span>{date.date()}</span>
      </Tooltip>
    );

    const simpleDay = <span>{date.date()}</span>;

    return (
      <div className="cell">
        <div className="list">
          <div className="cell__date">
            {isWorkingWeekend ? workingWeekend : isHoliday ? holiday : simpleDay}
          </div>

          <div className="bar__wrapper">
            {currentEvents?.map((event) => {
              const position = getRangePosition(date, event);
              const showTitle = getTitleByPosition(position);
              return (
                <span
                  key={event.name}
                  className={clsx('bar', position)}
                  style={{ backgroundColor: event.color }}
                >
                  {showTitle && (
                    <Text className="bar__tag" ellipsis={{ tooltip: `${event.name}` }}>
                      {event.name}
                    </Text>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="task-calendar">
      {schedule ? (
        <TaskCalendar period={period} renderCell={renderCell} />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Заполните данные для расчета" />
      )}
    </div>
  );
};

export default TaskCalendarBlock;
