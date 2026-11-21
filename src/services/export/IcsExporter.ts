import { ScheduleFullResult } from '../schedule/schedule.types.ts';

const CRLF = '\r\n';

const escapeIcsText = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');

const formatIcsDate = (date: ScheduleFullResult['periodStart']): string =>
  date.format('YYYYMMDD[T]HHmmss');

const createAlarm = (description: string, trigger: string): string[] => [
  'BEGIN:VALARM',
  'ACTION:DISPLAY',
  `DESCRIPTION:${escapeIcsText(description)}`,
  `TRIGGER:${trigger}`,
  'END:VALARM',
];

const createTaskEvent = (task: ScheduleFullResult['tasks'][number]): string[] => [
  'BEGIN:VEVENT',
  `UID:${crypto.randomUUID()}@paintthegrass`,
  `DTSTAMP:${new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')}`,
  `DTSTART:${formatIcsDate(task.start)}`,
  `DTEND:${formatIcsDate(task.end)}`,
  `SUMMARY:${escapeIcsText(task.name)}`,
  `DESCRIPTION:${escapeIcsText(
    `Длительность: ${task.durationHours} ч.\nЦвет задачи: ${task.color}`,
  )}`,

  // Напоминание в начале задачи
  ...createAlarm('Начало задачи', 'PT0M'),

  // Напоминание в конце задачи
  ...createAlarm('Завершение задачи', 'PT0M').map((line) =>
    line === 'TRIGGER:PT0M' ? 'TRIGGER;RELATED=END:PT0M' : line,
  ),

  'END:VEVENT',
];

const createCalendarContent = (result: ScheduleFullResult): string =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PaintTheGrass//Schedule//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:PaintTheGrass Schedule',
    ...result.tasks.flatMap(createTaskEvent),
    'END:VCALENDAR',
  ].join(CRLF);

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
