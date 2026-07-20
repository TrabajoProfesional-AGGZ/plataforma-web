import { StrictMode } from 'react';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import { ModalOverlay } from './ModalOverlay';
import { useBackToRoot } from '../../hooks/useBackToRoot';

function renderModal(onClose = jest.fn()) {
  return render(
    <div>
      <button type="button">Fuera del modal</button>
      <ModalOverlay onClose={onClose} ariaLabel="Modal de prueba">
        <button type="button">Primero</button>
        <button type="button">Segundo</button>
      </ModalOverlay>
    </div>
  );
}

describe('ModalOverlay', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('historial del navegador (back gesture)', () => {
    let pushStateSpy;
    let backSpy;

    beforeEach(() => {
      pushStateSpy = jest.spyOn(window.history, 'pushState');
      backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {});
    });

    afterEach(() => {
      pushStateSpy.mockRestore();
      backSpy.mockRestore();
    });

    test('empuja una entrada de historial al montar', () => {
      const { unmount } = renderModal();
      expect(pushStateSpy).toHaveBeenCalledTimes(1);
      unmount();
    });

    test('un evento popstate (gesto de atrás) cierra el modal', () => {
      const onClose = jest.fn();
      const { unmount } = renderModal(onClose);
      window.dispatchEvent(new PopStateEvent('popstate'));
      expect(onClose).toHaveBeenCalledTimes(1);
      unmount();
    });

    test('cerrar con Escape consume la entrada de historial pusheada (history.back)', async () => {
      const onClose = jest.fn();
      const { unmount } = renderModal(onClose);
      fireEvent.keyDown(document, { key: 'Escape' });
      unmount();
      // El consumo ahora es diferido (queueMicrotask) para sobrevivir al
      // doble-invoke sincrónico de StrictMode — hay que dejar drenar la cola
      // de microtasks antes de verificar.
      await Promise.resolve();
      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    test('un popstate tras un cierre por Escape no vuelve a llamar onClose', async () => {
      const onClose = jest.fn();
      const { unmount } = renderModal(onClose);
      fireEvent.keyDown(document, { key: 'Escape' });
      unmount();
      await Promise.resolve();
      window.dispatchEvent(new PopStateEvent('popstate'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('el montaje+desmontaje fantasma sincrónico de StrictMode no consume la entrada del montaje real', async () => {
      const onClose = jest.fn();
      const { unmount } = render(
        <StrictMode>
          <ModalOverlay onClose={onClose} ariaLabel="Modal de prueba">
            <button type="button">Adentro</button>
          </ModalOverlay>
        </StrictMode>
      );

      // Deja drenar el microtask que la cleanup fantasma de StrictMode
      // encoló — antes del fix, esto disparaba un history.back() real
      // sobre la entrada recién pusheada por el segundo montaje real.
      await Promise.resolve();
      expect(backSpy).not.toHaveBeenCalled();
      // El montaje real reutiliza la entrada que el montaje fantasma ya
      // había pusheado, en vez de pushear una segunda — si esto pusheara
      // dos veces, la entrada extra quedaría huérfana (nunca se consume)
      // y desincronizaría a cualquier consumidor de historial externo.
      expect(pushStateSpy).toHaveBeenCalledTimes(1);

      // El modal debe responder con normalidad después del ciclo fantasma.
      window.dispatchEvent(new PopStateEvent('popstate'));
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });

    test('cerrar (bajo StrictMode) un modal anidado en una pantalla no-raíz de useBackToRoot no vuelve a la raíz', async () => {
      // Reproducción end-to-end del bug reportado: pantalla away-from-root
      // (ej. SociosPage con modo='socio') + modal abierto encima (ej.
      // EditSocioForm) + StrictMode en dev. Antes del fix del leak de
      // entrada huérfana, cerrar el modal por Cancelar/Escape/click-afuera
      // bounceaba a la raíz aunque el fix del landing-check ya estuviera
      // aplicado, porque el mount fantasma de StrictMode dejaba una
      // entrada de historial sin consumir que desincronizaba el chequeo.
      // Usa el `history.back()` real de jsdom (no el mock no-op de
      // `backSpy`) para que la navegación y el `popstate` resultante sean
      // genuinos — jsdom lo despacha como macrotask, no microtask.
      backSpy.mockRestore();

      const onBack = jest.fn();
      renderHook(() => useBackToRoot('socio', 'lista', onBack));

      const onClose = jest.fn();
      const { unmount } = render(
        <StrictMode>
          <ModalOverlay onClose={onClose} ariaLabel="Modal de prueba">
            <button type="button">Adentro</button>
          </ModalOverlay>
        </StrictMode>
      );
      await Promise.resolve();

      // Cierre real (no popstate): Cancelar/Escape/click-afuera, todos
      // terminan desmontando el ModalOverlay.
      unmount();
      // jsdom despacha el popstate de un back() real con más de un tick de
      // demora — un solo `setTimeout(0)` no alcanza a observarlo.
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onBack).not.toHaveBeenCalled();
    });
  });

  test('expone role="dialog" y aria-modal="true"', () => {
    renderModal();
    const dialog = screen.getByRole('dialog', { name: /modal de prueba/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('cierra al presionar Escape en cualquier parte del documento', () => {
    const onClose = jest.fn();
    renderModal(onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('Enter no cierra el modal (se quitó el Enter-to-close)', () => {
    const onClose = jest.fn();
    renderModal(onClose);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });

  test('cierra al hacer click en el overlay pero no en el contenido', () => {
    const onClose = jest.fn();
    render(
      <ModalOverlay onClose={onClose} ariaLabel="Modal">
        <button type="button">Adentro</button>
      </ModalOverlay>
    );
    fireEvent.click(screen.getByText('Adentro'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('dialog').parentElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('mueve el foco al wrapper del modal al montar', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  test('Tab cicla el foco dentro del modal (focus trap)', () => {
    renderModal();
    const primero = screen.getByRole('button', { name: /primero/i });
    const segundo = screen.getByRole('button', { name: /segundo/i });

    segundo.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(primero).toHaveFocus();

    primero.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(segundo).toHaveFocus();
  });

  test('bloquea el scroll del body mientras está montado y lo restaura al desmontar', () => {
    const { unmount } = renderModal();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  test('restaura el foco al elemento previamente enfocado al desmontar', () => {
    const btnFuera = document.createElement('button');
    document.body.appendChild(btnFuera);
    btnFuera.focus();

    const { unmount } = render(
      <ModalOverlay onClose={jest.fn()} ariaLabel="Modal">
        <button type="button">Adentro</button>
      </ModalOverlay>
    );
    unmount();
    expect(btnFuera).toHaveFocus();
    btnFuera.remove();
  });
});
