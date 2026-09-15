import { useEffect, useState } from 'react';

/**
 * Devuelve `value` con un retraso de `delayMs`: mientras el valor siga
 * cambiando (p. ej. el usuario tipea), el resultado no se actualiza hasta que
 * pase `delayMs` sin cambios. Usado por la búsqueda en vivo de Socios/Usuarios (F6).
 * @template T
 * @param {T} value
 * @param {number} [delayMs=150]
 * @returns {T}
 */
export function useDebouncedValue(value, delayMs = 150) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
