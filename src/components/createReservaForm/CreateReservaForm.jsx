import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence } from 'framer-motion';
import {
  User, Clock, CheckCircle2, AlertCircle,
  Calendar, Building2, Hash, X,
} from 'lucide-react';
import { createReserva } from '../../services/reservasService';
import { getSocioByNroSocio } from '../../services/sociosService';
import logo from '../../assets/logo_socio.png';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, StyledSelect, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import PropTypes from 'prop-types';

const STEPS = [
  { id: 1, label: 'Datos', icon: User },
  { id: 2, label: 'Horario', icon: Clock },
];

const stepFields = {
  1: ['id_instalacion'],
  2: ['fecha_reserva', 'hora_inicio', 'hora_fin'],
};

export function CreateReservaForm({ onSuccess, onCancel, instalaciones = [], instalacionPreseleccionada = '' }) {
  const { step, direction, submitted, setSubmitted, navGuard, advance, goBack } = useMultiStepFormState();
  const [nroSocioInput, setNroSocioInput] = useState('');
  const [busquedaSocio, setBusquedaSocio] = useState(false);
  const [errorSocio, setErrorSocio] = useState('');
  const [socioPreview, setSocioPreview] = useState(null);
  const [sociosAgregados, setSociosAgregados] = useState([]);
  const [errorListaSocios, setErrorListaSocios] = useState('');
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({ mode: 'onTouched', defaultValues: { id_instalacion: instalacionPreseleccionada } });

  const previewSocio = async (value) => {
    if (!value?.trim()) return;
    try {
      const socio = await getSocioByNroSocio(value.trim());
      setSocioPreview(socio);
    } catch {
      // preview silently fails
    }
  };

  const agregarSocio = async () => {
    const nro = nroSocioInput.trim();
    if (!nro) return;

    if (sociosAgregados.some((s) => s.nro_socio === nro)) {
      setErrorSocio('Este socio ya fue agregado.');
      return;
    }

    const socioYaResuelto = socioPreview?.nro_socio === nro ? socioPreview : null;
    if (socioYaResuelto) {
      setSociosAgregados((prev) => [...prev, socioYaResuelto]);
      setNroSocioInput('');
      setSocioPreview(null);
      setErrorSocio('');
      setErrorListaSocios('');
      return;
    }

    setBusquedaSocio(true);
    setErrorSocio('');
    try {
      const socio = await getSocioByNroSocio(nro);
      if (sociosAgregados.some((s) => s.id === socio.id)) {
        setErrorSocio('Este socio ya fue agregado.');
        return;
      }
      setSociosAgregados((prev) => [...prev, socio]);
      setNroSocioInput('');
      setSocioPreview(null);
      setErrorListaSocios('');
    } catch {
      setErrorSocio('No se encontró ningún socio con ese número.');
    } finally {
      setBusquedaSocio(false);
    }
  };

  const removerSocio = (id) => {
    setSociosAgregados((prev) => prev.filter((s) => s.id !== id));
  };

  const goNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;

    if (step === 1) {
      if (sociosAgregados.length === 0) {
        setErrorListaSocios('Debe agregar al menos un socio.');
        return;
      }
      advance();
      return;
    }

    advance();
  };

  const onSubmit = async (data) => {
    setSubmitError('');
    try {
      await createReserva({
        ids_socios: sociosAgregados.map((s) => s.id),
        id_instalacion: data.id_instalacion,
        fecha_reserva: data.fecha_reserva,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
      });
      setSubmitted(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (e) {
      setSubmitError(
        e.message === 'superposicion'
          ? 'Ya existe una reserva en ese horario para esta instalación.'
          : 'No se pudo registrar la reserva. Intentá de nuevo.'
      );
    }
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
            <Field label="Agregar socio" icon={Hash} error={errorSocio}>
              <div className="csf-socio-input-row">
                <StyledInput
                  type="text"
                  placeholder="Ej. 1234"
                  value={nroSocioInput}
                  onChange={(e) => {
                    setNroSocioInput(e.target.value);
                    setSocioPreview(null);
                    setErrorSocio('');
                  }}
                  onBlur={(e) => previewSocio(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); agregarSocio(); }
                  }}
                />
                <button
                  type="button"
                  className="csf-btn-agregar-socio"
                  onClick={agregarSocio}
                  disabled={busquedaSocio || !nroSocioInput.trim()}
                >
                  Agregar
                </button>
              </div>
              {socioPreview && socioPreview.nro_socio === nroSocioInput.trim() && (
                <span className="csf-socio-nombre-inline">
                  <CheckCircle2 size={13} color="#0D6E0D" />
                  {socioPreview.apellido} {socioPreview.nombre}
                </span>
              )}
              {busquedaSocio && (
                <div className="csf-socio-buscando">
                  <img src={logo} alt="" className="csf-socio-logo-spin" />
                  <span>Buscando socio...</span>
                </div>
              )}
            </Field>

            {sociosAgregados.length > 0 && (
              <div className="csf-socios-lista">
                {sociosAgregados.map((socio) => (
                  <div key={socio.id} className="csf-socio-chip">
                    <span>{socio.nro_socio} — {socio.apellido} {socio.nombre}</span>
                    <button
                      type="button"
                      className="csf-socio-chip-remove"
                      onClick={() => removerSocio(socio.id)}
                      aria-label={`Quitar socio ${socio.nro_socio}`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errorListaSocios && (
              <p className="csf-error">
                <AlertCircle size={12} />
                {errorListaSocios}
              </p>
            )}

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
            {submitError && (
              <p className="csf-error">
                <AlertCircle size={12} />
                {submitError}
              </p>
            )}
          </FormStep>
        )}
      </AnimatePresence>
    </MultiStepFormShell>
  );
}

CreateReservaForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  instalaciones: PropTypes.array,
  instalacionPreseleccionada: PropTypes.string,
};
