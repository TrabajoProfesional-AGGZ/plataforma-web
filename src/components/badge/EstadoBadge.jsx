import { estadoConfig } from '../../utils/estadoConfig';
import './EstadoBadge.css';

const VARIANTS = new Set(['success', 'danger', 'warning', 'suspended', 'neutral']);

/**
 * Badge visual de estado (color según variante). Si no se pasa `variant`
 * explícita, se infiere a partir de `estado` vía `estadoConfig` (acepta
 * tanto un string como un objeto con `nombre`, ej. un catálogo del backend).
 * El texto mostrado es `children` si se provee, o si no el propio `estado`.
 */
function EstadoBadge({ estado, variant, children, className = '' }) {
  const resuelto = variant ?? estadoConfig(estado).variant ?? 'neutral';
  const variantClass = VARIANTS.has(resuelto) ? resuelto : 'neutral';
  const label = children ?? (typeof estado === 'object' ? estado?.nombre : estado) ?? '—';
  const badgeClassName = ['badge', `badge--${variantClass}`, className].filter(Boolean).join(' ');

  return (
    <span className={badgeClassName}>
      {label}
    </span>
  );
}

export default EstadoBadge;
