import { act, renderHook } from '@testing-library/react';
import { useBuscadorSocio } from './useBuscadorSocio';

jest.mock('../services/sociosService', () => ({
  getSocioByNroSocio: jest.fn(),
}));

const { getSocioByNroSocio } = require('../services/sociosService');

const SOCIO_TEST = { id: 'socio-1', nro_socio: '1234', nombre: 'Juan', apellido: 'García' };

describe('useBuscadorSocio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handleNroSocioChange actualiza el input y limpia preview/selección/error previos', () => {
    const { result } = renderHook(() => useBuscadorSocio());

    act(() => result.current.handleNroSocioChange('1234'));

    expect(result.current.nroSocioInput).toBe('1234');
    expect(result.current.socioSeleccionado).toBeNull();
    expect(result.current.errorSocio).toBe('');
  });

  test('previewSocio no busca si el valor está vacío', async () => {
    const { result } = renderHook(() => useBuscadorSocio());
    await act(async () => result.current.previewSocio('   '));
    expect(getSocioByNroSocio).not.toHaveBeenCalled();
  });

  test('previewSocio falla silenciosamente si el socio no existe', async () => {
    getSocioByNroSocio.mockRejectedValueOnce(new Error('no encontrado'));
    const { result } = renderHook(() => useBuscadorSocio());
    await act(async () => result.current.previewSocio('9999'));
    expect(result.current.errorSocio).toBe('');
    expect(result.current.socioSeleccionado).toBeNull();
  });

  test('buscarSocio no hace nada si el input está vacío', async () => {
    const { result } = renderHook(() => useBuscadorSocio());
    await act(async () => result.current.buscarSocio());
    expect(getSocioByNroSocio).not.toHaveBeenCalled();
  });

  test('buscarSocio reusa el preview ya resuelto en vez de pedirlo de nuevo', async () => {
    getSocioByNroSocio.mockResolvedValueOnce(SOCIO_TEST);
    const { result } = renderHook(() => useBuscadorSocio());

    act(() => result.current.handleNroSocioChange('1234'));
    await act(async () => result.current.previewSocio('1234'));
    getSocioByNroSocio.mockClear();

    await act(async () => result.current.buscarSocio());

    expect(getSocioByNroSocio).not.toHaveBeenCalled();
    expect(result.current.socioSeleccionado).toEqual(SOCIO_TEST);
  });

  test('buscarSocio pide el socio si no hay preview coincidente y lo selecciona', async () => {
    getSocioByNroSocio.mockResolvedValueOnce(SOCIO_TEST);
    const { result } = renderHook(() => useBuscadorSocio());

    act(() => result.current.handleNroSocioChange('1234'));
    await act(async () => result.current.buscarSocio());

    expect(getSocioByNroSocio).toHaveBeenCalledWith('1234');
    expect(result.current.socioSeleccionado).toEqual(SOCIO_TEST);
  });

  test('buscarSocio informa error si no se encuentra el socio', async () => {
    getSocioByNroSocio.mockRejectedValueOnce(new Error('no encontrado'));
    const { result } = renderHook(() => useBuscadorSocio());

    act(() => result.current.handleNroSocioChange('9999'));
    await act(async () => result.current.buscarSocio());

    expect(result.current.errorSocio).toBe('No se encontró ningún socio con ese número.');
    expect(result.current.busquedaSocio).toBe(false);
  });
});
