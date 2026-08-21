import { useState, useEffect } from 'react';
import {
  User, Phone,
  Calendar, MapPin, Activity, Tag,
} from 'lucide-react';
import { updateSocio } from '../../services/sociosService';
import { validarFechaNacimientoOpcional, getDocNumberRules } from '../../utils/formValidators';
import { fetchEstadosSocio, fetchCategoriasSocio } from '../../services/catalogosService';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, StyledSelect, FormStep, SOCIOS_STEPS, DocNumberField, EmailField } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepForm } from '../../hooks/useMultiStepForm';

const STEPS = SOCIOS_STEPS;

const stepFields = {
  1: ['nombre', 'apellido', 'fecha_nacimiento', 'genero', 'estado', 'categoria'],
  2: ['nro_documento'],
  3: ['email', 'telefono', 'direccion'],
};

/**
 * Formulario de tres pasos para editar un socio existente, pre-rellenado con
 * `defaultValues` a partir de `socio` (género y dirección no se pre-rellenan,
 * no vienen en `SocioResponse`). Los campos dejados en "— sin cambiar —" o
 * vacíos se excluyen del payload de `updateSocio`, enviando solo lo modificado.
 * @param {{ socio: object, onSuccess: (socioActualizado: object) => void, onCancel: () => void }} props
 */
export function EditSocioForm({ socio, onSuccess, onCancel }) {
  const {
    step, direction, submitted, setSubmitted, navGuard,
    goBack, goNext, formError, setFormError,
    register, handleSubmit, setValue, errors, isSubmitting,
  } = useMultiStepForm(stepFields, {
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
  const [catalogo, setCatalogo] = useState({ estados: [], categorias: [] });

  useEffect(() => {
    Promise.all([fetchEstadosSocio(), fetchCategoriasSocio()])
      .then(([estados, categorias]) => setCatalogo({ estados, categorias }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (catalogo.estados.length > 0) {
      setValue('estado', socio.estado?.nombre ?? '');
      setValue('categoria', socio.categoria?.nombre ?? '');
    }
  }, [catalogo]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const docNumberRegister = register('nro_documento', getDocNumberRules({ required: false }));

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
      direction={direction}
      onFormSubmit={handleSubmit(onSubmit)}
    >
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
            <DocNumberField docNumberRegister={docNumberRegister} errors={errors} fieldKey="nro_documento" label="N° de documento" placeholder="ej: 12345678" />
          </FormStep>
        )}

        {step === 3 && (
          <FormStep key="step3" direction={direction}>
            <EmailField register={register} errors={errors} placeholder="ej: juan@ejemplo.com" />
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
    </MultiStepFormShell>
  );
}
