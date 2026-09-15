import { useEffect } from 'react';

/** Setea document.title a partir del título de sección activo. */
export function useDocumentTitle(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · SocioUnido` : 'SocioUnido Admin';
  }, [titulo]);
}
