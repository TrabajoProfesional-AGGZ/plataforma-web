import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuscadorColapsable } from './BuscadorColapsable';

function Harness({ onChangeSpy }) {
  const [abierto, setAbierto] = useState(false);
  const [value, setValue] = useState('');
  return (
    <BuscadorColapsable
      abierto={abierto}
      onToggle={() => setAbierto((a) => !a)}
      value={value}
      onChange={(e) => { onChangeSpy?.(e.target.value); setValue(e.target.value); }}
      placeholder="Buscar por N° de socio"
      maxLength={20}
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

  test('al apretar la lupa despliega el input con foco, sin botón Buscar', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /abrir búsqueda/i }));

    const input = screen.getByPlaceholderText(/buscar por/i);
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('maxlength', '20');
    expect(screen.getByRole('button', { name: /abrir búsqueda/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('button', { name: /buscar/i })).not.toBeInTheDocument();
  });

  test('propaga cada cambio del input a onChange (búsqueda en vivo)', () => {
    const onChangeSpy = jest.fn();
    render(<Harness onChangeSpy={onChangeSpy} />);
    fireEvent.click(screen.getByRole('button', { name: /abrir búsqueda/i }));
    fireEvent.change(screen.getByPlaceholderText(/buscar por/i), { target: { value: '1001' } });
    expect(onChangeSpy).toHaveBeenCalledWith('1001');
    expect(screen.getByPlaceholderText(/buscar por/i)).toHaveValue('1001');
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
});
