import { useForm } from 'react-hook-form';
import { AnimatePresence } from 'framer-motion';
import { Activity, Users, DollarSign, Tag } from 'lucide-react';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const STEPS = [
  { id: 1, label: 'Datos', icon: Tag },
  { id: 2, label: 'Configuración', icon: Users },
];

export function CreateDisciplinaForm({ onSuccess, onCancel }) {
  const { step, direction, submitted, setSubmitted, navGuard, advance, goBack } = useMultiStepFormState();

  const {
    register, handleSubmit, trigger, watch, getValues, formState: { errors },
  } = useForm({ mode: 'onTouched' });

  const arancelada = watch('arancelada');

  useEscapeKey(onCancel);

  const goNext = async () => {
    const fieldsToValidate = step === 1
      ? ['nombre']
      : ['cupo_maximo', ...(getValues('arancelada') ? ['concepto_cobro'] : [])];
    const valid = await trigger(fieldsToValidate);
    if (!valid) return;
    advance();
  };

  const onSubmit = (data) => {
    setSubmitted(true);
    setTimeout(() => onSuccess({
      nombre: data.nombre.trim(),
      cupo_maximo: Number(data.cupo_maximo),
      arancelada: Boolean(data.arancelada),
      concepto_cobro: data.arancelada ? (data.concepto_cobro?.trim() ?? '') : '',
    }), 1800);
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      title="Nueva disciplina"
      successTitle="¡Disciplina creada!"
      successMessage="Los datos fueron guardados correctamente."
      submitLabel="Crear disciplina"
      onCancel={onCancel}
      goBack={goBack}
      goNext={goNext}
      onFormSubmit={handleSubmit(onSubmit)}
    >
      <AnimatePresence mode="wait" custom={direction}>
        {step === 1 && (
          <FormStep key="step1" direction={direction}>
            <Field label="Nombre de la disciplina" icon={Activity} error={errors.nombre?.message}>
              <StyledInput
                {...register('nombre', { required: 'El nombre es requerido' })}
                placeholder="Ej. Natación, Fútbol, Tenis"
                error={!!errors.nombre}
              />
            </Field>
          </FormStep>
        )}

        {step === 2 && (
          <FormStep key="step2" direction={direction}>
            <Field label="Cupo máximo (personas)" icon={Users} error={errors.cupo_maximo?.message}>
              <StyledInput
                {...register('cupo_maximo', {
                  required: 'El cupo máximo es requerido',
                  min: { value: 1, message: 'Debe ser mayor a 0' },
                  validate: (v) => Number(v) > 0 || 'Debe ser mayor a 0',
                })}
                type="number"
                min="1"
                placeholder="Ej. 30"
                error={!!errors.cupo_maximo}
              />
            </Field>
            <div className="csf-field">
              <span className="csf-label">
                <DollarSign size={13} strokeWidth={2} />
                Arancelada
              </span>
              <label className="csf-checkbox-label">
                <input
                  type="checkbox"
                  className="csf-checkbox-input"
                  {...register('arancelada')}
                />
                La disciplina tiene un arancel asociado
              </label>
            </div>
            {arancelada && (
              <Field label="Concepto de cobro" icon={DollarSign} error={errors.concepto_cobro?.message}>
                <StyledInput
                  {...register('concepto_cobro', {
                    validate: (v) => {
                      if (getValues('arancelada') && !v?.trim()) {
                        return 'El concepto de cobro es requerido para disciplinas aranceladas';
                      }
                      return true;
                    },
                  })}
                  placeholder="Ej. Cuota mensual de natación"
                  error={!!errors.concepto_cobro}
                />
              </Field>
            )}
          </FormStep>
        )}
      </AnimatePresence>
    </MultiStepFormShell>
  );
}
