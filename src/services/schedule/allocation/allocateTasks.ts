import { IndexedTask, RunAllocation, WorkRun } from '../schedule.types.ts';

const MAX_SEARCH_STEPS = 10_000;

const findCompleteAllocation = (
  sortedTasks: IndexedTask[],
  runs: WorkRun[],
): RunAllocation[] | undefined => {
  const remaining = runs.map(({ capacityHours }) => capacityHours);
  const requiredHours = sortedTasks.reduce((sum, task) => sum + task.durationHours, 0);
  if (requiredHours > remaining.reduce((sum, capacity) => sum + capacity, 0)) return;

  const allocations: RunAllocation[] = [];
  const createFrame = () => ({ nextRunIndex: 0, triedCapacities: new Set<number>() });
  const frames = [createFrame()];

  // Ограничиваем перебор, так как расписание пересчитывается при изменении формы.
  for (let step = 0; step < MAX_SEARCH_STEPS; step++) {
    const task = sortedTasks[allocations.length];
    const frame = frames[frames.length - 1];

    if (frame.nextRunIndex === runs.length) {
      frames.pop();
      const previous = allocations.pop();
      if (!previous) return;
      remaining[previous.runIndex] += previous.duration;
      continue;
    }

    const runIndex = frame.nextRunIndex++;
    const capacity = remaining[runIndex];
    // Блоки с одинаковым остатком эквивалентны для поиска полной раскладки.
    if (capacity < task.durationHours || frame.triedCapacities.has(capacity)) continue;
    frame.triedCapacities.add(capacity);

    allocations.push({
      task,
      runIndex,
      offset: runs[runIndex].capacityHours - capacity,
      duration: task.durationHours,
    });
    if (allocations.length === sortedTasks.length) return allocations;

    remaining[runIndex] -= task.durationHours;
    frames.push(createFrame());
  }

  return undefined;
};

/**
 * Best Fit Decreasing.
 *
 * 1. Сортируем задачи от длинных к коротким.
 * 2. Ищем рабочий блок, в котором задача целиком помещается.
 * 3. Выбираем блок с минимальным остатком.
 * 4. Если не все задачи поместились, пробуем найти полную раскладку перебором.
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

  if (allocations.length === sortedTasks.length) return allocations;

  return findCompleteAllocation(sortedTasks, runs) ?? allocations;
};
