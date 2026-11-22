import { allocateTasks } from './allocateTasks.ts';
import type { IndexedTask, WorkRun } from '../schedule.types.ts';

const makeTasks = (hours: number[]): IndexedTask[] =>
  hours.map((durationHours, originalIndex) => ({
    durationHours,
    originalIndex,
    name: `Task ${originalIndex}`,
    duration: `${durationHours}ч`,
    color: 'blue',
  }));

const makeRuns = (hours: number[]): WorkRun[] =>
  hours.map((capacityHours) => ({ capacityHours, days: [] }));

it('rearranges tasks when greedy allocation misses a complete fit', () => {
  const tasks = makeTasks([8, 8, 12, 12]);
  const allocations = allocateTasks(tasks, makeRuns([16, 24]));

  expect(allocations.filter(({ runIndex }) => runIndex === 0)).toEqual([
    { task: tasks[0], runIndex: 0, offset: 0, duration: 8 },
    { task: tasks[1], runIndex: 0, offset: 8, duration: 8 },
  ]);
  expect(allocations.filter(({ runIndex }) => runIndex === 1)).toEqual([
    { task: tasks[2], runIndex: 1, offset: 0, duration: 12 },
    { task: tasks[3], runIndex: 1, offset: 12, duration: 12 },
  ]);
});

it('keeps the greedy result when no complete fit exists despite enough total hours', () => {
  const tasks = makeTasks([10, 10, 10]);
  const allocations = allocateTasks(tasks, makeRuns([16, 16]));

  expect(allocations).toEqual([
    { task: tasks[0], runIndex: 0, offset: 0, duration: 10 },
    { task: tasks[1], runIndex: 1, offset: 0, duration: 10 },
  ]);
});
