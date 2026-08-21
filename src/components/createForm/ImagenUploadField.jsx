import { UploadCloud, CheckCircle2, XCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { Field } from './FormFields';
import { getImagenUrlRules } from '../../utils/formValidators';

/**
 * Caja de subida de imagen con estados visuales (`vacio`/`lista`/`subiendo`/`exito`/`error`,
 * definidos en `estadoImagen` y `textoEstado`). Pensada para usarse junto con el hook
 * `useImagenUpload`, que provee `fileInputRef`/`estadoImagen`/`imagenPreview`/`onFileChange`.
 * El input de texto oculto valida la URL final con `getImagenUrlRules()` como defensa en profundidad.
 */
export function ImagenUploadField({
  label,
  fieldName,
  register,
  error,
  fileInputRef,
  estadoImagen,
  imagenPreview,
  onFileChange,
  textoEstado,
}) {
  return (
    <Field label={label} icon={UploadCloud} error={error}>
      <input type="hidden" {...register(fieldName, getImagenUrlRules())} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileChange}
        style={{ display: 'none' }}
        aria-label="Subir archivo desde la computadora"
      />
      <button
        type="button"
        className={`csf-upload-box csf-upload-box--${estadoImagen}`}
        onClick={() => fileInputRef.current?.click()}
        disabled={estadoImagen === 'subiendo'}
      >
        {estadoImagen === 'exito' && (
          <CheckCircle2 size={20} className="csf-upload-status-icon csf-upload-status-icon--exito" />
        )}
        {estadoImagen === 'error' && (
          <XCircle size={20} className="csf-upload-status-icon csf-upload-status-icon--error" />
        )}
        {imagenPreview ? (
          <img src={imagenPreview} alt="Previsualización" className="csf-upload-preview" />
        ) : (
          <UploadCloud size={32} strokeWidth={1.6} className="csf-upload-icon" />
        )}
        <div className="csf-upload-texto">
          <span>{textoEstado[estadoImagen].titulo}</span>
          <span className="csf-upload-hint">{textoEstado[estadoImagen].hint}</span>
        </div>
        {estadoImagen === 'subiendo' && <span className="csf-spinner csf-spinner--dark" />}
      </button>
    </Field>
  );
}

ImagenUploadField.propTypes = {
  label: PropTypes.string.isRequired,
  fieldName: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
  error: PropTypes.string,
  fileInputRef: PropTypes.object.isRequired,
  estadoImagen: PropTypes.string.isRequired,
  imagenPreview: PropTypes.string,
  onFileChange: PropTypes.func.isRequired,
  textoEstado: PropTypes.objectOf(
    PropTypes.shape({ titulo: PropTypes.string.isRequired, hint: PropTypes.string.isRequired })
  ).isRequired,
};
