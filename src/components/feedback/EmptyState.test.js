import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  test('muestra el mensaje recibido', () => {
    render(<EmptyState mensaje="No hay noticias registradas." />);
    expect(screen.getByText('No hay noticias registradas.')).toBeInTheDocument();
  });
});
