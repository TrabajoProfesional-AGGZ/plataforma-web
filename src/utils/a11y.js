/**
 * Crea un handler de `onKeyDown` que ejecuta `handler` al presionar Enter o Espacio.
 * Permite activar por teclado elementos con `role="button"` que no son un `<button>` nativo.
 */
export function handleActivateKey(handler) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler();
    }
  };
}
