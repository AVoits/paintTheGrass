import dayjs from 'dayjs';
import { createTaskEvent } from './IcsCreater.ts';

it.each([
  { endDate: '2026-06-18', duration: 4, expectedEnd: '20260618T130000' },
  { endDate: '2026-06-19', duration: 12, expectedEnd: '20260619T130000' },
])('exports the start and end times for a task ending on $endDate', (testCase) => {
  const { endDate, duration, expectedEnd } = testCase;
  const event = createTaskEvent({
    name: 'Task',
    originalDurationHours: duration,
    durationHours: duration,
    start: dayjs('2026-06-18'),
    end: dayjs(endDate),
    startHour: 9,
    endHour: 13,
    color: 'blue',
    reduced: false,
  });

  expect(event.filter((line) => /^DT(START|END):/.test(line))).toEqual([
    'DTSTART:20260618T090000',
    `DTEND:${expectedEnd}`,
  ]);
});
