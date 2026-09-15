import { ChevronLeft } from 'lucide-react';
import './BackButton.css';

/** Botón "volver" único de vistas de detalle. Siempre primer hijo del contenedor de la vista. */
export function BackButton({ onClick, label = 'Volver', compacto = false }) {
  return (
    <button
      type="button"
      className={`back-button${compacto ? ' back-button--compacto' : ''}`}
      onClick={onClick}
    >
      <ChevronLeft size={16} aria-hidden="true" />
      {label}
    </button>
  );
}

export default BackButton;
