import { render, screen, fireEvent } from '@testing-library/react';
import { FiltrosActivos } from './FiltrosActivos';

describe('FiltrosActivos', () => {
  test('no renderiza nada si no hay filtros activos', () => {
    const { container } = render(<FiltrosActivos cantidad={0} onLimpiar={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('usa singular con un filtro y plural con varios', () => {
    const { rerender } = render(<FiltrosActivos cantidad={1} onLimpiar={() => {}} />);
    expect(screen.getByText('1 filtro activo')).toBeInTheDocument();

    rerender(<FiltrosActivos cantidad={3} onLimpiar={() => {}} />);
    expect(screen.getByText('3 filtros activos')).toBeInTheDocument();
  });

  test('el botón Limpiar llama a onLimpiar', () => {
    const onLimpiar = jest.fn();
    render(<FiltrosActivos cantidad={2} onLimpiar={onLimpiar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(onLimpiar).toHaveBeenCalledTimes(1);
  });
});
