import { DateTimeOffset, WorkRun } from '../schedule.types.ts';
import { HOURS_PER_DAY, WORK_START_HOUR } from '../schedule.const.ts';

/**
 * Переводит смещение в часах внутри WorkRun в дату и час.
 *
 * Рабочий день:
 * 09:00 - 17:00
 *
 * offset = 0 -> первый день, 09:00
 * offset = 4 -> первый день, 13:00
 * offset = 8 -> второй день, 09:00
 *
 * Для конца задачи учитываем точное завершение
 * в 17:00 последнего рабочего дня.
 */
export const offsetToDate = (run: WorkRun, offset: number, isEnd = false): DateTimeOffset => {
  let dayIndex: number;
  let hourOffset: number;

  if (isEnd && offset > 0 && offset % HOURS_PER_DAY === 0) {
    dayIndex = offset / HOURS_PER_DAY - 1;
    hourOffset = HOURS_PER_DAY;
  } else {
    dayIndex = Math.floor(offset / HOURS_PER_DAY);
    hourOffset = offset % HOURS_PER_DAY;
  }

  const date = run.days[dayIndex];

  return {
    date,
    hour: WORK_START_HOUR + hourOffset,
  };
};
