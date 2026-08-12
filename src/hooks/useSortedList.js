import { useState } from 'react';

const ICONOS_ORDEN = { asc: ' ↑', desc: ' ↓', none: ' ↕' };

export function useSortedList(getValorOrden, ordenInicial = { campo: null, dir: 'asc' }) {
  const [orden, setOrden] = useState(ordenInicial);

  function toggleOrden(campo) {
    setOrden((prev) => {
      if (prev.campo !== campo) return { campo, dir: 'asc' };
      if (prev.dir === 'asc') return { campo, dir: 'desc' };
      return { campo: null, dir: 'asc' };
    });
  }

  function iconoOrden(campo) {
    if (orden.campo !== campo) return ICONOS_ORDEN.none;
    return ICONOS_ORDEN[orden.dir];
  }

  function aplicarOrden(lista) {
    if (!orden.campo) return lista;
    return [...lista].sort((a, b) => {
      const va = getValorOrden(a, orden.campo);
      const vb = getValorOrden(b, orden.campo);
      if (va < vb) return orden.dir === 'asc' ? -1 : 1;
      if (va > vb) return orden.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return { orden, setOrden, toggleOrden, iconoOrden, aplicarOrden };
}
