import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBanner from './ErrorBanner';

describe('ErrorBanner', () => {
  test('muestra el mensaje con role alert', () => {
    render(<ErrorBanner mensaje="No se pudieron cargar las noticias." />);
    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent('No se pudieron cargar las noticias.');
  });

  test('no muestra el botón Reintentar si no se pasa onReintentar', () => {
    render(<ErrorBanner mensaje="Error" />);
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });

  test('muestra el botón Reintentar y lo ejecuta al hacer click', () => {
    const onReintentar = jest.fn();
    render(<ErrorBanner mensaje="Error" onReintentar={onReintentar} />);
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });
});
