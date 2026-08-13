import { render, screen, fireEvent } from '@testing-library/react';
import { Paginacion } from './Paginacion';

describe('Paginacion', () => {
  test('no renderiza nada si hay una sola página', () => {
    const { container } = render(<Paginacion pagina={1} totalPaginas={1} onCambiarPagina={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('muestra el indicador de página actual', () => {
    render(<Paginacion pagina={2} totalPaginas={4} onCambiarPagina={jest.fn()} />);
    expect(screen.getByText('Página 2 de 4')).toBeInTheDocument();
  });

  test('deshabilita "Anterior" en la primera página y "Siguiente" en la última', () => {
    const { rerender } = render(<Paginacion pagina={1} totalPaginas={3} onCambiarPagina={jest.fn()} />);
    expect(screen.getByRole('button', { name: /página anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /página siguiente/i })).not.toBeDisabled();

    rerender(<Paginacion pagina={3} totalPaginas={3} onCambiarPagina={jest.fn()} />);
    expect(screen.getByRole('button', { name: /página anterior/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /página siguiente/i })).toBeDisabled();
  });

  test('llama a onCambiarPagina con la página anterior/siguiente al hacer click', () => {
    const onCambiarPagina = jest.fn();
    render(<Paginacion pagina={2} totalPaginas={3} onCambiarPagina={onCambiarPagina} />);

    fireEvent.click(screen.getByRole('button', { name: /página siguiente/i }));
    expect(onCambiarPagina).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByRole('button', { name: /página anterior/i }));
    expect(onCambiarPagina).toHaveBeenCalledWith(1);
  });
});
