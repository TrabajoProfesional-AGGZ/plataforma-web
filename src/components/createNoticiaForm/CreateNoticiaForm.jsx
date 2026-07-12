import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Calendar, UploadCloud, CheckCircle2, XCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import { getImagenUrlRules, validarArchivoImagen, MAX_LEN } from '../../utils/formValidators';
import { subirImagenNoticia } from '../../services/noticiasService';

const STEPS = [{ id: 1, label: 'Datos', icon: FileText }];

const TEXTO_ESTADO_IMAGEN = {
  vacio: { titulo: 'Subir archivo desde la computadora', hint: 'JPG, PNG o WEBP, hasta 5MB' },
  lista: { titulo: 'Cambiar imagen', hint: 'Se subirá al publicar la noticia' },
  subiendo: { titulo: 'Subiendo imagen...', hint: 'Subiendo...' },
  exito: { titulo: 'Cambiar imagen', hint: 'Imagen cargada correctamente' },
  error: { titulo: 'Reintentar', hint: 'No se pudo cargar la imagen' },
};

export function CreateNoticiaForm({ onSuccess, onCancel }) {
  const { step, direction, submitted, setSubmitted, navGuard } = useMultiStepFormState();
  const fileInputRef = useRef(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [archivoDataUrl, setArchivoDataUrl] = useState(null);
  const [estadoImagen, setEstadoImagen] = useState('vacio');
  const [errorImagen, setErrorImagen] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

  const onSubmit = async (data) => {
    let imagenUrl = null;

    if (archivoDataUrl) {
      setEstadoImagen('subiendo');
      setErrorImagen('');
      try {
        const tituloFoto = data.tituloFoto?.trim() || data.titulo.trim();
        const { url } = await subirImagenNoticia(archivoDataUrl, tituloFoto);
        imagenUrl = url;
        setValue('imagen', url, { shouldValidate: true });
        setEstadoImagen('exito');
      } catch {
        setErrorImagen('No se pudo subir la imagen. Intentá de nuevo.');
        setEstadoImagen('error');
        return;
      }
    }

    setSubmitted(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    onSuccess({
      titulo: data.titulo.trim(),
      cuerpo: data.cuerpo.trim(),
      fecha_expiracion: data.fecha_expiracion,
      imagen: imagenUrl,
    });
  };

  const handleArchivoSeleccionado = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const errorValidacion = validarArchivoImagen(file);
    if (errorValidacion) {
      setErrorImagen(errorValidacion);
      setEstadoImagen('error');
      setArchivoDataUrl(null);
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      setImagenPreview(lector.result);
      setArchivoDataUrl(lector.result);
      setEstadoImagen('lista');
      setErrorImagen('');
    };
    lector.readAsDataURL(file);
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      isSubmitting={isSubmitting}
      title="Nueva noticia"
      successTitle="¡Noticia creada!"
      successMessage="La noticia fue publicada correctamente."
      submitLabel="Publicar noticia"
      submitLoadingLabel="Creando..."
      onCancel={onCancel}
      goBack={() => {}}
      goNext={() => {}}
      direction={direction}
      onFormSubmit={handleSubmit(onSubmit)}
    >
      <FormStep key="step1" direction={direction}>
        <Field label="Título" icon={FileText} error={errors.titulo?.message}>
          <StyledInput
            {...register('titulo', {
              required: 'El título es requerido',
              maxLength: { value: MAX_LEN.TITULO_NOTICIA, message: `Máximo ${MAX_LEN.TITULO_NOTICIA} caracteres` },
            })}
            placeholder="Ej. Inauguración de nuevas instalaciones"
            error={!!errors.titulo}
          />
        </Field>
        <Field label="Cuerpo" icon={FileText} error={errors.cuerpo?.message}>
          <textarea
            {...register('cuerpo', {
              required: 'El cuerpo es requerido',
              maxLength: { value: MAX_LEN.CUERPO_NOTICIA, message: `Máximo ${MAX_LEN.CUERPO_NOTICIA} caracteres` },
            })}
            placeholder="Redactá el contenido de la noticia..."
            rows={5}
            className={`csf-input${errors.cuerpo ? ' csf-input--error' : ''}`}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
          />
        </Field>
        <Field label="Imagen (opcional)" icon={UploadCloud} error={errorImagen || errors.imagen?.message}>
          <input type="hidden" {...register('imagen', getImagenUrlRules())} />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleArchivoSeleccionado}
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
              <span>{TEXTO_ESTADO_IMAGEN[estadoImagen].titulo}</span>
              <span className="csf-upload-hint">{TEXTO_ESTADO_IMAGEN[estadoImagen].hint}</span>
            </div>
            {estadoImagen === 'subiendo' && <span className="csf-spinner csf-spinner--dark" />}
          </button>
        </Field>
        <Field label="Título de la foto (opcional)" icon={FileText}>
          <StyledInput
            {...register('tituloFoto', {
              maxLength: { value: MAX_LEN.TITULO_IMAGEN, message: `Máximo ${MAX_LEN.TITULO_IMAGEN} caracteres` },
            })}
            placeholder="Si lo dejás vacío, se usa el título de la noticia"
          />
        </Field>
        <Field label="Fecha de vencimiento" icon={Calendar} error={errors.fecha_expiracion?.message}>
          <StyledInput
            {...register('fecha_expiracion', { required: 'La fecha de vencimiento es requerida' })}
            type="date"
            error={!!errors.fecha_expiracion}
          />
        </Field>
      </FormStep>
    </MultiStepFormShell>
  );
}

CreateNoticiaForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
