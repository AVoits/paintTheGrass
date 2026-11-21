import { HOURS_PER_DAY, HOURS_PER_WEEK, WORK_START_HOUR } from './schedule.const.ts';
import {
  IndexedTask,
  PeriodCalendar,
  ScheduledTask,
  ScheduleOptions,
  ScheduleResult,
  ScheduleWarning,
  TaskInput,
  WorkRun,
} from './schedule.types.ts';
import { getPeriodCalendar } from '../productionCalendar/helpers.ts';
import { Dayjs } from 'dayjs';
import { productionCalendarData } from '../productionCalendar/productionCalendarData.ts';

// ======================================================
// DURATION PARSER
// ======================================================

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
const parseDuration = (value: string): number => {
  const normalizedValue = value?.replace(/\s+/g, '');
  const match = normalizedValue?.match(/^(?:(\d+)н)?(?:(\d+)д)?(?:(\d+)ч)?$/);

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

// ======================================================
// WORKING CALENDAR
// ======================================================

/**
 * Проверяет, является ли дата рабочей.
 * dayjs.day():
 * 0 - воскресенье
 * 6 - суббота
 */
const isWorkingDay = (date: Dayjs, calendar: PeriodCalendar): boolean => {
  const dateString = date.format('YYYY-MM-DD');

  if (calendar.holidays.has(dateString)) {
    return false;
  }

  if (calendar.workingWeekends.has(dateString)) {
    return true;
  }

  return date.day() !== 0 && date.day() !== 6;
};

/**
 * Формирует непрерывные блоки рабочих дней.
 *
 * Выходные и праздники разделяют блоки.
 * Задача не может перейти из одного блока в другой.
 */
const buildWorkRuns = (
  periodStart: Dayjs,
  periodEnd: Dayjs,
  calendar: PeriodCalendar,
): WorkRun[] => {
  const runs: WorkRun[] = [];
  let currentRun: Dayjs[] = [];

  const flush = () => {
    if (!currentRun.length) return;

    runs.push({
      days: currentRun,
      capacityHours: currentRun.length * HOURS_PER_DAY,
    });

    currentRun = [];
  };

  let date = periodStart?.startOf('day');
  const endDate = periodEnd?.startOf('day');

  while (date?.isBefore(endDate) || date?.isSame(endDate, 'day')) {
    if (isWorkingDay(date, calendar)) {
      currentRun.push(date);
    } else {
      flush();
    }

    date = date.add(1, 'day');
  }

  flush();

  return runs;
};

// ======================================================
// TASK PREPARATION
// ======================================================

/**
 * Преобразует входные задачи в задачи с длительностью в часах.
 */
const prepareTasks = (tasks: TaskInput[]): IndexedTask[] => {
  return tasks?.map((task, originalIndex) => ({
    ...task,
    originalIndex,
    durationHours: parseDuration(task?.duration),
  }));
};

// ======================================================
// TASK ALLOCATION
// ======================================================

type RunAllocation = {
  task: IndexedTask;
  runIndex: number;
  offset: number;
  duration: number;
};

/**
 * Best Fit Decreasing.
 *
 * 1. Сортируем задачи от длинных к коротким.
 * 2. Ищем рабочий блок, в котором задача целиком помещается.
 * 3. Выбираем блок с минимальным остатком.
 * 4. Если подходящего блока нет, задача остается нераспределенной.
 *
 * Длительность задач никогда не меняется.
 */
export const allocateTasks = (tasks: IndexedTask[], runs: WorkRun[]): RunAllocation[] => {
  const remaining = runs.map((run) => run.capacityHours);

  const sortedTasks = [...tasks].sort(
    (a, b) => b.durationHours - a.durationHours || a.originalIndex - b.originalIndex,
  );

  const allocations: RunAllocation[] = [];

  for (const task of sortedTasks) {
    const candidates = remaining
      .map((capacity, runIndex) => ({
        runIndex,
        leftover: capacity - task.durationHours,
      }))
      .filter((item) => item.leftover >= 0)
      .sort((a, b) => a.leftover - b.leftover);

    const best = candidates[0];

    // Задача не помещается ни в один блок.
    if (!best) {
      continue;
    }

    const runIndex = best.runIndex;

    const offset = runs[runIndex].capacityHours - remaining[runIndex];

    allocations.push({
      task,
      runIndex,
      offset,
      duration: task.durationHours,
    });

    remaining[runIndex] -= task.durationHours;
  }

  return allocations;
};

// ======================================================
// OFFSET -> DATE / HOUR
// ======================================================

type DateTimeOffset = {
  date: Dayjs;
  hour: number;
};

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
const offsetToDate = (run: WorkRun, offset: number, isEnd = false): DateTimeOffset => {
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

// ======================================================
// MAIN SCHEDULER
// ======================================================

export const distributeTasks = ({
  tasks,
  periodStart,
  periodEnd,
}: ScheduleOptions): ScheduleResult => {
  // --------------------------------------------------
  // Validation
  // --------------------------------------------------

  if (periodEnd?.startOf('day').isBefore(periodStart?.startOf('day'))) {
    throw new Error('Дата окончания периода раньше даты начала.');
  }

  // --------------------------------------------------
  // Build working calendar
  // --------------------------------------------------

  const periodCalendar = getPeriodCalendar(periodStart, periodEnd, productionCalendarData);

  const runs = buildWorkRuns(periodStart, periodEnd, periodCalendar);

  const availableHours = runs.reduce((sum, run) => sum + run.capacityHours, 0);

  // --------------------------------------------------
  // Prepare tasks
  // --------------------------------------------------

  const preparedTasks = prepareTasks(tasks);

  const requestedHours = preparedTasks?.reduce((sum, task) => sum + task.durationHours, 0);

  // --------------------------------------------------
  // Allocate tasks
  // --------------------------------------------------

  const allocations = allocateTasks(preparedTasks, runs);

  // --------------------------------------------------
  // Convert allocations to scheduled tasks
  // --------------------------------------------------

  const scheduled: ScheduledTask[] = allocations.map(({ task, runIndex, offset, duration }) => {
    const run = runs[runIndex];

    const start = offsetToDate(run, offset);
    const end = offsetToDate(run, offset + duration, true);

    return {
      name: task.name,
      originalDurationHours: task.durationHours,
      durationHours: duration,

      start: start.date,
      end: end.date,

      color: task.color ?? 'blue',

      startHour: start.hour,
      endHour: end.hour,

      reduced: false,
    };
  });

  // --------------------------------------------------
  // Sort by calendar date/time
  // --------------------------------------------------

  scheduled.sort((a, b) => a.start.valueOf() - b.start.valueOf() || a.startHour - b.startHour);

  // --------------------------------------------------
  // Unscheduled tasks
  // --------------------------------------------------

  const allocatedIndexes = new Set(allocations.map((allocation) => allocation.task.originalIndex));

  const unscheduled = preparedTasks
    .filter((task) => !allocatedIndexes.has(task.originalIndex))
    .map(({ name, duration, color }) => ({
      name,
      duration,
      color,
    }));

  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------

  const scheduledHours = scheduled.reduce((sum, task) => sum + task.durationHours, 0);

  // --------------------------------------------------
  // Warnings
  // --------------------------------------------------

  const warnings: ScheduleWarning[] = [];

  if (requestedHours < availableHours) {
    warnings.push({
      type: 'insufficient',
      message:
        `Задач недостаточно для заполнения периода. ` +
        `Свободно ${availableHours - requestedHours} ч.`,
    });
  }

  if (unscheduled.length > 0) {
    warnings.push({
      type: 'overflow',
      message:
        `Не удалось разместить: ${unscheduled.length} ` +
        `(${unscheduled.map((task) => task.name).join(', ')}). `,
    });
  }

  // --------------------------------------------------
  // Result
  // --------------------------------------------------

  return {
    tasks: scheduled,
    warnings,

    availableHours,
    requestedHours,
    scheduledHours,

    unscheduled,
    periodCalendar,
  };
};
