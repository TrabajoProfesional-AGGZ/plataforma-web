import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence } from 'framer-motion';
import {
  User, CreditCard, Mail, Shield,
  Calendar, Lock,
} from 'lucide-react';
import { crearUsuario } from '../../services/usuariosService';
import { fetchRoles } from '../../services/rolesService';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, StyledSelect, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';

const STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Documento', icon: CreditCard },
  { id: 3, label: 'Credenciales', icon: Mail },
  { id: 4, label: 'Rol', icon: Shield },
];

const stepFields = {
  1: ['nombre', 'apellido', 'fechaNacimiento'],
  2: ['tipoDoc', 'nroDocumento'],
  3: ['email', 'password'],
  4: ['rol'],
};

export function CreateUserForm({ onSuccess, onCancel }) {
  const { step, direction, submitted, setSubmitted, navGuard, advance, goBack } = useMultiStepFormState();
  const [formError, setFormError] = useState('');
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetchRoles()
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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
      nombre: data.nombre,
      apellido: data.apellido,
      fecha_nacimiento: data.fechaNacimiento,
      tipo_doc: data.tipoDoc,
      nro_documento: data.nroDocumento,
      email: data.email,
      password: data.password,
      rol: data.rol,
    };
    try {
      await crearUsuario(payload);
      setSubmitted(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (err) {
      if (err.message === 'usuario-duplicado') {
        setFormError('Ya existe un usuario con ese documento o email.');
      } else if (err.message === 'servicio-no-disponible') {
        setFormError('El servicio no está disponible. Intentá de nuevo más tarde.');
      } else {
        setFormError('Error al crear el usuario. Verificá los datos e intentá de nuevo.');
      }
    }
  };

  const nroDocumentoRegister = register('nroDocumento', {
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
      title="Nuevo usuario"
      successTitle="¡Usuario creado!"
      successMessage="Los datos fueron guardados correctamente."
      submitLabel="Crear usuario"
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
              <Field label="Nombre" icon={User} error={errors.nombre?.message}>
                <StyledInput
                  {...register('nombre', { required: 'Requerido' })}
                  placeholder="María"
                  error={!!errors.nombre}
                />
              </Field>
              <Field label="Apellido" icon={User} error={errors.apellido?.message}>
                <StyledInput
                  {...register('apellido', { required: 'Requerido' })}
                  placeholder="González"
                  error={!!errors.apellido}
                />
              </Field>
            </div>
            <Field label="Fecha de nacimiento" icon={Calendar} error={errors.fechaNacimiento?.message}>
              <StyledInput
                {...register('fechaNacimiento', {
                  required: 'La fecha es requerida',
                  validate: (v) => {
                    const d = new Date(v);
                    const now = new Date();
                    if (isNaN(d.getTime())) return 'Fecha inválida';
                    if (d > now) return 'La fecha no puede ser futura';
                    if (now.getFullYear() - d.getFullYear() > 120) return 'Fecha inválida';
                    return true;
                  },
                })}
                type="date"
                max={new Date().toISOString().split('T')[0]}
                error={!!errors.fechaNacimiento}
              />
            </Field>
          </FormStep>
        )}

        {step === 2 && (
          <FormStep key="step2" direction={direction}>
            <Field label="Tipo de documento" icon={CreditCard} error={errors.tipoDoc?.message}>
              <StyledSelect
                {...register('tipoDoc', { required: 'Seleccioná un tipo' })}
                error={!!errors.tipoDoc}
              >
                <option value="">Seleccionar...</option>
                <option value="DNI">DNI — Documento Nacional de Identidad</option>
                <option value="LE">LE — Libreta de Enrolamiento</option>
                <option value="PAS">PAS — Pasaporte</option>
              </StyledSelect>
            </Field>
            <Field label="Número de documento" icon={CreditCard} error={errors.nroDocumento?.message}>
              <StyledInput
                {...nroDocumentoRegister}
                onInput={(e) => { e.target.value = e.target.value.toUpperCase(); }}
                placeholder="Ej. 12345678"
                error={!!errors.nroDocumento}
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
            <Field label="Contraseña" icon={Lock} error={errors.password?.message}>
              <StyledInput
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
                type="password"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                error={!!errors.password}
              />
            </Field>
          </FormStep>
        )}

        {step === 4 && (
          <FormStep key="step4" direction={direction}>
            <Field label="Rol" icon={Shield} error={errors.rol?.message}>
              <StyledSelect
                {...register('rol', { required: 'Seleccioná un rol' })}
                error={!!errors.rol}
              >
                <option value="">Seleccionar...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.nombre}>{r.nombre}</option>
                ))}
              </StyledSelect>
            </Field>
            {formError && <p className="csf-form-error">{formError}</p>}
          </FormStep>
        )}
      </AnimatePresence>
    </MultiStepFormShell>
  );
}
