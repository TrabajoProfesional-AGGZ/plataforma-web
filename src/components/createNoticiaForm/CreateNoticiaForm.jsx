import { useForm } from 'react-hook-form';
import { FileText, Calendar } from 'lucide-react';
import PropTypes from 'prop-types';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, FormStep } from '../createForm/FormFields';
import { ImagenUploadField } from '../createForm/ImagenUploadField';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import { useImagenUpload } from '../../hooks/useImagenUpload';
import { MAX_LEN } from '../../utils/formValidators';
import { subirImagenNoticia } from '../../services/noticiasService';

const STEPS = [{ id: 1, label: 'Datos', icon: FileText }];

const TEXTO_ESTADO_IMAGEN = {
  vacio: { titulo: 'Subir archivo desde la computadora', hint: 'JPG, PNG o WEBP, hasta 5MB' },
  lista: { titulo: 'Cambiar imagen', hint: 'Se subirá al publicar la noticia' },
  subiendo: { titulo: 'Subiendo imagen...', hint: 'Subiendo...' },
  exito: { titulo: 'Cambiar imagen', hint: 'Imagen cargada correctamente' },
  error: { titulo: 'Reintentar', hint: 'No se pudo cargar la imagen' },
};

/**
 * Formulario de un paso para crear una noticia. La imagen (opcional) se elige
 * antes pero se sube a Cloudinary recién al confirmar el envío (`useImagenUpload`),
 * usando "Título de la foto" o, si se deja vacío, el título de la noticia como
 * `caption` — si la subida falla, el envío se aborta.
 * @param {{ onSuccess: (payload: object) => void, onCancel: () => void }} props
 */
export function CreateNoticiaForm({ onSuccess, onCancel }) {
  const { step, direction, submitted, setSubmitted, navGuard } = useMultiStepFormState();
  const {
    fileInputRef,
    imagenPreview,
    estadoImagen,
    errorImagen,
    handleArchivoSeleccionado,
    subirSiCorresponde,
  } = useImagenUpload();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

  const onSubmit = async (data) => {
    const tituloFoto = data.tituloFoto?.trim() || data.titulo.trim();
    let imagenUrl;
    try {
      imagenUrl = await subirSiCorresponde((dataUrl) => subirImagenNoticia(dataUrl, tituloFoto));
    } catch {
      return;
    }
    if (imagenUrl) setValue('imagen', imagenUrl, { shouldValidate: true });

    setSubmitted(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    onSuccess({
      titulo: data.titulo.trim(),
      cuerpo: data.cuerpo.trim(),
      fecha_expiracion: data.fecha_expiracion,
      imagen: imagenUrl ?? null,
    });
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
        <ImagenUploadField
          label="Imagen (opcional)"
          fieldName="imagen"
          register={register}
          error={errorImagen || errors.imagen?.message}
          fileInputRef={fileInputRef}
          estadoImagen={estadoImagen}
          imagenPreview={imagenPreview}
          onFileChange={handleArchivoSeleccionado}
          textoEstado={TEXTO_ESTADO_IMAGEN}
        />
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
