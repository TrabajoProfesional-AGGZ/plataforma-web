import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence } from 'framer-motion';
import {
  User, CreditCard, Phone,
  Calendar, Mail, MapPin,
} from 'lucide-react';
import { createSocio } from '../../services/sociosService';
import { validarFechaNacimiento } from '../../utils/formValidators';
import { Field, StyledInput, StyledSelect, FormStep } from './FormFields';
import { MultiStepFormShell } from './MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import './CreateSocioForm.css';

const STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Documento', icon: CreditCard },
  { id: 3, label: 'Contacto', icon: Phone },
];

const stepFields = {
  1: ['firstName', 'lastName', 'birthDate', 'gender'],
  2: ['docType', 'docNumber'],
  3: ['email', 'phone', 'address'],
};

export function CreateSocioForm({ onSuccess, onCancel }) {
  const { step, direction, submitted, setSubmitted, navGuard, advance, goBack } = useMultiStepFormState();
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

  const goNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;
    advance();
  };

  const onSubmit = async (data) => {
    setFormError('');
    const payload = {
      nombre: data.firstName,
      apellido: data.lastName,
      fecha_nacimiento: data.birthDate,
      genero: data.gender,
      tipo_doc: data.docType,
      nro_documento: data.docNumber,
      email: data.email,
      ...(data.phone && { telefono: data.phone }),
      ...(data.address && { direccion: data.address }),
    };
    try {
      await createSocio(payload);
      setSubmitted(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (err) {
      if (err.message === 'socio-duplicado') {
        setFormError('Ya existe un socio con ese documento o email.');
      } else if (err.message === 'servicio-no-disponible') {
        setFormError('El servicio no está disponible. Intentá de nuevo más tarde.');
      } else {
        setFormError('Error al crear el socio. Verificá los datos e intentá de nuevo.');
      }
    }
  };

  const docNumberRegister = register('docNumber', {
    required: 'El número es requerido',
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
      title="Nuevo socio"
      successTitle="¡Socio creado!"
      successMessage="Los datos fueron guardados correctamente."
      submitLabel="Crear socio"
      submitLoadingLabel="Creando..."
      onCancel={onCancel}
      goBack={goBack}
      goNext={goNext}
      onFormSubmit={handleSubmit(onSubmit)}
    >
      <AnimatePresence mode="wait" custom={direction}>
        {step === 1 && (
          <FormStep key="step1" direction={direction}>
            <div className="csf-grid-2">
              <Field label="Nombre" icon={User} error={errors.firstName?.message}>
                <StyledInput
                  {...register('firstName', { required: 'Requerido' })}
                  placeholder="María"
                  error={!!errors.firstName}
                />
              </Field>
              <Field label="Apellido" icon={User} error={errors.lastName?.message}>
                <StyledInput
                  {...register('lastName', { required: 'Requerido' })}
                  placeholder="González"
                  error={!!errors.lastName}
                />
              </Field>
            </div>
            <Field label="Fecha de nacimiento" icon={Calendar} error={errors.birthDate?.message}>
              <StyledInput
                {...register('birthDate', { required: 'La fecha es requerida', validate: validarFechaNacimiento })}
                type="date"
                max={new Date().toISOString().split('T')[0]}
                error={!!errors.birthDate}
              />
            </Field>
            <Field label="Género" icon={User} error={errors.gender?.message}>
              <StyledSelect
                {...register('gender', { required: 'Seleccioná una opción' })}
                error={!!errors.gender}
              >
                <option value="">Seleccionar...</option>
                <option value="M">Masculino (M)</option>
                <option value="F">Femenino (F)</option>
                <option value="X">No binario (X)</option>
              </StyledSelect>
            </Field>
          </FormStep>
        )}

        {step === 2 && (
          <FormStep key="step2" direction={direction}>
            <Field label="Tipo de documento" icon={CreditCard} error={errors.docType?.message}>
              <StyledSelect
                {...register('docType', { required: 'Seleccioná un tipo' })}
                error={!!errors.docType}
              >
                <option value="">Seleccionar...</option>
                <option value="DNI">DNI — Documento Nacional de Identidad</option>
                <option value="LE">LE — Libreta de Enrolamiento</option>
                <option value="PAS">PAS — Pasaporte</option>
              </StyledSelect>
            </Field>
            <Field label="Número de documento" icon={CreditCard} error={errors.docNumber?.message}>
              <StyledInput
                {...docNumberRegister}
                onInput={(e) => { e.target.value = e.target.value.toUpperCase(); }}
                placeholder="Ej. 12345678"
                error={!!errors.docNumber}
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
                  required: 'El correo es requerido',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Ingresá un correo válido',
                  },
                })}
                type="email"
                placeholder="maria@ejemplo.com"
                error={!!errors.email}
              />
            </Field>
            <Field label="Teléfono (opcional)" icon={Phone} error={errors.phone?.message}>
              <StyledInput
                {...register('phone', {
                  pattern: {
                    value: /^[+\d\s\-()]{7,20}$/,
                    message: 'Número inválido',
                  },
                })}
                type="tel"
                placeholder="+54 11 1234-5678"
                error={!!errors.phone}
              />
            </Field>
            <Field label="Dirección (opcional)" icon={MapPin} error={errors.address?.message}>
              <StyledInput
                {...register('address', {
                  minLength: { value: 5, message: 'Ingresá una dirección completa' },
                })}
                placeholder="Av. Corrientes 1234, CABA"
                error={!!errors.address}
              />
            </Field>
            {formError && <p className="csf-form-error">{formError}</p>}
          </FormStep>
        )}
      </AnimatePresence>
    </MultiStepFormShell>
  );
}
