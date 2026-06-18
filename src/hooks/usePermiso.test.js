import { renderHook } from '@testing-library/react';
import { usePermiso } from './usePermiso';

jest.mock('./useAuth', () => ({ useAuth: jest.fn() }));
import { useAuth } from './useAuth';

describe('usePermiso', () => {
  test('devuelve true cuando el permiso está en el array', () => {
    useAuth.mockReturnValue({ permisos: ['ver_socios', 'crear_socio'] });
    const { result } = renderHook(() => usePermiso('ver_socios'));
    expect(result.current).toBe(true);
  });

  test('devuelve false cuando el permiso no está en el array', () => {
    useAuth.mockReturnValue({ permisos: ['ver_socios'] });
    const { result } = renderHook(() => usePermiso('borrar_socio'));
    expect(result.current).toBe(false);
  });

  test('devuelve false cuando el array de permisos está vacío', () => {
    useAuth.mockReturnValue({ permisos: [] });
    const { result } = renderHook(() => usePermiso('ver_socios'));
    expect(result.current).toBe(false);
  });
});
