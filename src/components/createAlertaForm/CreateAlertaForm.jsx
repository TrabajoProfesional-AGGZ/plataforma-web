import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { MessageSquare, Tag, Activity } from 'lucide-react';
import PropTypes from 'prop-types';
import { fetchCategoriasSocio, fetchEstadosSocio } from '../../services/catalogosService';
import '../createForm/CreateSocioForm.css';
import { Field, StyledSelect, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const STEPS = [{ id: 1, label: 'Datos', icon: MessageSquare }];

export function CreateAlertaForm({ onSuccess, onCancel }) {
  const { step, direction, submitted, setSubmitted, navGuard } = useMultiStepFormState();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onTouched' });

  const [catalogo, setCatalogo] = useState({ categorias: [], estados: [] });

  useEffect(() => {
    Promise.all([fetchCategoriasSocio(), fetchEstadosSocio()])
      .then(([categorias, estados]) => setCatalogo({ categorias, estados }))
      .catch(() => {});
  }, []);

  useEscapeKey(onCancel);

  const onSubmit = (data) => {
    setSubmitted(true);
    setTimeout(() => onSuccess({
      mensaje: data.mensaje.trim(),
      filtro_categoria: data.filtro_categoria || null,
      filtro_estado: data.filtro_estado || null,
    }), 1800);
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      title="Nueva alerta"
      successTitle="¡Alerta enviada!"
      successMessage="La alerta fue registrada correctamente."
      submitLabel="Enviar alerta"
      onCancel={onCancel}
      direction={direction}
      onFormSubmit={handleSubmit(onSubmit)}
    >
      <FormStep key="step1" direction={direction}>
        <Field label="Mensaje" icon={MessageSquare} error={errors.mensaje?.message}>
          <textarea
            {...register('mensaje', { required: 'El mensaje es requerido' })}
            placeholder="Redactá el mensaje de la alerta..."
            rows={5}
            className={`csf-input${errors.mensaje ? ' csf-input-error' : ''}`}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
          />
        </Field>
        <Field label="Categoría societaria" icon={Tag} error={errors.filtro_categoria?.message}>
          <StyledSelect {...register('filtro_categoria')} error={!!errors.filtro_categoria}>
            <option value="">Todas</option>
            {catalogo.categorias.map((c) => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </StyledSelect>
        </Field>
        <Field label="Estado Financiero" icon={Activity} error={errors.filtro_estado?.message}>
          <StyledSelect {...register('filtro_estado')} error={!!errors.filtro_estado}>
            <option value="">Todos</option>
            {catalogo.estados.map((e) => (
              <option key={e.id} value={e.nombre}>{e.nombre}</option>
            ))}
          </StyledSelect>
        </Field>
      </FormStep>
    </MultiStepFormShell>
  );
}

CreateAlertaForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
