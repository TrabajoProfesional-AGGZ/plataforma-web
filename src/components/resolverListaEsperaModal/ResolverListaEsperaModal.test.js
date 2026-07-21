import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ResolverListaEsperaModal } from './ResolverListaEsperaModal';

jest.mock('../../services/disciplinasService', () => ({
  resolverListaEspera: jest.fn(),
}));
const { resolverListaEspera } = require('../../services/disciplinasService');

function renderModal() {
  const onSuccess = jest.fn();
  const onCancel = jest.fn();
  render(
    <ResolverListaEsperaModal
      idDisciplina="disc-1"
      idSocio="socio-1"
      nombreSocio="Ana Gómez"
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
  return { onSuccess, onCancel };
}

describe('ResolverListaEsperaModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el nombre del socio y las dos acciones', () => {
    renderModal();
    expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pasar inscripción a activa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar de la lista de espera' })).toBeInTheDocument();
  });

  test('click en "Pasar inscripción a activa" llama al servicio con accion=activar y onSuccess', async () => {
    resolverListaEspera.mockResolvedValue({ estado_suscripcion: 'activa' });
    const { onSuccess } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Pasar inscripción a activa' }));

    await waitFor(() => {
      expect(resolverListaEspera).toHaveBeenCalledWith('disc-1', 'socio-1', 'activar');
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('click en "Eliminar de la lista de espera" llama al servicio con accion=eliminar y onSuccess', async () => {
    resolverListaEspera.mockResolvedValue({ estado_suscripcion: 'inactiva' });
    const { onSuccess } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar de la lista de espera' }));

    await waitFor(() => {
      expect(resolverListaEspera).toHaveBeenCalledWith('disc-1', 'socio-1', 'eliminar');
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('llama a onCancel al hacer click en Cancelar', () => {
    const { onCancel } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('muestra error si el servicio no está disponible', async () => {
    resolverListaEspera.mockRejectedValue(new Error('servicio-no-disponible'));
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Pasar inscripción a activa' }));

    expect(await screen.findByText(/no está disponible/i)).toBeInTheDocument();
  });

  test('muestra error genérico ante fallos desconocidos', async () => {
    resolverListaEspera.mockRejectedValue(new Error('unknown-error'));
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar de la lista de espera' }));

    expect(await screen.findByText('No se pudo procesar la acción. Intentá de nuevo.')).toBeInTheDocument();
  });
});
