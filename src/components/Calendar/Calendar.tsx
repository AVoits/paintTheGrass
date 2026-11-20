import React, { useEffect, useMemo } from 'react';
import { Calendar, Empty, theme } from 'antd';
import { clsx } from 'clsx';
import type { Dayjs } from 'dayjs';
import { ScheduledTask, ScheduleFullResult } from '../../services/schedule/schedule.types.ts';
import { createTaskColorGenerator } from '../../services/schedule/taskColorGenerator.ts';
import type { CellRenderInfo } from '@rc-component/picker/interface';

import './calendar.css';

const isInRange = (current: Dayjs, event: ScheduledTask) => {
  return !current.isBefore(event.start, 'day') && !current.isAfter(event.end, 'day');
};

const getRangePosition = (current: Dayjs, event: ScheduledTask) => {
  const starts = current.isSame(event.start, 'day');
  const ends = current.isSame(event.end, 'day');

  if (starts && ends) {
    return 'single';
  }

  if (starts) {
    return 'start';
  }

  if (ends) {
    return 'end';
  }

  return 'middle';
};

export const CalendarBlock: React.FC<{ schedule?: ScheduleFullResult }> = ({ schedule }) => {
  const { token } = theme.useToken();
  const colorGenerator = useMemo(() => createTaskColorGenerator(token), [token]);

  const getCell = (date: Dayjs, info: CellRenderInfo<Dayjs>): React.ReactNode => {
    if (info.type !== 'date' || !schedule?.tasks.length) {
      return null;
    }

    const coloredEvents = schedule.tasks.map((el) => {
      // const color = colorGenerator.getNext();

      console.log(el.name, { color: 'red' });
      return { ...el, color: 'red' };
    });

    const currentEvents = coloredEvents.filter((event) => isInRange(date, event));
    console.log('render');
    return (
      <div className="cell">
        <div className="list">
          {currentEvents.map((event) => {
            const position = getRangePosition(date, event);
            const rangeClassName = {
              start: 'barStart',
              middle: 'barMiddle',
              end: 'barEnd',
              single: 'barSingle',
            }[position];
            return (
              <span
                key={event.name}
                className={clsx('bar', rangeClassName)}
                style={{ backgroundColor: event.color }}
              >
                {position === 'start' || position === 'single' ? event.name : null}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return schedule ? (
    <div className="wrapper">
      <Calendar
        defaultValue={schedule.periodStart}
        cellRender={getCell}
        classNames={{
          item: 'item',
          itemContent: 'itemContent',
        }}
      />
    </div>
  ) : (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
  );
};
