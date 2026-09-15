import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuscadorColapsable } from './BuscadorColapsable';

function Harness({ onSubmit = (e) => e.preventDefault(), disabled = false }) {
  const [abierto, setAbierto] = useState(false);
  const [value, setValue] = useState('');
  return (
    <BuscadorColapsable
      abierto={abierto}
      onToggle={() => setAbierto((a) => !a)}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onSubmit={onSubmit}
      placeholder="Buscar por N° de socio"
      disabled={disabled}
    />
  );
}

describe('BuscadorColapsable', () => {
  test('arranca cerrado: solo muestra la lupa', () => {
    render(<Harness />);
    const lupa = screen.getByRole('button', { name: /abrir búsqueda/i });
    expect(lupa).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByPlaceholderText(/buscar por/i)).not.toBeInTheDocument();
  });

  test('al apretar la lupa despliega el input con foco y el botón Buscar', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /abrir búsqueda/i }));

    const input = screen.getByPlaceholderText(/buscar por/i);
    expect(input).toHaveFocus();
    expect(screen.getByRole('button', { name: /abrir búsqueda/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
  });

  test('habilita Buscar al escribir y llama a onSubmit al enviar', () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(<Harness onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /abrir búsqueda/i }));
    fireEvent.change(screen.getByPlaceholderText(/buscar por/i), { target: { value: '1001' } });

    const buscar = screen.getByRole('button', { name: 'Buscar' });
    expect(buscar).toBeEnabled();
    fireEvent.click(buscar);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('Escape cierra el buscador y devuelve el foco a la lupa', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /abrir búsqueda/i }));
    fireEvent.keyDown(screen.getByPlaceholderText(/buscar por/i), { key: 'Escape' });

    expect(screen.queryByPlaceholderText(/buscar por/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /abrir búsqueda/i })).toHaveFocus();
  });

  test('apretar la lupa con el buscador abierto lo cierra', () => {
    render(<Harness />);
    const lupa = screen.getByRole('button', { name: /abrir búsqueda/i });
    fireEvent.click(lupa);
    fireEvent.click(lupa);
    expect(screen.queryByPlaceholderText(/buscar por/i)).not.toBeInTheDocument();
  });

  test('con disabled el botón Buscar queda deshabilitado aunque haya texto', () => {
    render(<Harness disabled />);
    fireEvent.click(screen.getByRole('button', { name: /abrir búsqueda/i }));
    fireEvent.change(screen.getByPlaceholderText(/buscar por/i), { target: { value: '1001' } });
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
  });
});
