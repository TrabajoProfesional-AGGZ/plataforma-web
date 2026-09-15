import { chartTheme } from './chartTheme';

describe('chartTheme', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('tick() usa el fallback 0.75rem cuando --text-caption no está definido', () => {
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({ getPropertyValue: () => '' });

    expect(chartTheme.tick()).toEqual({ fill: 'var(--color-text-secondary)', fontSize: '0.75rem' });
  });

  test('tick() usa el valor de --text-caption cuando está definido', () => {
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({ getPropertyValue: () => '  0.8rem  ' });

    expect(chartTheme.tick()).toEqual({ fill: 'var(--color-text-secondary)', fontSize: '0.8rem' });
  });

  test('expone axisLine, grid, tooltip y legend atados a tokens', () => {
    expect(chartTheme.axisLine).toEqual({ stroke: 'var(--color-border-medium)' });
    expect(chartTheme.grid).toEqual({ stroke: 'var(--color-border-light)' });
    expect(chartTheme.legend).toEqual({ wrapperStyle: { color: 'var(--color-text-secondary)' } });

    expect(chartTheme.tooltip.contentStyle).toMatchObject({
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border-medium)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-md)',
    });
    expect(chartTheme.tooltip.labelStyle).toEqual({ color: 'var(--color-text-secondary)' });
    expect(chartTheme.tooltip.itemStyle).toEqual({ color: 'var(--color-text-primary)' });
    expect(chartTheme.tooltip.cursor).toEqual({ fill: 'var(--color-row-hover)' });
  });
});
