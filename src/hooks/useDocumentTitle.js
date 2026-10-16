import { useEffect } from 'react';

/** Fija document.title con el nombre del club (demo); `titulo` se ignora. */
export function useDocumentTitle(titulo) {
  useEffect(() => {
    document.title = 'Inter Miami CF - Admin';
  }, [titulo]);
}
