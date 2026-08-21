import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Paginacion.css';

/**
 * Controles de paginación (Anterior/Siguiente + indicador). Se auto-oculta
 * si `totalPaginas` es 1 o menos. Pensado para usarse junto con el hook `usePaginacion`.
 */
export function Paginacion({ pagina, totalPaginas, onCambiarPagina }) {
  if (totalPaginas <= 1) return null;

  return (
    <nav className="paginacion" aria-label="Paginación">
      <button
        type="button"
        className="paginacion-btn"
        onClick={() => onCambiarPagina(pagina - 1)}
        disabled={pagina === 1}
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Anterior
      </button>
      <span className="paginacion-indicador">
        Página {pagina} de {totalPaginas}
      </span>
      <button
        type="button"
        className="paginacion-btn"
        onClick={() => onCambiarPagina(pagina + 1)}
        disabled={pagina === totalPaginas}
        aria-label="Página siguiente"
      >
        Siguiente
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
