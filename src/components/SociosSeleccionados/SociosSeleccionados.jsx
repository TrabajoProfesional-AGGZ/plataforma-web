import PropTypes from 'prop-types';
import { X, AlertCircle } from 'lucide-react';

export function SociosSeleccionados({ 
  buscando, 
  logo, 
  sociosAgregados, 
  removerSocio, 
  errorListaSocios 
}) {
  return (
    <>
      {buscando && (
        <div className="csf-socio-buscando">
          <img src={logo} alt="" className="csf-socio-logo-spin" />
          <span>Buscando socio...</span>
        </div>
      )}

      {sociosAgregados.length > 0 && (
        <div className="csf-socios-lista">
          {sociosAgregados.map((socio) => (
            <div key={socio.id} className="csf-socio-chip">
              <span>{socio.nro_socio} — {socio.apellido} {socio.nombre}</span>
              <button
                type="button"
                className="csf-socio-chip-remove"
                onClick={() => removerSocio(socio.id)}
                aria-label={`Quitar socio ${socio.nro_socio}`}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {errorListaSocios && (
        <p className="csf-error">
          <AlertCircle size={12} />
          {errorListaSocios}
        </p>
      )}
    </>
  );
}

SociosSeleccionados.propTypes = {
  buscando: PropTypes.bool.isRequired,
  logo: PropTypes.string.isRequired,
  sociosAgregados: PropTypes.array.isRequired,
  removerSocio: PropTypes.func.isRequired,
  errorListaSocios: PropTypes.string,
};