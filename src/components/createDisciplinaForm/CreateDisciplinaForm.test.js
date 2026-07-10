import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateDisciplinaForm } from './CreateDisciplinaForm';

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');

const onSuccess = jest.fn();
const onCancel = jest.fn();

function renderForm() {
  return render(<CreateDisciplinaForm onSuccess={onSuccess} onCancel={onCancel} />);
}

async function avanzarAlPaso2() {
  fireEvent.change(screen.getByPlaceholderText(/natación, fútbol, tenis/i), { target: { value: 'Natación' } });
  fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
  act(() => jest.advanceTimersByTime(300));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CreateDisciplinaForm', () => {
  test('renderiza el paso 1 con el campo nombre', () => {
    renderForm();
    expect(screen.getByText('Nueva disciplina')).toBeInTheDocument();
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/natación, fútbol, tenis/i)).toBeInTheDocument();
  });

  test('muestra el botón Cancelar en el paso 1', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  test('llama onCancel al hacer clic en Cancelar', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama onCancel al presionar ESC', () => {
    renderForm();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama onCancel al hacer clic en el overlay', () => {
    renderForm();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('no avanza al paso 2 si el nombre está vacío', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
  });

  test('avanza al paso 2 con nombre válido', async () => {
    renderForm();
    await avanzarAlPaso2();
    expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ej\. 30/i)).toBeInTheDocument();
  });

  test('muestra el botón Atrás en el paso 2', async () => {
    renderForm();
    await avanzarAlPaso2();
    expect(screen.getByRole('button', { name: /atrás/i })).toBeInTheDocument();
  });

  test('vuelve al paso 1 al hacer clic en Atrás', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.click(screen.getByRole('button', { name: /atrás/i }));
    await waitFor(() => expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument());
  });

  test('no envía si el cupo máximo está vacío', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    await waitFor(() => {
      expect(screen.getByText('El cupo máximo es requerido')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si el cupo máximo es 0', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 30/i), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    await waitFor(() => {
      expect(screen.getByText(/debe ser mayor a 0/i)).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('muestra pantalla de éxito y llama onSuccess con datos correctos (no arancelada)', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 30/i), { target: { value: '20' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('¡Disciplina creada!')).toBeInTheDocument();
    });
    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith({
      nombre: 'Natación',
      cupo_maximo: 20,
      arancelada: false,
      concepto_cobro: '',
    });
  });

  test('el checkbox arancelada no aparece marcado por defecto', async () => {
    renderForm();
    await avanzarAlPaso2();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  test('al marcar arancelada aparece el campo concepto de cobro', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByPlaceholderText(/cuota mensual/i)).toBeInTheDocument();
  });

  test('no envía si arancelada=true y concepto de cobro está vacío', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 30/i), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    await waitFor(() => {
      expect(screen.getByText(/el concepto de cobro es requerido/i)).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('llama onSuccess con concepto_cobro cuando es arancelada', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 30/i), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByPlaceholderText(/cuota mensual/i), { target: { value: 'Cuota mensual de natación' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    });
    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith({
      nombre: 'Natación',
      cupo_maximo: 10,
      arancelada: true,
      concepto_cobro: 'Cuota mensual de natación',
    });
  });

  test('muestra indicadores de pasos Datos y Configuración', () => {
    renderForm();
    expect(screen.getByText('Datos')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  test('el input nombre maneja focus y blur', () => {
    renderForm();
    const input = screen.getByPlaceholderText(/natación, fútbol, tenis/i);
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(input).toBeInTheDocument();
  });

  test('el input cupo máximo maneja focus y blur', async () => {
    renderForm();
    await avanzarAlPaso2();
    const input = screen.getByPlaceholderText(/ej\. 30/i);
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(input).toBeInTheDocument();
  });
});
