import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence } from 'framer-motion';
import {
  User, CreditCard, Phone,
  Calendar, Mail, MapPin, Activity, Tag,
} from 'lucide-react';
import { updateSocio } from '../../services/sociosService';
import { validarFechaNacimientoOpcional } from '../../utils/formValidators';
import { fetchEstadosSocio, fetchCategoriasSocio } from '../../services/catalogosService';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, StyledSelect, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';

const STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Documento', icon: CreditCard },
  { id: 3, label: 'Contacto', icon: Phone },
];

const stepFields = {
  1: ['nombre', 'apellido', 'fecha_nacimiento', 'genero', 'estado', 'categoria'],
  2: ['nro_documento'],
  3: ['email', 'telefono', 'direccion'],
};

export function EditSocioForm({ socio, onSuccess, onCancel }) {
  const { step, direction, submitted, setSubmitted, navGuard, advance, goBack } = useMultiStepFormState();
  const [formError, setFormError] = useState('');
  const [catalogo, setCatalogo] = useState({ estados: [], categorias: [] });

  useEffect(() => {
    Promise.all([fetchEstadosSocio(), fetchCategoriasSocio()])
      .then(([estados, categorias]) => setCatalogo({ estados, categorias }))
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      nombre: socio.nombre ?? '',
      apellido: socio.apellido ?? '',
      fecha_nacimiento: socio.fecha_nacimiento ?? '',
      genero: '',
      estado: '',
      categoria: '',
      nro_documento: socio.nro_documento ?? '',
      email: socio.email ?? '',
      telefono: socio.telefono ?? '',
      direccion: '',
    },
  });

  useEffect(() => {
    if (catalogo.estados.length > 0) {
      setValue('estado', socio.estado?.nombre ?? '');
      setValue('categoria', socio.categoria?.nombre ?? '');
    }
  }, [catalogo]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;
    advance();
  };

  const onSubmit = async (data) => {
    setFormError('');
    const updates = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== '') updates[k] = v;
    });
    try {
      const socioActualizado = await updateSocio(socio.id, updates);
      setSubmitted(true);
      setTimeout(() => onSuccess(socioActualizado), 1800);
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setFormError('El servicio no está disponible. Intentá de nuevo más tarde.');
      } else {
        setFormError('Error al modificar el socio. Intentá de nuevo.');
      }
    }
  };

  const docNumberRegister = register('nro_documento', {
    pattern: {
      value: /^[A-Z0-9]{5,20}$/,
      message: 'Solo letras mayúsculas y números (5–20 caracteres)',
    },
    setValueAs: (v) => v.toUpperCase(),
  });

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      isSubmitting={isSubmitting}
      title="Editar socio"
      successTitle="¡Datos actualizados!"
      successMessage="Los cambios fueron guardados correctamente."
      submitLabel="Guardar cambios"
      submitLoadingLabel="Guardando..."
      onCancel={onCancel}
      goBack={goBack}
      goNext={goNext}
      onFormSubmit={handleSubmit(onSubmit)}
    >
      <AnimatePresence mode="wait" custom={direction}>
        {step === 1 && (
          <FormStep key="step1" direction={direction}>
            <div className="csf-grid-2">
              <Field label="Nombre" icon={User} error={errors.nombre?.message}>
                <StyledInput
                  {...register('nombre')}
                  placeholder="ej: Juan"
                  error={!!errors.nombre}
                />
              </Field>
              <Field label="Apellido" icon={User} error={errors.apellido?.message}>
                <StyledInput
                  {...register('apellido')}
                  placeholder="ej: Pérez"
                  error={!!errors.apellido}
                />
              </Field>
            </div>
            <div className="csf-grid-2">
              <Field label="Fecha de nacimiento" icon={Calendar} error={errors.fecha_nacimiento?.message}>
                <StyledInput
                  {...register('fecha_nacimiento', { validate: validarFechaNacimientoOpcional })}
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  error={!!errors.fecha_nacimiento}
                />
              </Field>
              <Field label="Género" icon={User} error={errors.genero?.message}>
                <StyledSelect
                  {...register('genero')}
                  error={!!errors.genero}
                >
                  <option value="">— sin cambiar —</option>
                  <option value="M">Masculino (M)</option>
                  <option value="F">Femenino (F)</option>
                  <option value="X">No binario (X)</option>
                </StyledSelect>
              </Field>
            </div>
            <div className="csf-grid-2">
              <Field label="Estado" icon={Activity} error={errors.estado?.message}>
                <StyledSelect {...register('estado')} error={!!errors.estado}>
                  <option value="">— sin cambiar —</option>
                  {catalogo.estados.map((e) => (
                    <option key={e.id} value={e.nombre}>{e.nombre}</option>
                  ))}
                </StyledSelect>
              </Field>
              <Field label="Categoría" icon={Tag} error={errors.categoria?.message}>
                <StyledSelect {...register('categoria')} error={!!errors.categoria}>
                  <option value="">— sin cambiar —</option>
                  {catalogo.categorias.map((c) => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </StyledSelect>
              </Field>
            </div>
          </FormStep>
        )}

        {step === 2 && (
          <FormStep key="step2" direction={direction}>
            <Field label="N° de documento" icon={CreditCard} error={errors.nro_documento?.message}>
              <StyledInput
                {...docNumberRegister}
                onInput={(e) => { e.target.value = e.target.value.toUpperCase(); }}
                placeholder="ej: 12345678"
                error={!!errors.nro_documento}
                style={{ textTransform: 'uppercase' }}
              />
            </Field>
            <div className="csf-hint">
              Ingresá el número tal como aparece en el documento, sin puntos ni espacios.
            </div>
          </FormStep>
        )}

        {step === 3 && (
          <FormStep key="step3" direction={direction}>
            <Field label="Correo electrónico" icon={Mail} error={errors.email?.message}>
              <StyledInput
                {...register('email', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Ingresá un correo válido',
                  },
                })}
                type="email"
                placeholder="ej: juan@ejemplo.com"
                error={!!errors.email}
              />
            </Field>
            <div className="csf-grid-2">
              <Field label="Teléfono" icon={Phone} error={errors.telefono?.message}>
                <StyledInput
                  {...register('telefono', {
                    pattern: {
                      value: /^[+\d\s\-()]{7,20}$/,
                      message: 'Número inválido',
                    },
                  })}
                  type="tel"
                  placeholder="+54 11 1234-5678"
                  error={!!errors.telefono}
                />
              </Field>
              <Field label="Dirección" icon={MapPin} error={errors.direccion?.message}>
                <StyledInput
                  {...register('direccion', {
                    minLength: { value: 5, message: 'Ingresá una dirección completa' },
                  })}
                  placeholder="Av. Corrientes 1234"
                  error={!!errors.direccion}
                />
              </Field>
            </div>
            {formError && <p className="csf-form-error">{formError}</p>}
          </FormStep>
        )}
      </AnimatePresence>
    </MultiStepFormShell>
  );
}
