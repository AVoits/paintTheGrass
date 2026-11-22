import { ScheduleFullResult } from '../schedule/schedule.types.ts';
import { createCalendarContent } from './IcsCreater.ts';

export const exportScheduleToIcs = (
  result: ScheduleFullResult,
  fileName = 'schedule.ics',
): void => {
  const content = createCalendarContent(result);

  const blob = new Blob([content], {
    type: 'text/calendar;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName.endsWith('.ics') ? fileName : `${fileName}.ics`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};
