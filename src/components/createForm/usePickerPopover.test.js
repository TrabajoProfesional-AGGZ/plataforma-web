import { renderHook, act } from '@testing-library/react';
import { usePickerPopover } from './usePickerPopover';

function setupOpenPopover() {
  const { result } = renderHook(() => usePickerPopover());

  const trigger = document.createElement('button');
  document.body.appendChild(trigger);
  const popover = document.createElement('div');
  document.body.appendChild(popover);
  result.current.triggerRef.current = trigger;
  result.current.popoverRef.current = popover;

  act(() => {
    result.current.openPopover();
  });

  return { result, trigger, popover };
}

describe('usePickerPopover', () => {
  test('un click afuera del trigger y del popover lo cierra', () => {
    jest.useFakeTimers();
    const { result, trigger, popover } = setupOpenPopover();
    expect(result.current.open).toBe(true);

    const outside = document.createElement('div');
    document.body.appendChild(outside);

    act(() => {
      outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(result.current.open).toBe(false);
    expect(result.current.closing).toBe(true);

    act(() => {
      jest.advanceTimersByTime(120);
    });

    expect(result.current.closing).toBe(false);

    document.body.removeChild(trigger);
    document.body.removeChild(popover);
    document.body.removeChild(outside);
    jest.useRealTimers();
  });

  test('un click dentro del popover no lo cierra', () => {
    const { result, trigger, popover } = setupOpenPopover();

    act(() => {
      popover.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(result.current.open).toBe(true);

    document.body.removeChild(trigger);
    document.body.removeChild(popover);
  });

  test('Escape cierra el popover y devuelve el foco al trigger', () => {
    jest.useFakeTimers();
    const { result, trigger, popover } = setupOpenPopover();
    const focusSpy = jest.spyOn(trigger, 'focus');

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(result.current.open).toBe(false);
    expect(result.current.closing).toBe(true);
    expect(focusSpy).toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(120);
    });

    expect(result.current.closing).toBe(false);

    document.body.removeChild(trigger);
    document.body.removeChild(popover);
    jest.useRealTimers();
  });

  test('handleClosed (onAnimationEnd) apaga closing sin esperar el timeout', () => {
    const { result, trigger, popover } = setupOpenPopover();

    act(() => {
      result.current.closePopover();
    });
    expect(result.current.open).toBe(false);
    expect(result.current.closing).toBe(true);

    act(() => {
      result.current.handleClosed();
    });
    expect(result.current.closing).toBe(false);

    document.body.removeChild(trigger);
    document.body.removeChild(popover);
  });

  test('reabrir mientras está cerrando cancela la salida', () => {
    const { result, trigger, popover } = setupOpenPopover();

    act(() => {
      result.current.closePopover();
    });
    expect(result.current.closing).toBe(true);

    act(() => {
      result.current.openPopover();
    });
    expect(result.current.open).toBe(true);
    expect(result.current.closing).toBe(false);

    document.body.removeChild(trigger);
    document.body.removeChild(popover);
  });

  test('otra tecla distinta de Escape no cierra el popover', () => {
    const { result, trigger, popover } = setupOpenPopover();

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(result.current.open).toBe(true);

    document.body.removeChild(trigger);
    document.body.removeChild(popover);
  });

  test('resize/scroll con el popover abierto recalcula la posición sin errores', () => {
    const { result, trigger, popover } = setupOpenPopover();

    expect(() => {
      act(() => {
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
      });
    }).not.toThrow();

    expect(result.current.open).toBe(true);

    document.body.removeChild(trigger);
    document.body.removeChild(popover);
  });
});
