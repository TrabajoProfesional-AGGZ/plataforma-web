import { estadoConfig } from '../../utils/estadoConfig';
import './EstadoBadge.css';

const VARIANTS = ['success', 'danger', 'warning', 'suspended', 'neutral'];

function EstadoBadge({ estado, variant, children, className = '' }) {
  const resuelto = variant ?? estadoConfig(estado).variant ?? 'neutral';
  const variantClass = VARIANTS.includes(resuelto) ? resuelto : 'neutral';
  const label = children ?? (typeof estado === 'object' ? estado?.nombre : estado) ?? '—';

  return (
    <span className={`badge badge--${variantClass}${className ? ` ${className}` : ''}`}>
      {label}
    </span>
  );
}

export default EstadoBadge;
