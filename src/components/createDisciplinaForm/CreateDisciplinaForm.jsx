import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Activity, Users, DollarSign, Tag, MapPin } from 'lucide-react';
import PropTypes from 'prop-types';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, StyledSelect, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import { fetchCategoriasSocio, fetchSedes } from '../../services/catalogosService';

const STEPS = [
  { id: 1, label: 'Datos', icon: Tag },
  { id: 2, label: 'Configuración', icon: Users },
];

/**
 * Formulario de dos pasos (Datos / Configuración) para crear una disciplina.
 * "Sin límite de cupo" deshabilita y exime de validación a `cupo_maximo`,
 * enviando `null` en su lugar; "Arancelada" habilita y exige los campos
 * de concepto de cobro y arancel mensual, enviados como `''`/`null` si no aplica.
 * @param {{ onSuccess: (payload: object) => void, onCancel: () => void }} props
 */
export function CreateDisciplinaForm({ onSuccess, onCancel }) {
  const { step, direction, submitted, setSubmitted, navGuard, advance, goBack } = useMultiStepFormState();

  const {
    register, handleSubmit, trigger, watch, getValues, formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

  const arancelada = watch('arancelada');
  const sinLimiteCupo = watch('sin_limite_cupo');

  const [categorias, setCategorias] = useState([]);
  const [sedes, setSedes] = useState([]);

  useEffect(() => {
    fetchCategoriasSocio().then(setCategorias).catch(() => setCategorias([]));
    fetchSedes().then(setSedes).catch(() => setSedes([]));
  }, []);

  const goNext = async () => {
    const fieldsToValidate = step === 1
      ? ['nombre']
      : ['cupo_maximo', 'categoria_socio', 'sede', ...(getValues('arancelada') ? ['concepto_cobro', 'monto_mensual'] : [])];
    const valid = await trigger(fieldsToValidate);
    if (!valid) return;
    advance();
  };

  const onSubmit = async (data) => {
    setSubmitted(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    onSuccess({
      nombre: data.nombre.trim(),
      cupo_maximo: data.sin_limite_cupo ? null : Number(data.cupo_maximo),
      arancelada: Boolean(data.arancelada),
      concepto_cobro: data.arancelada ? (data.concepto_cobro?.trim() ?? '') : '',
      monto_mensual: data.arancelada ? Number(data.monto_mensual) : null,
      categoria_socio: data.categoria_socio,
      sede: data.sede,
    });
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      isSubmitting={isSubmitting}
      title="Nueva disciplina"
      successTitle="¡Disciplina creada!"
      successMessage="Los datos fueron guardados correctamente."
      submitLabel="Crear disciplina"
      submitLoadingLabel="Creando..."
      onCancel={onCancel}
      goBack={goBack}
      goNext={goNext}
      direction={direction}
      onFormSubmit={handleSubmit(onSubmit)}
    >
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
            <Field label="Categoría de socio" icon={Tag} error={errors.categoria_socio?.message}>
              <StyledSelect
                {...register('categoria_socio', { required: 'La categoría de socio es requerida' })}
                error={!!errors.categoria_socio}
                defaultValue=""
              >
                <option value="" disabled>Seleccionar...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                ))}
              </StyledSelect>
            </Field>
            <Field label="Sede" icon={MapPin} error={errors.sede?.message}>
              <StyledSelect
                {...register('sede', { required: 'La sede es requerida' })}
                error={!!errors.sede}
                defaultValue=""
              >
                <option value="" disabled>Seleccionar...</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.nombre}>{s.nombre}</option>
                ))}
              </StyledSelect>
            </Field>
            <Field label="Cupo máximo (personas)" icon={Users} error={errors.cupo_maximo?.message}>
              <StyledInput
                {...register('cupo_maximo', {
                  validate: (v) => {
                    if (getValues('sin_limite_cupo')) return true;
                    if (!v) return 'El cupo máximo es requerido';
                    return Number(v) > 0 || 'Debe ser mayor a 0';
                  },
                })}
                type="number"
                min="1"
                placeholder="Ej. 30"
                disabled={sinLimiteCupo}
                error={!!errors.cupo_maximo}
              />
            </Field>
            <div className="csf-field">
              <span className="csf-label">
                <Users size={13} strokeWidth={2} />
                Sin límite de cupo
              </span>
              <label className="csf-checkbox-label">
                <input type="checkbox" className="csf-checkbox-input" {...register('sin_limite_cupo')} />
                <span>La disciplina no tiene límite de capacidad</span>
              </label>
            </div>
            <div className="csf-field">
              <span className="csf-label">
                <DollarSign size={13} strokeWidth={2} />
                Arancelada
              </span>
              <label className="csf-checkbox-label">
                <input type="checkbox" className="csf-checkbox-input" {...register('arancelada')} />
                <span>La disciplina tiene un arancel asociado</span>
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
            {arancelada && (
              <Field label="Arancel mensual" icon={DollarSign} error={errors.monto_mensual?.message}>
                <StyledInput
                  {...register('monto_mensual', {
                    validate: (v) => {
                      if (!getValues('arancelada')) return true;
                      if (!v) return 'El arancel mensual es requerido para disciplinas aranceladas';
                      return Number(v) >= 0 || 'Debe ser mayor o igual a 0';
                    },
                  })}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 5000"
                  error={!!errors.monto_mensual}
                />
              </Field>
            )}
          </FormStep>
        )}
    </MultiStepFormShell>
  );
}

CreateDisciplinaForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
