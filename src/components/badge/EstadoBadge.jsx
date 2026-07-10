import { estadoConfig } from '../../utils/estadoConfig';
import './EstadoBadge.css';

const VARIANTS = new Set(['success', 'danger', 'warning', 'suspended', 'neutral']);

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
