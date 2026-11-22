// ======================================================
// DURATION PARSER
// ======================================================

import { HOURS_PER_DAY, HOURS_PER_WEEK } from '../schedule.const.ts';

/**
 * Форматы:
 * 4ч
 * 1д
 * 1д4ч
 * 2д
 * 1н
 * 1н2д3ч
 *
 * 1д = 8 часов
 * 1н = 40 часов
 */
export const parseDuration = (value: string): number => {
  const normalizedValue = value.replace(/\s+/g, '');
  const match = normalizedValue.match(/^(?:(\d+)н)?(?:(\d+)д)?(?:(\d+)ч)?$/);

  if (!match) {
    throw new Error(`Некорректная длительность: "${value}"`);
  }

  const [, weeks, days, hours] = match;

  const totalHours =
    Number(weeks || 0) * HOURS_PER_WEEK + Number(days || 0) * HOURS_PER_DAY + Number(hours || 0);

  if (totalHours <= 0) {
    throw new Error(`Длительность должна быть больше 0: "${value}"`);
  }

  if (totalHours > HOURS_PER_WEEK) {
    throw new Error(`Максимальная длительность задачи — 1н (40ч): "${value}"`);
  }

  return totalHours;
};
