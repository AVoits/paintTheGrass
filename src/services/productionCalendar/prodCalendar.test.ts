import dayjs from 'dayjs';

import { productionCalendarData } from './productionCalendarData';
import { getPeriodCalendar, getProductionState } from './helpers.ts';

describe('productionCalendarData проверка структуры данных', () => {
  Object.entries(productionCalendarData).forEach(([year, data]) => {
    describe(`year ${year}`, () => {
      it('содержит корректный год', () => {
        expect(year).toMatch(/^\d{4}$/);
      });

      it.each(['holidays', 'workingWeekends', 'shortDays'] as const)(
        '%s содержит корректные даты',
        (field) => {
          const dates = data[field] ?? [];

          expect(new Set(dates).size).toBe(dates.length);

          dates.forEach((date) => {
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

            const parsed = new Date(`${date}T00:00:00Z`);

            expect(Number.isNaN(parsed.getTime())).toBe(false);
            expect(parsed.toISOString().slice(0, 10)).toBe(date);
            expect(date.slice(0, 4)).toBe(year);
          });
        },
      );

      it('не содержит пересечений праздничных и рабочих выходных', () => {
        const holidays = new Set(data.holidays);
        const workingWeekends = data.workingWeekends ?? [];

        workingWeekends.forEach((date) => {
          expect(holidays.has(date)).toBe(false);
        });
      });
    });
  });
});

describe('getProductionState', () => {
  describe('известный год', () => {
    it('возвращает праздничный день', () => {
      const result = getProductionState(dayjs('2026-01-01'));

      expect(result).toEqual({
        year: 2026,
        holidays: true,
        workingWeekends: false,
        shortDays: false,
      });
    });

    it('возвращает обычный рабочий день', () => {
      const result = getProductionState(dayjs('2026-01-12'));

      expect(result).toEqual({
        year: 2026,
        holidays: false,
        workingWeekends: false,
        shortDays: false,
      });
    });

    it('определяет предпраздничный сокращённый день', () => {
      const result = getProductionState(dayjs('2026-04-30'));

      expect(result.shortDays).toBe(true);
    });

    it('определяет рабочую субботу', () => {
      const result = getProductionState(dayjs('2027-02-20'));

      expect(result).toEqual({
        year: 2027,
        holidays: false,
        workingWeekends: true,
        shortDays: true,
      });
    });

    it('возвращает false для отсутствующих workingWeekends', () => {
      const result = getProductionState(dayjs('2026-01-12'));

      expect(result.workingWeekends).toBe(false);
    });

    it('возвращает false для даты, не входящей в shortDays', () => {
      const result = getProductionState(dayjs('2026-04-29'));

      expect(result.shortDays).toBe(false);
    });
  });

  describe('неизвестный год', () => {
    it('возвращает состояние без специальных признаков', () => {
      const result = getProductionState(dayjs('2028-01-01'));

      expect(result).toEqual({
        year: 2028,
        holidays: false,
        workingWeekends: false,
        shortDays: false,
      });
    });
  });
});

describe('getPeriodCalendar', () => {
  it('возвращает пустые множества для периода без специальных дней', () => {
    const result = getPeriodCalendar(
      dayjs('2026-01-12'),
      dayjs('2026-01-13'),
      productionCalendarData,
    );

    expect(result.holidays.size).toBe(0);
    expect(result.workingWeekends.size).toBe(0);
    expect(result.shortDays.size).toBe(0);
  });

  it('добавляет праздничные дни в результат', () => {
    const result = getPeriodCalendar(
      dayjs('2026-01-01'),
      dayjs('2026-01-03'),
      productionCalendarData,
    );

    expect(result.holidays).toEqual(new Set(['2026-01-01', '2026-01-02', '2026-01-03']));
  });

  it('добавляет рабочие выходные в результат', () => {
    const result = getPeriodCalendar(
      dayjs('2027-02-20'),
      dayjs('2027-02-20'),
      productionCalendarData,
    );

    expect(result.workingWeekends).toEqual(new Set(['2027-02-20']));
  });

  it('добавляет сокращённые дни в результат', () => {
    const result = getPeriodCalendar(
      dayjs('2026-04-30'),
      dayjs('2026-05-08'),
      productionCalendarData,
    );

    expect(result.shortDays).toEqual(new Set(['2026-04-30', '2026-05-08']));
  });

  it('включает обе границы периода', () => {
    const result = getPeriodCalendar(
      dayjs('2026-01-01'),
      dayjs('2026-01-08'),
      productionCalendarData,
    );

    expect(result.holidays.has('2026-01-01')).toBe(true);
    expect(result.holidays.has('2026-01-08')).toBe(true);
  });

  it('корректно обрабатывает период на стыке двух годов', () => {
    const result = getPeriodCalendar(
      dayjs('2026-12-31'),
      dayjs('2027-01-01'),
      productionCalendarData,
    );

    expect(result.holidays).toEqual(new Set(['2026-12-31', '2027-01-01']));
  });

  it('пропускает год, отсутствующий в календаре', () => {
    const result = getPeriodCalendar(
      dayjs('2025-12-31'),
      dayjs('2026-01-01'),
      productionCalendarData,
    );

    expect(result.holidays).toEqual(new Set(['2026-01-01']));
  });

  it('выбрасывает ошибку, если конец периода раньше начала', () => {
    expect(() =>
      getPeriodCalendar(dayjs('2026-01-10'), dayjs('2026-01-01'), productionCalendarData),
    ).toThrow('Дата окончания периода раньше даты начала.');
  });
});
