import './FiltrosActivos.css';

/**
 * Resumen "N filtros activos · Limpiar" que va debajo del toolbar de un listado.
 * No renderiza nada si `cantidad` es 0.
 */
export function FiltrosActivos({ cantidad, onLimpiar }) {
  if (!cantidad) return null;
  const texto = cantidad === 1 ? '1 filtro activo' : `${cantidad} filtros activos`;
  return (
    <p className="filtros-activos">
      <span>{texto}</span>
      <span aria-hidden="true">·</span>
      <button type="button" className="link-btn" onClick={onLimpiar}>
        Limpiar
      </button>
    </p>
  );
}

export default FiltrosActivos;
