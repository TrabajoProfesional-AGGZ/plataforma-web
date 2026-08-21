import { useState } from 'react';

/**
 * Estado genérico para una pantalla de listado: resultado, carga y error.
 * @returns {{
 *   resultado: *, setResultado: (v: *) => void,
 *   loading: boolean, setLoading: (v: boolean) => void,
 *   error: *, setError: (v: *) => void
 * }}
 */
export function useListState() {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  return { resultado, setResultado, loading, setLoading, error, setError };
}
