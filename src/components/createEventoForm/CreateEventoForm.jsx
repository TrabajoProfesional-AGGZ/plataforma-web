import { useForm } from 'react-hook-form';
import { FileText, Calendar, Clock, Users, DollarSign } from 'lucide-react';
import PropTypes from 'prop-types';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, FormStep } from '../createForm/FormFields';
import { ImagenUploadField } from '../createForm/ImagenUploadField';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import { useImagenUpload } from '../../hooks/useImagenUpload';
import { MAX_LEN } from '../../utils/formValidators';
import { subirImagenEvento } from '../../services/eventosService';

const STEPS = [{ id: 1, label: 'Datos', icon: FileText }];

const TEXTO_ESTADO_IMAGEN = {
  vacio: { titulo: 'Subir archivo desde la computadora', hint: 'JPG, PNG o WEBP, hasta 5MB (opcional)' },
  lista: { titulo: 'Cambiar imagen', hint: 'Se subirá al crear el evento' },
  subiendo: { titulo: 'Subiendo imagen...', hint: 'Subiendo...' },
  exito: { titulo: 'Cambiar imagen', hint: 'Imagen cargada correctamente' },
  error: { titulo: 'Reintentar', hint: 'No se pudo cargar la imagen' },
};

/**
 * Formulario de un paso para crear un evento. La imagen (opcional) se elige
 * antes pero se sube a Cloudinary recién al confirmar el envío (`useImagenUpload`),
 * antes de invocar `onSuccess` — si la subida falla, el envío se aborta.
 * @param {{ onSuccess: (payload: object) => void, onCancel: () => void }} props
 */
export function CreateEventoForm({ onSuccess, onCancel }) {
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
    let fotoUrl;
    try {
      fotoUrl = await subirSiCorresponde((dataUrl) => subirImagenEvento(dataUrl, data.nombre.trim()));
    } catch {
      return;
    }
    if (fotoUrl) setValue('foto_url', fotoUrl, { shouldValidate: true });

    setSubmitted(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    onSuccess({
      nombre: data.nombre.trim(),
      descripcion: data.descripcion.trim(),
      dia: data.dia,
      hora_inicio: `${data.hora_inicio}:00`,
      hora_fin: `${data.hora_fin}:00`,
      capacidad_maxima: Number(data.capacidad_maxima),
      valor_entrada: Number(data.valor_entrada),
      foto_url: fotoUrl ?? null,
    });
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      isSubmitting={isSubmitting}
      title="Nuevo evento"
      successTitle="¡Evento creado!"
      successMessage="El evento fue publicado correctamente."
      submitLabel="Crear evento"
      submitLoadingLabel="Creando..."
      onCancel={onCancel}
      goBack={() => {}}
      goNext={() => {}}
      direction={direction}
      onFormSubmit={handleSubmit(onSubmit)}
    >
      <FormStep key="step1" direction={direction}>
        <Field label="Nombre" icon={FileText} error={errors.nombre?.message}>
          <StyledInput
            {...register('nombre', {
              required: 'El nombre es requerido',
              maxLength: { value: MAX_LEN.NOMBRE_EVENTO, message: `Máximo ${MAX_LEN.NOMBRE_EVENTO} caracteres` },
            })}
            placeholder="Ej. Fiesta de fin de año"
            error={!!errors.nombre}
          />
        </Field>
        <Field label="Descripción" icon={FileText} error={errors.descripcion?.message}>
          <textarea
            {...register('descripcion', {
              required: 'La descripción es requerida',
              maxLength: { value: MAX_LEN.DESCRIPCION_EVENTO, message: `Máximo ${MAX_LEN.DESCRIPCION_EVENTO} caracteres` },
            })}
            placeholder="Contale a los socios de qué se trata el evento..."
            rows={4}
            className={`csf-input${errors.descripcion ? ' csf-input--error' : ''}`}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
          />
        </Field>
        <Field label="Día" icon={Calendar} error={errors.dia?.message}>
          <StyledInput
            {...register('dia', { required: 'El día es requerido' })}
            type="date"
            error={!!errors.dia}
          />
        </Field>
        <Field label="Hora de inicio" icon={Clock} error={errors.hora_inicio?.message}>
          <StyledInput
            {...register('hora_inicio', { required: 'La hora de inicio es requerida' })}
            type="time"
            error={!!errors.hora_inicio}
          />
        </Field>
        <Field label="Hora de fin" icon={Clock} error={errors.hora_fin?.message}>
          <StyledInput
            {...register('hora_fin', { required: 'La hora de fin es requerida' })}
            type="time"
            error={!!errors.hora_fin}
          />
        </Field>
        <Field label="Capacidad máxima (entradas)" icon={Users} error={errors.capacidad_maxima?.message}>
          <StyledInput
            {...register('capacidad_maxima', {
              required: 'La capacidad es requerida',
              validate: (v) => Number(v) > 0 || 'Debe ser mayor a 0',
            })}
            type="number"
            min="1"
            placeholder="Ej. 100"
            error={!!errors.capacidad_maxima}
          />
        </Field>
        <Field label="Valor de la entrada ($)" icon={DollarSign} error={errors.valor_entrada?.message}>
          <StyledInput
            {...register('valor_entrada', {
              required: 'El valor de la entrada es requerido',
              validate: (v) => Number(v) >= 0 || 'No puede ser negativo',
            })}
            type="number"
            min="0"
            step="0.01"
            placeholder="Ej. 5000"
            error={!!errors.valor_entrada}
          />
        </Field>
        <ImagenUploadField
          label="Foto (opcional)"
          fieldName="foto_url"
          register={register}
          error={errorImagen || errors.foto_url?.message}
          fileInputRef={fileInputRef}
          estadoImagen={estadoImagen}
          imagenPreview={imagenPreview}
          onFileChange={handleArchivoSeleccionado}
          textoEstado={TEXTO_ESTADO_IMAGEN}
        />
      </FormStep>
    </MultiStepFormShell>
  );
}

CreateEventoForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
