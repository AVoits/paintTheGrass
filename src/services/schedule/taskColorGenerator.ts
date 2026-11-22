import { theme } from 'antd';

type TaskColorGenerator = {
  getNext: () => string;
  reset: () => void;
};

export const colorGroups = [
  'blue',
  'purple',
  'cyan',
  'green',
  'magenta',
  'red',
  'orange',
  'yellow',
  'volcano',
  'geekblue',
  'lime',
  'gold',
] as const;

export const createTaskColorGenerator = (
  token: ReturnType<typeof theme.useToken>['token'],
): TaskColorGenerator => {
  // Собираем все оттенки каждой цветовой группы.
  const colors = colorGroups.flatMap((group) =>
    Array.from({ length: 10 }, (_, index) => ({
      group,
      color: token[`${group}${index + 1}` as keyof typeof token] as string,
    })),
  );

  let availableColors: typeof colors = [];
  let previousGroup: string | null = null;

  const shuffle = <T>(array: T[]): T[] => {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  };

  const reset = (preservePreviousGroup = false) => {
    availableColors = shuffle(colors);

    if (!preservePreviousGroup) {
      previousGroup = null;
    }
  };

  const getNext = (): string => {
    let candidates = availableColors.filter((item) => item.group !== previousGroup);

    if (!candidates.length) {
      reset(true);

      candidates = availableColors.filter((item) => item.group !== previousGroup);
    }

    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    availableColors = availableColors.filter((item) => item !== selected);
    previousGroup = selected.group;

    return selected.color;
  };

  reset();

  return { getNext, reset };
};
