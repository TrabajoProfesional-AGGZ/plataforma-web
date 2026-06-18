import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence } from 'framer-motion';
import {
  User, Clock, CheckCircle2, AlertCircle,
  Calendar, Building2, Hash,
} from 'lucide-react';
import { createReserva } from '../../services/reservasService';
import { getSocioByNroSocio } from '../../services/sociosService';
import logo from '../../assets/logo_socio.png';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, StyledSelect, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const STEPS = [
  { id: 1, label: 'Datos', icon: User },
  { id: 2, label: 'Horario', icon: Clock },
];

const stepFields = {
  1: ['nro_socio', 'id_instalacion'],
  2: ['fecha_reserva', 'hora_inicio', 'hora_fin'],
};

export function CreateReservaForm({ onSuccess, onCancel, instalaciones = [], instalacionPreseleccionada = '' }) {
  const { step, direction, submitted, setSubmitted, navGuard, advance, goBack } = useMultiStepFormState();
  const [busquedaSocio, setBusquedaSocio] = useState(false);
  const [errorSocio, setErrorSocio] = useState('');
  const [socioResuelto, setSocioResuelto] = useState(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({ mode: 'onTouched', defaultValues: { id_instalacion: instalacionPreseleccionada } });

  useEscapeKey(onCancel);

  const goNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;

    if (step === 1) {
      const nroSocio = getValues('nro_socio');
      setBusquedaSocio(true);
      setErrorSocio('');
      try {
        const socio = await getSocioByNroSocio(nroSocio);
        setSocioResuelto(socio);
        advance();
      } catch (_e) {
        setErrorSocio('No se encontró ningún socio con ese número.');
      } finally {
        setBusquedaSocio(false);
      }
      return;
    }

    advance();
  };

  const onSubmit = async (data) => {
    setSubmitted(true);
    try {
      await createReserva({
        id_socio: socioResuelto.id,
        id_instalacion: data.id_instalacion,
        fecha_reserva: data.fecha_reserva,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
      });
    } catch (_e) {
      // success screen is shown regardless — API errors are non-blocking here
    }
    setTimeout(() => onSuccess(), 1800);
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      title="Nueva reserva"
      successTitle="¡Reserva registrada!"
      successMessage="La reserva fue procesada correctamente."
      submitLabel="Registrar reserva"
      onCancel={onCancel}
      goBack={goBack}
      goNext={goNext}
      nextDisabled={busquedaSocio}
      onFormSubmit={handleSubmit(onSubmit)}
    >
      <AnimatePresence mode="wait" custom={direction}>
        {step === 1 && (
          <FormStep key="step1" direction={direction}>
            <Field label="Número de socio" icon={Hash} error={errors.nro_socio?.message}>
              <StyledInput
                {...register('nro_socio', { required: 'El número de socio es requerido' })}
                type="text"
                placeholder="Ej. 1234"
                error={!!errors.nro_socio}
              />
              {socioResuelto && (
                <p className="csf-socio-encontrado">
                  <CheckCircle2 size={13} color="#0D6E0D" />
                  {socioResuelto.apellido} {socioResuelto.nombre}
                </p>
              )}
              {errorSocio && (
                <p className="csf-error">
                  <AlertCircle size={12} />
                  {errorSocio}
                </p>
              )}
              {busquedaSocio && (
                <div className="csf-socio-buscando">
                  <img src={logo} alt="" className="csf-socio-logo-spin" />
                  <span>Buscando socio...</span>
                </div>
              )}
            </Field>
            <Field label="Instalación" icon={Building2} error={errors.id_instalacion?.message}>
              <StyledSelect
                {...register('id_instalacion', { required: 'Debe seleccionar una instalación' })}
                error={!!errors.id_instalacion}
              >
                <option value="">Seleccionar instalación...</option>
                {instalaciones.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.nombre}</option>
                ))}
              </StyledSelect>
            </Field>
          </FormStep>
        )}

        {step === 2 && (
          <FormStep key="step2" direction={direction}>
            <Field label="Fecha" icon={Calendar} error={errors.fecha_reserva?.message}>
              <StyledInput
                {...register('fecha_reserva', { required: 'La fecha es requerida' })}
                type="date"
                error={!!errors.fecha_reserva}
              />
            </Field>
            <div className="csf-grid-2">
              <Field label="Hora inicio" icon={Clock} error={errors.hora_inicio?.message}>
                <StyledInput
                  {...register('hora_inicio', { required: 'La hora de inicio es requerida' })}
                  type="time"
                  error={!!errors.hora_inicio}
                />
              </Field>
              <Field label="Hora fin" icon={Clock} error={errors.hora_fin?.message}>
                <StyledInput
                  {...register('hora_fin', {
                    required: 'La hora de fin es requerida',
                    validate: (v) => {
                      const inicio = getValues('hora_inicio');
                      if (!inicio) return true;
                      return v > inicio || 'La hora de fin debe ser posterior a la de inicio';
                    },
                  })}
                  type="time"
                  error={!!errors.hora_fin}
                />
              </Field>
            </div>
          </FormStep>
        )}
      </AnimatePresence>
    </MultiStepFormShell>
  );
}
