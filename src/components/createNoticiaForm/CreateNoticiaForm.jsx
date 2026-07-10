import { useForm } from 'react-hook-form';
import { FileText, Calendar, Image } from 'lucide-react';
import PropTypes from 'prop-types';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import { getImagenUrlRules, MAX_LEN } from '../../utils/formValidators';

const STEPS = [{ id: 1, label: 'Datos', icon: FileText }];

export function CreateNoticiaForm({ onSuccess, onCancel }) {
  const { step, direction, submitted, setSubmitted, navGuard } = useMultiStepFormState();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onTouched' });

  const onSubmit = (data) => {
    setSubmitted(true);
    setTimeout(() => onSuccess({
      titulo: data.titulo.trim(),
      cuerpo: data.cuerpo.trim(),
      fecha_expiracion: data.fecha_expiracion,
      imagen: data.imagen?.trim() || null,
    }), 1800);
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      title="Nueva noticia"
      successTitle="¡Noticia creada!"
      successMessage="La noticia fue publicada correctamente."
      submitLabel="Publicar noticia"
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
        <Field label="URL de imagen (opcional)" icon={Image} error={errors.imagen?.message}>
          <StyledInput
            {...register('imagen', getImagenUrlRules())}
            placeholder="https://..."
            error={!!errors.imagen}
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
