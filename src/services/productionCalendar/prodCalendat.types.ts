export type CalendarYear = '2026' | '2027';

export interface ProductionCalendarYear {
  holidays: string[];
  shortDays?: string[];
  workingWeekends?: string[];
}

export type ProductionCalendarDataType = Record<CalendarYear, ProductionCalendarYear>;

export interface ProductionDataState {
  year: number;
  holidays: boolean;
  workingWeekends: boolean;
  shortDays: boolean;
}
