import { render, screen } from '@testing-library/react';
import { SkeletonRows } from './SkeletonRows';

describe('SkeletonRows', () => {
  test('anuncia "Cargando" a lectores de pantalla', () => {
    render(<SkeletonRows />);
    expect(screen.getByLabelText('Cargando')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renderiza 5 filas por defecto', () => {
    const { container } = render(<SkeletonRows />);
    expect(container.querySelectorAll('.skeleton-row')).toHaveLength(5);
  });

  test('renderiza la cantidad de filas indicada por n', () => {
    const { container } = render(<SkeletonRows n={3} />);
    expect(container.querySelectorAll('.skeleton-row')).toHaveLength(3);
  });

  test('aplica altura y ancho custom a cada fila', () => {
    const { container } = render(<SkeletonRows n={1} altura={120} ancho="50%" />);
    const fila = container.querySelector('.skeleton-row');
    expect(fila).toHaveStyle({ height: '120px', width: '50%' });
  });
});
