import { useEffect, useRef } from 'react';

let backToRootIdCounter = 0;

/**
 * Ata la pantalla actual a una entrada del historial para que el gesto
 * "atrás" vuelva a `rootValue` en vez de cerrar la app, sin acumular una
 * entrada por transición. Al volver a la raíz por otra vía, consume esa
 * entrada con `history.back()` — salvo que algo más haya navegado encima,
 * para no deshacer esa navegación ajena.
 *
 * `onBack` solo se dispara si el `popstate` aterriza en una entrada SIN `id`
 * rastreado: un `popstate` también ocurre al consumirse una entrada de un
 * consumidor anidado (modal, wizard), y esas conservan su propio `id`.
 *
 * @param {*} current - Valor actual de la "pantalla" (comparado con `===`).
 * @param {*} rootValue - Valor que representa la raíz.
 * @param {() => void} onBack - Se dispara cuando un gesto de atrás real abandona el segmento.
 */
export function useBackToRoot(current, rootValue, onBack) {
  const onBackRef = useRef(onBack);
  const currentRef = useRef(current);
  // Arranca en falso a propósito: así un montaje que ya arranca afuera de
  // la raíz también pushea su entrada en el primer efecto.
  const isAwayRef = useRef(false);
  const poppedRef = useRef(false);
  const pushedStateRef = useRef(null);

  useEffect(() => {
    onBackRef.current = onBack;
    currentRef.current = current;
  }, [onBack, current]);

  useEffect(() => {
    const isAway = current !== rootValue;

    if (isAway && !isAwayRef.current) {
      const state = { backToRoot: true, id: Date.now() + '-' + (backToRootIdCounter++) };
      pushedStateRef.current = state;
      window.history.pushState(state, '');
      isAwayRef.current = true;
    } else if (!isAway && isAwayRef.current) {
      isAwayRef.current = false;
      if (!poppedRef.current && window.history.state?.id === pushedStateRef.current?.id) {
        window.history.back();
      }
      poppedRef.current = false;
    }
  }, [current, rootValue]);

  useEffect(() => {
    const handlePopState = () => {
      if (currentRef.current === rootValue) return;

      // Una entrada con `id` (propia o de un anidado) significa que el
      // gesto no salió de este segmento todavía.
      if (window.history.state?.id) {
        return;
      }

      poppedRef.current = true;
      onBackRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [rootValue]);
}
