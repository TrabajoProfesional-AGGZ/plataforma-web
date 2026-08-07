import { CheckCircle2, Hash } from 'lucide-react';
import PropTypes from 'prop-types';
import { Field, StyledInput } from './FormFields';

export function SocioBuscadorField({
  nroSocioInput,
  busquedaSocio,
  errorSocio,
  socioSeleccionado,
  onChange,
  onBlurPreview,
  onBuscar,
}) {
  return (
    <Field label="N° de socio" icon={Hash} error={errorSocio}>
      <div className="csf-socio-input-row">
        <StyledInput
          type="text"
          placeholder="Ej. 1234"
          value={nroSocioInput}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onBlurPreview(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); onBuscar(); }
          }}
        />
        <button
          type="button"
          className="csf-btn-agregar-socio"
          onClick={onBuscar}
          disabled={busquedaSocio || !nroSocioInput.trim()}
        >
          Buscar
        </button>
      </div>
      {socioSeleccionado && (
        <span className="csf-socio-nombre-inline">
          <CheckCircle2 size={13} color="var(--status-success-border)" />
          {socioSeleccionado.apellido} {socioSeleccionado.nombre}
        </span>
      )}
    </Field>
  );
}

SocioBuscadorField.propTypes = {
  nroSocioInput: PropTypes.string.isRequired,
  busquedaSocio: PropTypes.bool.isRequired,
  errorSocio: PropTypes.string,
  socioSeleccionado: PropTypes.shape({
    nombre: PropTypes.string,
    apellido: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
  onBlurPreview: PropTypes.func.isRequired,
  onBuscar: PropTypes.func.isRequired,
};
