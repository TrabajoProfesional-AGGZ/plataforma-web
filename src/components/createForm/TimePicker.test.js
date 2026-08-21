import { render, screen, fireEvent } from '@testing-library/react';
import { TimePicker } from './TimePicker';

describe('TimePicker', () => {
  test('clickear una hora y luego un minuto registra ambos valores (no solo el último)', () => {
    const { container } = render(<TimePicker name="hora_inicio" />);

    fireEvent.click(screen.getByRole('button', { name: /seleccionar hora/i }));
    fireEvent.click(screen.getByRole('option', { name: '14' }));
    fireEvent.click(screen.getByRole('option', { name: '30' }));

    const hiddenInput = container.querySelector('input[type="time"]');
    expect(hiddenInput.value).toBe('14:30');
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  test('al elegir el minuto se cierra el selector', () => {
    render(<TimePicker name="hora_inicio" />);

    fireEvent.click(screen.getByRole('button', { name: /seleccionar hora/i }));
    fireEvent.click(screen.getByRole('option', { name: '14' }));
    fireEvent.click(screen.getByRole('option', { name: '30' }));

    expect(screen.queryByRole('dialog', { name: /elegir hora/i })).not.toBeInTheDocument();
  });

  test('reabrir el selector con el botón permite cambiar la hora/minuto ya elegidos', () => {
    const { container } = render(<TimePicker name="hora_inicio" />);
    const trigger = screen.getByRole('button', { name: /seleccionar hora/i });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('option', { name: '14' }));
    fireEvent.click(screen.getByRole('option', { name: '30' }));

    fireEvent.click(screen.getByRole('button', { name: '14:30' }));
    fireEvent.click(screen.getByRole('option', { name: '09' }));
    fireEvent.click(screen.getByRole('option', { name: '45' }));

    const hiddenInput = container.querySelector('input[type="time"]');
    expect(hiddenInput.value).toBe('09:45');
    expect(screen.getByText('09:45')).toBeInTheDocument();
  });

  test('el trigger muestra el placeholder por defecto', () => {
    render(<TimePicker name="hora_inicio" placeholder="Elegí un horario" />);
    expect(screen.getByText('Elegí un horario')).toBeInTheDocument();
  });
});
