import { useForm } from 'react-hook-form';
import { Building2, Settings, CheckCircle2, Users, DollarSign, Tag } from 'lucide-react';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import PropTypes from 'prop-types';

const STEPS = [
  { id: 1, label: 'Datos', icon: Building2 },
  { id: 2, label: 'Configuración', icon: Settings },
];

const stepFields = {
  1: ['nombre', 'tipo'],
  2: ['capacidad_maxima', 'valor_hora'],
};

export function CreateInstalacionForm({ onSuccess, onCancel }) {
  const { step, direction, submitted, setSubmitted, navGuard, advance, goBack } = useMultiStepFormState();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({ mode: 'onTouched' });

  const goNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;
    advance();
  };

  const onSubmit = (data) => {
    setSubmitted(true);
    setTimeout(() => onSuccess({
      nombre: data.nombre.trim(),
      tipo: data.tipo.trim(),
      capacidad_maxima: Number(data.capacidad_maxima),
      valor_hora: Number(data.valor_hora),
      activa: Boolean(data.activa),
    }), 1800);
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      title="Nueva instalación"
      successTitle="¡Instalación creada!"
      successMessage="Los datos fueron guardados correctamente."
      submitLabel="Crear instalación"
      onCancel={onCancel}
      goBack={goBack}
      goNext={goNext}
      direction={direction}
      onFormSubmit={handleSubmit(onSubmit)}
    >
        {step === 1 && (
          <FormStep key="step1" direction={direction}>
            <Field label="Nombre de la instalación" icon={Building2} error={errors.nombre?.message}>
              <StyledInput
                {...register('nombre', { required: 'El nombre es requerido' })}
                placeholder="Ej. Cancha de fútbol"
                error={!!errors.nombre}
              />
            </Field>
            <Field label="Tipo de instalación" icon={Tag} error={errors.tipo?.message}>
              <StyledInput
                {...register('tipo', { required: 'El tipo es requerido' })}
                placeholder="Ej. Deportiva, Social, Recreativa"
                error={!!errors.tipo}
              />
            </Field>
          </FormStep>
        )}

        {step === 2 && (
          <FormStep key="step2" direction={direction}>
            <Field label="Capacidad máxima (personas)" icon={Users} error={errors.capacidad_maxima?.message}>
              <StyledInput
                {...register('capacidad_maxima', {
                  required: 'La capacidad es requerida',
                  min: { value: 1, message: 'Debe ser mayor a 0' },
                  validate: (v) => Number(v) > 0 || 'Debe ser mayor a 0',
                })}
                type="number"
                min="1"
                placeholder="Ej. 50"
                error={!!errors.capacidad_maxima}
              />
            </Field>
            <Field label="Valor por hora ($)" icon={DollarSign} error={errors.valor_hora?.message}>
              <StyledInput
                {...register('valor_hora', {
                  required: 'El valor por hora es requerido',
                  min: { value: 0, message: 'No puede ser negativo' },
                  validate: (v) => Number(v) >= 0 || 'No puede ser negativo',
                })}
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 1500"
                error={!!errors.valor_hora}
              />
            </Field>
            <div className="csf-field">
              <span className="csf-label">
                <CheckCircle2 size={13} strokeWidth={2} />
                Estado
              </span>
              <label className="csf-checkbox-label">
                <input
                  type="checkbox"
                  className="csf-checkbox-input"
                  defaultChecked
                  {...register('activa')}
                />
                {' '}La instalación está activa y disponible para reservas
              </label>
            </div>
          </FormStep>
        )}
    </MultiStepFormShell>
  );
}

CreateInstalacionForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};