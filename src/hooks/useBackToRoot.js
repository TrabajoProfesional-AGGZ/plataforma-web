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
      if (currentRef.current !== rootValue) {
        poppedRef.current = true;
        onBackRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [rootValue]);
}
