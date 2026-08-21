import PropTypes from 'prop-types';
import { Ban } from 'lucide-react';

/**
 * Grilla de turnos disponibles para elegir hora_inicio, en reemplazo de un
 * `<select>` nativo: cada turno es un botón con la hora y el cupo restante,
 * deshabilitado cuando `cupos_disponibles === 0` y con un aviso visual
 * cuando el cupo restante es bajo. El registro del campo en react-hook-form
 * (validación `required`) vive en un `<input type="hidden">` aparte, en
 * `CreateReservaForm` — este componente solo dispara `onSelect`.
 */
export function TurnoSelector({
  turnos, capacidadMaxima, selected, onSelect, loading, id, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedby,
}) {
  if (loading) {
    return (
      <div>
        <p className="turno-loading-label" role="status">Cargando turnos...</p>
        <div className="turno-grid" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="turno-chip turno-chip--skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (turnos.length === 0) return null;

  const cupoBajo = (cupos) => {
    const tope = capacidadMaxima && capacidadMaxima > 0 ? capacidadMaxima : cupos || 1;
    return cupos > 0 && cupos / tope <= 0.34;
  };

  return (
    <div
      id={id}
      className="turno-grid"
      role="radiogroup"
      aria-label="Turno"
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedby}
    >
      {turnos.map((turno) => {
        const sinCupo = turno.cupos_disponibles === 0;
        const bajo = cupoBajo(turno.cupos_disponibles);
        const isSelected = selected === turno.hora_inicio;
        const horaLabel = turno.hora_inicio.slice(0, 5);
        const cupoLabel = sinCupo ? 'sin cupo' : `${turno.cupos_disponibles}/${capacidadMaxima ?? '?'} lugares`;
        return (
          <button
            key={turno.hora_inicio}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${horaLabel} (${cupoLabel})`}
            disabled={sinCupo}
            onClick={() => onSelect(turno.hora_inicio)}
            className={[
              'turno-chip',
              isSelected && 'turno-chip--selected',
              sinCupo && 'turno-chip--disabled',
              bajo && 'turno-chip--bajo',
            ].filter(Boolean).join(' ')}
          >
            <span className="turno-chip-hora">{horaLabel}</span>
            <span className="turno-chip-cupo">
              {sinCupo ? <><Ban size={11} strokeWidth={2.5} /> Sin cupo</> : cupoLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

TurnoSelector.propTypes = {
  turnos: PropTypes.arrayOf(PropTypes.shape({
    hora_inicio: PropTypes.string.isRequired,
    cupos_disponibles: PropTypes.number.isRequired,
  })).isRequired,
  capacidadMaxima: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  selected: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  id: PropTypes.string,
  'aria-invalid': PropTypes.string,
  'aria-describedby': PropTypes.string,
};
