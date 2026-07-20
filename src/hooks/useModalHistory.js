import { useEffect, useRef } from 'react';

let modalHistoryIdCounter = 0;

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
 *
 * La decision de consumir en el cleanup se difiere con `queueMicrotask`, y
 * el cleanup ya no hace que el siguiente re-setup pushee incondicionalmente
 * una entrada nueva — ambas cosas existen para sobrevivir al doble-invoke
 * de efectos de montaje de React 18 StrictMode en dev (setup -> cleanup ->
 * setup, sincronico, uno atras del otro, misma instancia del componente,
 * mismos refs). `pendingConsumeRef` es un token de cancelacion del mismo
 * tick: el cleanup lo arma antes de encolar el chequeo diferido de
 * consumo; si un re-setup corre antes de que ese chequeo se dispare (el
 * remontaje fantasma de StrictMode), lo desarma y *reutiliza* la entrada
 * que el cleanup estaba por consumir en vez de pushear una duplicada. Sin
 * esta deduplicacion, un push incondicional en cada setup traeria dos
 * bugs: (1) si el cleanup llamara a `history.back()` sincronicamente, se
 * dispararia para un desmontaje fantasma que el re-setup del mismo tick ya
 * reemplazo — pero `history.back()` solo *solicita* una navegacion (el
 * popstate real se despacha de forma asincronica), asi que para cuando se
 * resuelve, el segundo setup ya pusheo una entrada *nueva* encima de la
 * posicion real todavia sin moverse, corrompiendo la pila; (2) incluso
 * solo diferir el chequeo sin deduplicar tambien el push deja la entrada
 * del montaje fantasma sin consumir para siempre una vez que el montaje
 * real (el que sobrevive) reutiliza una entrada *distinta* — una entrada
 * de historial huerfana que desincroniza a cualquier consumidor de
 * historial externo (ej. useBackToRoot) que compare contra su propio id
 * pusheado cuando este modal se cierre de verdad mas tarde. Reutilizar la
 * misma entrada durante todo el ciclo fantasma hace que ocurra exactamente
 * un `pushState` para todo el doble-invoke, igual que un montaje unico
 * (produccion, sin StrictMode) hubiera hecho.
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
      // Un cleanup fantasma del mismo tick ya pusheo una entrada y armo su
      // chequeo diferido de consumo — reutilizar esa entrada en vez de
      // pushear una duplicada, y desarmar el chequeo para que la entrada
      // sobreviva para este montaje (real).
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
        // Desarmado significa que un re-setup ya reutilizo esta entrada —
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
