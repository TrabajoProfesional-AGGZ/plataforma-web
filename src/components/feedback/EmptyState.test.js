import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  test('muestra el mensaje recibido', () => {
    render(<EmptyState mensaje="No hay noticias registradas." />);
    expect(screen.getByText('No hay noticias registradas.')).toBeInTheDocument();
  });

  test('renderiza la accion opcional debajo del mensaje', () => {
    render(<EmptyState mensaje="No hay noticias registradas." accion={<button type="button">Crear</button>} />);
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });

  test('no renderiza nada extra cuando no se pasa accion', () => {
    render(<EmptyState mensaje="No hay noticias registradas." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
