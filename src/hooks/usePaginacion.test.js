import { renderHook, act } from '@testing-library/react';
import { usePaginacion } from './usePaginacion';

function crearLista(n) {
  return Array.from({ length: n }, (_, i) => i + 1);
}

describe('usePaginacion', () => {
  test('devuelve una sola página cuando la lista entra en el tamaño de página', () => {
    const { result } = renderHook(() => usePaginacion(crearLista(5), 10));
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.pagina).toBe(1);
    expect(result.current.listaPaginada).toEqual(crearLista(5));
  });

  test('divide la lista en páginas de a 10', () => {
    const { result } = renderHook(() => usePaginacion(crearLista(25), 10));
    expect(result.current.totalPaginas).toBe(3);
    expect(result.current.listaPaginada).toEqual(crearLista(10));
  });

  test('irAPagina avanza a la página pedida y recorta la lista correspondiente', () => {
    const { result } = renderHook(() => usePaginacion(crearLista(25), 10));

    act(() => result.current.irAPagina(2));
    expect(result.current.pagina).toBe(2);
    expect(result.current.listaPaginada).toEqual(crearLista(20).slice(10));

    act(() => result.current.irAPagina(3));
    expect(result.current.pagina).toBe(3);
    expect(result.current.listaPaginada).toEqual([21, 22, 23, 24, 25]);
  });

  test('irAPagina no deja salir de los límites [1, totalPaginas]', () => {
    const { result } = renderHook(() => usePaginacion(crearLista(25), 10));

    act(() => result.current.irAPagina(99));
    expect(result.current.pagina).toBe(3);

    act(() => result.current.irAPagina(-5));
    expect(result.current.pagina).toBe(1);
  });

  test('resetPagina vuelve a la página 1', () => {
    const { result } = renderHook(() => usePaginacion(crearLista(25), 10));

    act(() => result.current.irAPagina(3));
    expect(result.current.pagina).toBe(3);

    act(() => result.current.resetPagina());
    expect(result.current.pagina).toBe(1);
  });

  test('si la lista se achica y la página actual queda fuera de rango, se ajusta automáticamente', () => {
    const { result, rerender } = renderHook(
      ({ lista }) => usePaginacion(lista, 10),
      { initialProps: { lista: crearLista(25) } }
    );

    act(() => result.current.irAPagina(3));
    expect(result.current.pagina).toBe(3);

    rerender({ lista: crearLista(5) });
    expect(result.current.pagina).toBe(1);
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.listaPaginada).toEqual(crearLista(5));
  });

  test('con lista vacía totalPaginas es 1 y no rompe', () => {
    const { result } = renderHook(() => usePaginacion([], 10));
    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.pagina).toBe(1);
    expect(result.current.listaPaginada).toEqual([]);
  });
});
