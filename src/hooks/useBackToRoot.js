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
 * consumidor de historial anidado (un modal via useModalHistory, o un
 * wizard multi-nivel via useStepHistory) que consume una de sus propias
 * entradas, ubicada por encima de la de este hook en la pila, tambien
 * dispara un `popstate` que el listener de este hook recibe. El handler
 * de abajo distingue los casos chequeando si la entrada donde aterrizo el
 * navegador tiene un `id` rastreado (la propia de este hook, o la de un
 * consumidor anidado que sigue por encima) — aterrizar en CUALQUIER
 * entrada con `id` significa que el gesto todavia no salio de este
 * segmento, `onBack` NO debe dispararse. Solo aterrizar en un estado sin
 * `id` (el estado previo real, de antes de que este hook empezara a
 * pushear) significa que el gesto paso la entrada propia de este hook y
 * `onBack` si debe dispararse.
 *
 * Chequear estrictamente "es exactamente mi propia entrada" (en vez de
 * "la entrada donde aterrice tiene algun id") funcionaba para un
 * consumidor anidado de un solo nivel como un modal, donde consumir su
 * entrada siempre aterriza exactamente de vuelta en la de este hook — pero
 * se rompia con un consumidor multi-nivel como useStepHistory (una entrada
 * por paso de wizard): retroceder un paso dentro del wizard aterriza en
 * OTRA entrada propia del wizard, no en la de este hook, lo que el chequeo
 * estricto interpretaba mal como "salio de mi segmento" y disparaba
 * `onBack` en cada retroceso interno del wizard.
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

      // Aterrizar en cualquier entrada rastreada (la propia, o la de un
      // consumidor anidado — un modal o un paso de wizard — que sigue por
      // encima) significa que todavia no se abandono este segmento, se
      // ignora. Solo un estado sin `id` (el estado previo real) significa
      // que el gesto realmente paso de largo.
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
