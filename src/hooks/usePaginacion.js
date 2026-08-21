import { useEffect, useState } from 'react';

/**
 * Pagina una lista client-side. Si la lista se achica y la página actual
 * queda fuera de rango (ej. tras aplicar un filtro), se ajusta automáticamente.
 * @param {Array} lista - Lista completa a paginar.
 * @param {number} [porPagina=10] - Cantidad de items por página.
 * @returns {{
 *   pagina: number, totalPaginas: number, listaPaginada: Array,
 *   irAPagina: (n: number) => void, resetPagina: () => void
 * }}
 */
export function usePaginacion(lista, porPagina = 10) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [pagina, totalPaginas]);

  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const listaPaginada = lista.slice(inicio, inicio + porPagina);

  function irAPagina(n) {
    setPagina(Math.min(Math.max(n, 1), totalPaginas));
  }

  function resetPagina() {
    setPagina(1);
  }

  return { pagina: paginaActual, totalPaginas, listaPaginada, irAPagina, resetPagina };
}
