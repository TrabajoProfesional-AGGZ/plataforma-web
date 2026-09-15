import { render, screen, fireEvent } from '@testing-library/react';
import { BackButton } from './BackButton';

describe('BackButton', () => {
  test('renderiza el label por defecto y llama a onClick al hacer click', () => {
    const onClick = jest.fn();
    render(<BackButton onClick={onClick} />);
    const boton = screen.getByRole('button', { name: /volver/i });
    fireEvent.click(boton);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('acepta un label personalizado', () => {
    render(<BackButton onClick={() => {}} label="Volver a la tienda" />);

    expect(screen.getByRole('button', { name: /volver a la tienda/i })).toBeInTheDocument();
  });

  test('con compacto agrega la clase back-button--compacto', () => {
    render(<BackButton onClick={() => {}} compacto />);

    expect(screen.getByRole('button', { name: /volver/i })).toHaveClass('back-button--compacto');
  });
});
