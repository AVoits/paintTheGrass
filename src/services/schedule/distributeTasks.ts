import { HOURS_PER_DAY } from './schedule.const.ts';
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
import type { Dayjs } from 'dayjs';
import { productionCalendarData } from '../productionCalendar/productionCalendarData.ts';
import { parseDuration } from './helpers/parseDuration.ts';
import { isWorkingDay } from './helpers/workingCalendar.ts';
import { allocateTasks } from './allocation/allocateTasks.ts';
import { offsetToDate } from './helpers/offsetToDate.ts';

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

  let date = periodStart.startOf('day');
  const endDate = periodEnd.startOf('day');

  while (date.isBefore(endDate, 'day') || date.isSame(endDate, 'day')) {
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

export const distributeTasks = ({
  tasks,
  periodStart,
  periodEnd,
}: ScheduleOptions): ScheduleResult => {
  // --------------------------------------------------
  // Validation
  // --------------------------------------------------

  if (periodEnd.startOf('day').isBefore(periodStart.startOf('day'))) {
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
    .map(({ name, duration, color, originalIndex }) => ({
      name,
      duration,
      color,
      originalIndex,
    }));

  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------

  const scheduledHours = scheduled.reduce((sum, task) => sum + task.durationHours, 0);

  // --------------------------------------------------
  // Warnings
  // --------------------------------------------------

  const warnings: ScheduleWarning[] = [];

  if (preparedTasks.length > 0 && scheduledHours < availableHours) {
    warnings.push({
      type: 'insufficient',
      message:
        `Не удалось заполнить весь период. ` + `Свободно ${availableHours - scheduledHours} ч.`,
    });
  }

  if (unscheduled.length > 0) {
    warnings.push({
      type: 'overflow',
      message:
        `Не удалось разместить: ${unscheduled.length} ` +
        `(${unscheduled.map((task) => task.name).join(', ')}).`,
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
