import { useEffect, useRef } from 'react';

let backToRootIdCounter = 0;

/**
 * Ata la pantalla actual con el estado del navegador para que el gesto/boton 
 * del celular vuelva para atras al `rootValue` en vez de cerrar la aplicacion
 * sin importar cuantas transiciones hayan ocurrido dentro de la aplicacion.
 * La unica entrada que se "guarda" en el historial es la raiz, por lo que 
 * volver siempre vuelve a esta
 *
 * Al volver al estado raiz de alguna otra manera (por ejemplo, apretando el
 * boton de "Inicio"), la entrada pusheada se consume mediante `history.back()`.
 * Si alguna otra cosa (por ejempli una navegacion disparada en el mismo click)
 * sucede ademas de esto, volver para atras deshace esa navegacion, entonces se saltea
 * y una entrada inofensiva se queda atras en vez de una navegacion corrupta.
 *
 * Un `popstate` se dispara ante *cualquier* atras/adelante del navegador,
 * no solo el que sale del segmento propio de este hook — por ejemplo, un
 * consumidor de historial anidado (un modal via useModalHistory) que
 * consume su propia entrada, ubicada por encima de la de este hook en la
 * pila, tambien dispara un `popstate` que el listener de este hook recibe.
 * El handler de abajo distingue ambos casos chequeando donde aterrizo
 * realmente el navegador: si sigue en la entrada propia de este hook,
 * solo se consumio algo anidado por encima y `onBack` NO debe dispararse;
 * si aterrizo en cualquier otro lado, el gesto real paso la entrada propia
 * de este hook y `onBack` si debe dispararse.
 */
export function useBackToRoot(current, rootValue, onBack) {
  const onBackRef = useRef(onBack);
  const currentRef = useRef(current);
  // Arranca en falso a proposito, sin importar del evento "actual":
  // el efecto de push/pop denajo trata "false" como "nada pusheado aun", 
  // por lo que un componente que se monta afuera de root igualmente pushea
  // su entrada en el primer efecto corrido.
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

      // Si seguimos en la entrada propia, algo anidado por encima fue lo
      // que se consumio — el segmento propio no se abandono, se ignora.
      if (pushedStateRef.current && window.history.state?.id === pushedStateRef.current.id) {
        return;
      }

      poppedRef.current = true;
      onBackRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [rootValue]);
}
