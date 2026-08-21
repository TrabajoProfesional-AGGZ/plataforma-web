import { useEffect, useRef } from 'react';

let modalHistoryIdCounter = 0;

/**
 * Ata el tiempo de vida de un modal a una entrada del historial para que el
 * gesto "atrás" lo cierre en vez de la app: pushea una entrada al montar, un
 * `popstate` llama a `onClose`, y al desmontar por otra vía (ESC, Cancelar,
 * click afuera) consume esa entrada con `history.back()` — salvo que algo
 * más haya navegado encima, para no deshacer esa navegación ajena.
 *
 * `pendingConsumeRef` + `queueMicrotask` evitan que el doble-invoke de
 * efectos de React 18 StrictMode (setup → cleanup → setup) pushee una
 * entrada duplicada o deje una sin consumir — lo que desincronizaría a
 * consumidores de historial externos como `useBackToRoot`. Si un re-setup
 * llega antes de que el consumo diferido del cleanup se ejecute, reutiliza
 * esa misma entrada en vez de pushear una nueva.
 *
 * @param {() => void} onClose - Se dispara al cerrar el modal (gesto de atrás o desmontaje).
 */
export function useModalHistory(onClose) {
  const onCloseRef = useRef(onClose);
  const poppedRef = useRef(false);
  const pushedStateRef = useRef(null);
  const pendingConsumeRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let state;
    if (pendingConsumeRef.current) {
      // Un cleanup fantasma del mismo tick ya pusheó esta entrada: reutilizarla
      // en vez de duplicar, y desarmar su chequeo diferido de consumo.
      state = pushedStateRef.current;
      pendingConsumeRef.current = false;
    } else {
      state = { modalOverlay: true, id: Date.now() + '-' + (modalHistoryIdCounter++) };
      pushedStateRef.current = state;
      window.history.pushState(state, '');
    }

    const handlePopState = () => {
      poppedRef.current = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      pendingConsumeRef.current = true;
      queueMicrotask(() => {
        // Desarmado significa que un re-setup ya reutilizó esta entrada —
        // ese montaje (real) es dueño de ella ahora, no tocar el historial.
        if (!pendingConsumeRef.current) return;
        pendingConsumeRef.current = false;
        if (!poppedRef.current && window.history.state?.id === state.id) {
          window.history.back();
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
