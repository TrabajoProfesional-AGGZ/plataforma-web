import { render, screen, fireEvent } from '@testing-library/react';
import { ModalOverlay } from './ModalOverlay';

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

    test('cerrar con Escape consume la entrada de historial pusheada (history.back)', () => {
      const onClose = jest.fn();
      const { unmount } = renderModal(onClose);
      fireEvent.keyDown(document, { key: 'Escape' });
      unmount();
      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    test('un popstate tras un cierre por Escape no vuelve a llamar onClose', () => {
      const onClose = jest.fn();
      const { unmount } = renderModal(onClose);
      fireEvent.keyDown(document, { key: 'Escape' });
      unmount();
      window.dispatchEvent(new PopStateEvent('popstate'));
      expect(onClose).toHaveBeenCalledTimes(1);
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
