/** Estilos de recharts atados a los tokens. Recharts no lee var() dentro de
 *  `tick`, así que el tamaño de tick se lee del DOM una vez. */
const caption = () => getComputedStyle(document.documentElement).getPropertyValue('--text-caption').trim() || '0.75rem';

export const chartTheme = {
  tick: () => ({ fill: 'var(--color-text-secondary)', fontSize: caption() }),
  axisLine: { stroke: 'var(--color-border-medium)' },
  grid: { stroke: 'var(--color-border-light)' },
  tooltip: {
    contentStyle: { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-medium)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)' },
    labelStyle: { color: 'var(--color-text-secondary)' },
    itemStyle: { color: 'var(--color-text-primary)' },
    cursor: { fill: 'var(--color-row-hover)' },
  },
  legend: { wrapperStyle: { color: 'var(--color-text-secondary)' } },
};
