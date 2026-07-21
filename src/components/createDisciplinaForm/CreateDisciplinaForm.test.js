import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateDisciplinaForm } from './CreateDisciplinaForm';
import { fetchCategoriasSocio, fetchSedes } from '../../services/catalogosService';

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));
jest.mock('../../services/catalogosService', () => ({
  fetchCategoriasSocio: jest.fn(),
  fetchSedes: jest.fn(),
}));

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

function seleccionarCategoriaYSede(categoria = 'Infantil', sede = 'Sede Central') {
  fireEvent.change(screen.getByLabelText(/categoría de socio/i), { target: { value: categoria } });
  fireEvent.change(screen.getByLabelText(/^sede/i), { target: { value: sede } });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  fetchCategoriasSocio.mockResolvedValue([
    { id: 1, nombre: 'Infantil' },
    { id: 2, nombre: 'Activo' },
  ]);
  fetchSedes.mockResolvedValue([
    { id: 1, nombre: 'Sede Central' },
    { id: 2, nombre: 'Sede Norte' },
  ]);
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
    seleccionarCategoriaYSede();
    fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    await waitFor(() => {
      expect(screen.getByText('El cupo máximo es requerido')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si el cupo máximo es 0', async () => {
    renderForm();
    await avanzarAlPaso2();
    seleccionarCategoriaYSede();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 30/i), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    await waitFor(() => {
      expect(screen.getByText(/debe ser mayor a 0/i)).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si no se selecciona categoría de socio', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.change(screen.getByLabelText(/^sede/i), { target: { value: 'Sede Central' } });
    fireEvent.change(screen.getByPlaceholderText(/ej\. 30/i), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    await waitFor(() => {
      expect(screen.getByText('La categoría de socio es requerida')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si no se selecciona sede', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.change(screen.getByLabelText(/categoría de socio/i), { target: { value: 'Infantil' } });
    fireEvent.change(screen.getByPlaceholderText(/ej\. 30/i), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    await waitFor(() => {
      expect(screen.getByText('La sede es requerida')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('muestra pantalla de éxito y llama onSuccess con datos correctos (no arancelada)', async () => {
    renderForm();
    await avanzarAlPaso2();
    seleccionarCategoriaYSede();
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
      monto_mensual: null,
      categoria_socio: 'Infantil',
      sede: 'Sede Central',
    });
  });

  test('el checkbox arancelada no aparece marcado por defecto', async () => {
    renderForm();
    await avanzarAlPaso2();
    const checkbox = screen.getByRole('checkbox', { name: /la disciplina tiene un arancel asociado/i });
    expect(checkbox).not.toBeChecked();
  });

  test('al marcar arancelada aparece el campo concepto de cobro', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.click(screen.getByRole('checkbox', { name: /la disciplina tiene un arancel asociado/i }));
    expect(screen.getByPlaceholderText(/cuota mensual/i)).toBeInTheDocument();
  });

  test('no envía si arancelada=true y concepto de cobro está vacío', async () => {
    renderForm();
    await avanzarAlPaso2();
    seleccionarCategoriaYSede();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 30/i), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /la disciplina tiene un arancel asociado/i }));
    fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    await waitFor(() => {
      expect(screen.getByText(/el concepto de cobro es requerido/i)).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('llama onSuccess con concepto_cobro y monto_mensual cuando es arancelada', async () => {
    renderForm();
    await avanzarAlPaso2();
    seleccionarCategoriaYSede('Activo', 'Sede Norte');
    fireEvent.change(screen.getByPlaceholderText(/ej\. 30/i), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /la disciplina tiene un arancel asociado/i }));
    fireEvent.change(screen.getByPlaceholderText(/cuota mensual/i), { target: { value: 'Cuota mensual de natación' } });
    fireEvent.change(screen.getByPlaceholderText(/ej\. 5000/i), { target: { value: '3000' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    });
    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith({
      nombre: 'Natación',
      cupo_maximo: 10,
      arancelada: true,
      concepto_cobro: 'Cuota mensual de natación',
      monto_mensual: 3000,
      categoria_socio: 'Activo',
      sede: 'Sede Norte',
    });
  });

  test('no envía si arancelada=true y el arancel mensual está vacío', async () => {
    renderForm();
    await avanzarAlPaso2();
    seleccionarCategoriaYSede();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 30/i), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /la disciplina tiene un arancel asociado/i }));
    fireEvent.change(screen.getByPlaceholderText(/cuota mensual/i), { target: { value: 'Cuota mensual' } });
    fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    await waitFor(() => {
      expect(screen.getByText(/el arancel mensual es requerido/i)).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('carga las categorías de socio y las sedes, y permite seleccionarlas', async () => {
    renderForm();
    await avanzarAlPaso2();
    await waitFor(() => expect(fetchCategoriasSocio).toHaveBeenCalled());
    await waitFor(() => expect(fetchSedes).toHaveBeenCalled());
    expect(await screen.findByRole('option', { name: 'Infantil' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Sede Norte' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/ej\. 30/i), { target: { value: '20' } });
    seleccionarCategoriaYSede('Infantil', 'Sede Norte');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    });
    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ categoria_socio: 'Infantil', sede: 'Sede Norte' }));
  });

  test('permite crear una disciplina sin límite de cupo', async () => {
    renderForm();
    await avanzarAlPaso2();
    seleccionarCategoriaYSede();
    fireEvent.click(screen.getByRole('checkbox', { name: /la disciplina no tiene límite de capacidad/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('¡Disciplina creada!')).toBeInTheDocument();
    });
    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith({
      nombre: 'Natación',
      cupo_maximo: null,
      arancelada: false,
      concepto_cobro: '',
      monto_mensual: null,
      categoria_socio: 'Infantil',
      sede: 'Sede Central',
    });
  });

  test('deshabilita el input de cupo máximo al marcar sin límite', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.click(screen.getByRole('checkbox', { name: /la disciplina no tiene límite de capacidad/i }));
    expect(screen.getByPlaceholderText(/ej\. 30/i)).toBeDisabled();
  });

  test('no exige cupo máximo si sin límite está marcado, aunque el campo esté vacío', async () => {
    renderForm();
    await avanzarAlPaso2();
    seleccionarCategoriaYSede();
    fireEvent.click(screen.getByRole('checkbox', { name: /la disciplina no tiene límite de capacidad/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear disciplina/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('¡Disciplina creada!')).toBeInTheDocument();
    });
    expect(screen.queryByText('El cupo máximo es requerido')).not.toBeInTheDocument();
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
