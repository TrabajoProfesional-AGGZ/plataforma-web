import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Calendar, Clock, Users, DollarSign, UploadCloud, CheckCircle2, XCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import { getImagenUrlRules, validarArchivoImagen, MAX_LEN } from '../../utils/formValidators';
import { subirImagenEvento } from '../../services/eventosService';

const STEPS = [{ id: 1, label: 'Datos', icon: FileText }];

const TEXTO_ESTADO_IMAGEN = {
  vacio: { titulo: 'Subir archivo desde la computadora', hint: 'JPG, PNG o WEBP, hasta 5MB (opcional)' },
  lista: { titulo: 'Cambiar imagen', hint: 'Se subirá al crear el evento' },
  subiendo: { titulo: 'Subiendo imagen...', hint: 'Subiendo...' },
  exito: { titulo: 'Cambiar imagen', hint: 'Imagen cargada correctamente' },
  error: { titulo: 'Reintentar', hint: 'No se pudo cargar la imagen' },
};

export function CreateEventoForm({ onSuccess, onCancel }) {
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
    let fotoUrl = null;

    if (archivoDataUrl) {
      setEstadoImagen('subiendo');
      setErrorImagen('');
      try {
        const { url } = await subirImagenEvento(archivoDataUrl, data.nombre.trim());
        fotoUrl = url;
        setValue('foto_url', url, { shouldValidate: true });
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
      nombre: data.nombre.trim(),
      descripcion: data.descripcion.trim(),
      dia: data.dia,
      hora_inicio: `${data.hora_inicio}:00`,
      hora_fin: `${data.hora_fin}:00`,
      capacidad_maxima: Number(data.capacidad_maxima),
      valor_entrada: Number(data.valor_entrada),
      foto_url: fotoUrl,
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
        <Field label="Foto (opcional)" icon={UploadCloud} error={errorImagen || errors.foto_url?.message}>
          <input type="hidden" {...register('foto_url', getImagenUrlRules())} />
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
      </FormStep>
    </MultiStepFormShell>
  );
}

CreateEventoForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
