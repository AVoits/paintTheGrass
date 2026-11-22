import { ScheduleFullResult } from '../schedule/schedule.types.ts';
import { escapeIcsText, formatIcsDate } from './IcsFormatter.ts';

const CRLF = '\r\n';

export const createAlarm = (description: string, trigger: string): string[] => [
  'BEGIN:VALARM',
  'ACTION:DISPLAY',
  `DESCRIPTION:${escapeIcsText(description)}`,
  `TRIGGER:${trigger}`,
  'END:VALARM',
];

export const createTaskEvent = (task: ScheduleFullResult['tasks'][number]): string[] => [
  'BEGIN:VEVENT',
  `UID:${crypto.randomUUID()}@paintthegrass`,
  `DTSTAMP:${new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')}`,
  `DTSTART:${formatIcsDate(task.start.hour(task.startHour).startOf('hour'))}`,
  `DTEND:${formatIcsDate(task.end.hour(task.endHour).startOf('hour'))}`,
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

export const createCalendarContent = (result: ScheduleFullResult): string =>
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
