import { render, screen } from '@testing-library/react';
import EstadoBadge from './EstadoBadge';

describe('EstadoBadge', () => {
  test('renderiza el label recibido en children', () => {
    render(<EstadoBadge variant="success">Activo</EstadoBadge>);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  test('aplica la clase badge--success cuando variant="success"', () => {
    render(<EstadoBadge variant="success">Activo</EstadoBadge>);
    expect(screen.getByText('Activo')).toHaveClass('badge', 'badge--success');
  });

  test('aplica la clase badge--danger cuando variant="danger"', () => {
    render(<EstadoBadge variant="danger">Moroso</EstadoBadge>);
    expect(screen.getByText('Moroso')).toHaveClass('badge--danger');
  });

  test('aplica la clase badge--warning cuando variant="warning"', () => {
    render(<EstadoBadge variant="warning">Inactivo</EstadoBadge>);
    expect(screen.getByText('Inactivo')).toHaveClass('badge--warning');
  });

  test('aplica la clase badge--suspended cuando variant="suspended"', () => {
    render(<EstadoBadge variant="suspended">Suspendido</EstadoBadge>);
    expect(screen.getByText('Suspendido')).toHaveClass('badge--suspended');
  });

  test('cae en badge--neutral ante una variante desconocida', () => {
    render(<EstadoBadge variant="no-existe">Rara</EstadoBadge>);
    expect(screen.getByText('Rara')).toHaveClass('badge--neutral');
  });

  test('resuelve la variante a partir del string de estado via estadoConfig cuando no se pasa variant', () => {
    render(<EstadoBadge estado="Activo" />);
    expect(screen.getByText('Activo')).toHaveClass('badge--success');
  });

  test('resuelve la variante a partir de un objeto estado {nombre}', () => {
    render(<EstadoBadge estado={{ nombre: 'Moroso' }} />);
    expect(screen.getByText('Moroso')).toHaveClass('badge--danger');
  });

  test('un estado desconocido cae en la variante default (warning)', () => {
    render(<EstadoBadge estado="Lo que sea" />);
    expect(screen.getByText('Lo que sea')).toHaveClass('badge--warning');
  });

  test('sin estado ni children muestra un placeholder', () => {
    render(<EstadoBadge variant="neutral" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
