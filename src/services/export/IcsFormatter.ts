import { ScheduleFullResult } from '../schedule/schedule.types.ts';

export const escapeIcsText = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');

export const formatIcsDate = (date: ScheduleFullResult['periodStart']): string =>
  date.format('YYYYMMDD[T]HHmmss');
