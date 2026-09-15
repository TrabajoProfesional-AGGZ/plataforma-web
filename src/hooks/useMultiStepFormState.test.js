import { renderHook, act } from '@testing-library/react';
import { useMultiStepFormState } from './useMultiStepFormState';

describe('useMultiStepFormState', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('arranca en el paso 1 sin guarda de navegación', () => {
    const { result } = renderHook(() => useMultiStepFormState());
    expect(result.current.step).toBe(1);
    expect(result.current.direction).toBe(1);
    expect(result.current.navGuard).toBe(false);
    expect(result.current.submitted).toBe(false);
  });

  test('advance avanza de paso y activa la guarda de navegación', () => {
    const { result } = renderHook(() => useMultiStepFormState());
    act(() => result.current.advance());
    expect(result.current.step).toBe(2);
    expect(result.current.direction).toBe(1);
    expect(result.current.navGuard).toBe(true);
  });

  test('finNavGuard libera la guarda apenas termina la animación del paso', () => {
    const { result } = renderHook(() => useMultiStepFormState());
    act(() => result.current.advance());
    expect(result.current.navGuard).toBe(true);

    act(() => result.current.finNavGuard());
    expect(result.current.navGuard).toBe(false);
  });

  test('si nadie llama a finNavGuard, el respaldo de 300 ms libera la guarda igual', () => {
    const { result } = renderHook(() => useMultiStepFormState());
    act(() => result.current.advance());
    expect(result.current.navGuard).toBe(true);

    act(() => jest.advanceTimersByTime(299));
    expect(result.current.navGuard).toBe(true);

    act(() => jest.advanceTimersByTime(1));
    expect(result.current.navGuard).toBe(false);
  });

  test('finNavGuard cancela el respaldo: el timer viejo no pisa un advance posterior', () => {
    const { result } = renderHook(() => useMultiStepFormState());
    act(() => result.current.advance());
    act(() => jest.advanceTimersByTime(200));
    act(() => result.current.finNavGuard());

    // Segundo avance a los 250 ms: el timer del primero (que vencería a los 300)
    // fue cancelado, así que a los 300 ms la guarda del segundo sigue activa.
    act(() => jest.advanceTimersByTime(50));
    act(() => result.current.advance());
    act(() => jest.advanceTimersByTime(50));
    expect(result.current.navGuard).toBe(true);

    act(() => jest.advanceTimersByTime(250));
    expect(result.current.navGuard).toBe(false);
  });

  test('goBack retrocede de paso con dirección -1 y sin activar la guarda', () => {
    const { result } = renderHook(() => useMultiStepFormState());
    act(() => result.current.advance());
    act(() => result.current.finNavGuard());
    act(() => result.current.goBack());
    expect(result.current.step).toBe(1);
    expect(result.current.direction).toBe(-1);
    expect(result.current.navGuard).toBe(false);
  });

  test('setSubmitted marca el formulario como enviado', () => {
    const { result } = renderHook(() => useMultiStepFormState());
    act(() => result.current.setSubmitted(true));
    expect(result.current.submitted).toBe(true);
  });
});
