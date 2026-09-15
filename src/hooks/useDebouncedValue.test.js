import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('devuelve el valor inicial de inmediato', () => {
    const { result } = renderHook(() => useDebouncedValue('hola', 150));
    expect(result.current).toBe('hola');
  });

  test('no actualiza el valor hasta que pasa el retraso', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 150), { initialProps: { v: '' } });
    rerender({ v: 'a' });
    expect(result.current).toBe('');

    act(() => jest.advanceTimersByTime(149));
    expect(result.current).toBe('');

    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe('a');
  });

  test('si el valor sigue cambiando, solo se refleja el último', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 150), { initialProps: { v: '' } });
    rerender({ v: 'a' });
    act(() => jest.advanceTimersByTime(100));
    rerender({ v: 'ab' });
    act(() => jest.advanceTimersByTime(100));
    expect(result.current).toBe('');

    act(() => jest.advanceTimersByTime(50));
    expect(result.current).toBe('ab');
  });

  test('usa 150 ms por defecto', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v), { initialProps: { v: 1 } });
    rerender({ v: 2 });
    act(() => jest.advanceTimersByTime(149));
    expect(result.current).toBe(1);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(2);
  });
});
