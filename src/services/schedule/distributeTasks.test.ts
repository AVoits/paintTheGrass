import dayjs from 'dayjs';
import { distributeTasks } from './distributeTasks.ts';

it('fits all tasks into the two work blocks without crossing the weekend', () => {
  const result = distributeTasks({
    tasks: ['1д', '1д', '1д 4ч', '1д 4ч'].map((duration, index) => ({
      name: `Task ${index + 1}`,
      duration,
      color: 'blue',
    })),
    periodStart: dayjs('2026-06-18'),
    periodEnd: dayjs('2026-06-24'),
  });

  expect(result).toMatchObject({
    availableHours: 40,
    requestedHours: 40,
    scheduledHours: 40,
    unscheduled: [],
    warnings: [],
  });
  expect(
    result.tasks.map(({ name, start, startHour, end, endHour }) => [
      name,
      start.format('YYYY-MM-DD'),
      startHour,
      end.format('YYYY-MM-DD'),
      endHour,
    ]),
  ).toEqual([
    ['Task 1', '2026-06-18', 9, '2026-06-18', 17],
    ['Task 2', '2026-06-19', 9, '2026-06-19', 17],
    ['Task 3', '2026-06-22', 9, '2026-06-23', 13],
    ['Task 4', '2026-06-23', 13, '2026-06-24', 17],
  ]);
});
