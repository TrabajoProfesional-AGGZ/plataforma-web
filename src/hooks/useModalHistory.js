import { useEffect, useRef } from 'react';

/**
 * Ata el tiempo de vida de un modal a la entrada de historia del navegador
 * para que el gesto/boton de "atras" del celular cierre el modal en vez 
 * de toda la aplicacion. Pushea una entrada al montar, un `popstate` 
 * (volver a atras de hardware) llama a `onClose`. Si el modal es cerrado
 * de otra manera (ESC, Cancelar, click fuera del modal), la entrada pusheada
 * es consumida al desmontar para que no quede colgada como un volver a atras
 * no relacionado que el usuario tenga que usar luego. Sin embargo, si alguna otra
 * cosa (por ejemplo una navegacion) pushea por encima, volver a atras
 * desharia esa navegacion.
 */
export function useModalHistory(onClose) {
  const onCloseRef = useRef(onClose);
  const poppedRef = useRef(false);
  const pushedStateRef = useRef(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const state = { modalOverlay: true, id: Date.now() + Math.random() };
    pushedStateRef.current = state;
    window.history.pushState(state, '');

    const handlePopState = () => {
      poppedRef.current = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!poppedRef.current && window.history.state?.id === pushedStateRef.current?.id) {
        window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
