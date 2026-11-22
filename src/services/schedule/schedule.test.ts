import { colorGroups, createTaskColorGenerator } from './taskColorGenerator.ts';

const colorsPerGroup = 10;
const totalColors = colorGroups.length * colorsPerGroup;

// Создаём тестовый объект токенов Ant Design.
const token = Object.fromEntries(
  colorGroups.flatMap((group) =>
    Array.from({ length: colorsPerGroup }, (_, index) => [
      `${group}${index + 1}`,
      `${group}-${index + 1}`,
    ]),
  ),
) as unknown as Parameters<typeof createTaskColorGenerator>[0];

// Определяем группу по возвращённому цвету.
const getColorGroup = (color: string): string => color.split('-')[0];

describe('createTaskColorGenerator', () => {
  beforeEach(() => {
    // Делаем случайность предсказуемой.
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('возвращает цвет из доступных цветовых групп', () => {
    const generator = createTaskColorGenerator(token);

    const color = generator.getNext();

    expect(color).toMatch(new RegExp(`^(${colorGroups.join('|')})-([1-9]|10)$`));
  });

  it('не повторяет цвета в пределах одного цикла', () => {
    const generator = createTaskColorGenerator(token);

    const result = Array.from({ length: totalColors }, () => generator.getNext());

    expect(new Set(result).size).toBe(totalColors);
  });

  it('выдаёт все оттенки каждой цветовой группы', () => {
    const generator = createTaskColorGenerator(token);

    const result = Array.from({ length: totalColors }, () => generator.getNext());

    colorGroups.forEach((group) => {
      const groupColors = result.filter((color) => getColorGroup(color) === group);

      expect(groupColors).toHaveLength(colorsPerGroup);
    });
  });

  it('не выдаёт подряд цвета одной группы', () => {
    const generator = createTaskColorGenerator(token);

    const result = Array.from({ length: totalColors }, () => generator.getNext());

    for (let i = 1; i < result.length; i++) {
      expect(getColorGroup(result[i])).not.toBe(getColorGroup(result[i - 1]));
    }
  });

  describe('reset', () => {
    it('начинает новый цикл и сбрасывает предыдущую группу', () => {
      const generator = createTaskColorGenerator(token);

      const firstColor = generator.getNext();

      generator.reset();

      const nextColor = generator.getNext();

      // При одинаковом случайном значении генератор
      // начинает с того же цвета.
      expect(nextColor).toBe(firstColor);
    });

    it('повторно выдаёт цвета после сброса', () => {
      const generator = createTaskColorGenerator(token);

      const firstCycle = Array.from({ length: totalColors }, () => generator.getNext());

      generator.reset();

      const secondCycle = Array.from({ length: totalColors }, () => generator.getNext());

      expect(new Set(firstCycle)).toEqual(new Set(secondCycle));
    });
  });

  describe('автоматический переход к новому циклу', () => {
    it('не выбрасывает ошибку при исчерпании цветов', () => {
      const generator = createTaskColorGenerator(token);

      const result = Array.from({ length: totalColors + 1 }, () => generator.getNext());

      expect(result).toHaveLength(totalColors + 1);
      expect(result[totalColors]).toBeDefined();
    });

    it('сохраняет чередование групп на границе циклов', () => {
      const generator = createTaskColorGenerator(token);

      const result = Array.from({ length: totalColors + 1 }, () => generator.getNext());

      const lastColorOfFirstCycle = result[totalColors - 1];
      const firstColorOfNextCycle = result[totalColors];

      expect(getColorGroup(firstColorOfNextCycle)).not.toBe(getColorGroup(lastColorOfFirstCycle));
    });
  });
});
