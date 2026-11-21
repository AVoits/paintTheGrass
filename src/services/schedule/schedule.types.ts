import { Dayjs } from 'dayjs';
import { FormTaskInput } from '../../components/Form/Form.tsx';
export type TaskInput = {
  name: string;
  duration: string;
  color: string;
};

export type WorkRun = {
  days: Dayjs[];
  capacityHours: number;
};

export type IndexedTask = TaskInput & {
  originalIndex: number;
  durationHours: number;
};

export type ScheduledTask = {
  name: string;
  originalDurationHours: number;
  durationHours: number;

  start: Dayjs;
  end: Dayjs;

  color: string;
  startHour: number;
  endHour: number;

  reduced: false;
};

export type ScheduleWarning = {
  type: 'insufficient' | 'overflow';
  message: string;
};

export type PeriodCalendar = {
  holidays: Set<string>;
  workingWeekends: Set<string>;
  shortDays: Set<string>;
};

export type ScheduleResult = {
  tasks: ScheduledTask[];
  warnings: ScheduleWarning[];

  availableHours: number;
  requestedHours: number;
  scheduledHours: number;

  unscheduled: TaskInput[];
  periodCalendar: PeriodCalendar;
};

export type ScheduleOptions = {
  tasks: TaskInput[];
  periodStart: Dayjs;
  periodEnd: Dayjs;
};

export type ScheduleFullResult = {
  tasks: ScheduledTask[];
  warnings: ScheduleWarning[];

  availableHours: number;
  requestedHours: number;
  scheduledHours: number;

  unscheduled: TaskInput[];
  periodCalendar: PeriodCalendar;

  periodStart: Dayjs;
  periodEnd: Dayjs;
};
