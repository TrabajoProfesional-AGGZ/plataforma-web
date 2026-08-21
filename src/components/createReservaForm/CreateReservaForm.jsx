import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence } from 'framer-motion';
import {
  User, Clock, CheckCircle2, AlertCircle,
  Calendar, Building2, Hash
} from 'lucide-react';
import { createReserva, getTurnosDisponibles } from '../../services/reservasService';
import { getSocioByNroSocio } from '../../services/sociosService';
import { useTheme } from '../../hooks/useTheme';
import '../createForm/CreateSocioForm.css';
import './TurnoSelector.css';
import { Field, StyledInput, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import PropTypes from 'prop-types';
import { SociosSeleccionados } from '../SociosSeleccionados/SociosSeleccionados';
import { TurnoSelector } from './TurnoSelector';

const STEPS = [
  { id: 1, label: 'Datos', icon: User },
  { id: 2, label: 'Horario', icon: Clock },
];

const stepFields = {
  1: [],
  2: ['fecha_reserva', 'hora_inicio'],
};

const AVISOS_ESTADO_SOCIO = {
  Moroso: 'No se puede realizar una reserva para este socio hasta que no regularice su situación financiera con el club',
  Suspendido: 'No se puede realizar una reserva para este socio hasta que no termine su suspensión.',
};

const MENSAJES_ERROR_SUBMIT = {
  superposicion: 'Ya existe una reserva en ese horario para esta instalación.',
  'sin-cupo': 'Ya no quedan cupos suficientes para ese turno con la cantidad de socios elegida.',
  'conflicto-temporal': 'La instalación está siendo actualizada por otra reserva. Probá de nuevo en unos segundos.',
  'socio-moroso': AVISOS_ESTADO_SOCIO.Moroso,
  'socio-suspendido': AVISOS_ESTADO_SOCIO.Suspendido,
};

/**
 * Formulario de dos pasos (Datos / Horario) para crear una reserva, siempre a
 * nombre de una instalación ya conocida por el caller (se abre desde el
 * detalle de esa instalación, así que no hay selector — el nombre se muestra
 * como dato fijo). Los turnos disponibles del paso 2 se recargan al cambiar
 * la fecha y traen `cupos_disponibles` por turno (cupo compartido entre
 * reservas, no por-reserva); la cantidad de socios agregados no puede
 * superar ese cupo, tanto en el paso 1 (bloqueo del botón "Agregar") como al
 * confirmar el envío (revalidado por si el cupo bajó mientras se completaba el form).
 * @param {{ onSuccess: () => void, onCancel: () => void, instalacion: object }} props
 */
export function CreateReservaForm({ onSuccess, onCancel, instalacion }) {
  const { logoSocio: logo } = useTheme();
  const { step, direction, submitted, setSubmitted, navGuard, advance, goBack } = useMultiStepFormState();
  const [nroSocioInput, setNroSocioInput] = useState('');
  const [busquedaSocio, setBusquedaSocio] = useState(false);
  const [errorSocio, setErrorSocio] = useState('');
  const [socioPreview, setSocioPreview] = useState(null);
  const [sociosAgregados, setSociosAgregados] = useState([]);
  const [errorListaSocios, setErrorListaSocios] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [turnosDisponibles, setTurnosDisponibles] = useState([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);
  const [errorTurnos, setErrorTurnos] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

  const fechaSeleccionada = watch('fecha_reserva');
  const horaInicioSeleccionada = watch('hora_inicio');

  const turnoSeleccionado = turnosDisponibles.find((t) => t.hora_inicio === horaInicioSeleccionada);
  const cuposDisponiblesTurno = turnoSeleccionado?.cupos_disponibles ?? null;
  const topeSociosAlcanzado = cuposDisponiblesTurno != null && sociosAgregados.length >= cuposDisponiblesTurno;

  useEffect(() => {
    if (!fechaSeleccionada) {
      setTurnosDisponibles([]);
      return;
    }
    let cancelled = false;
    setCargandoTurnos(true);
    setErrorTurnos('');
    getTurnosDisponibles(instalacion.id, fechaSeleccionada)
      .then((turnos) => {
        if (cancelled) return;
        setTurnosDisponibles(turnos);
        setValue('hora_inicio', '');
      })
      .catch(() => {
        if (!cancelled) {
          setTurnosDisponibles([]);
          setErrorTurnos('No se pudieron cargar los turnos disponibles.');
        }
      })
      .finally(() => { if (!cancelled) setCargandoTurnos(false); });
    return () => { cancelled = true; };
  }, [instalacion.id, fechaSeleccionada, setValue]);

  const previewSocio = async (value) => {
    if (!value?.trim()) return;
    try {
      const socio = await getSocioByNroSocio(value.trim());
      setSocioPreview(socio);
    } catch {
      // La previsualización falla en silencio: el error real se muestra recién al intentar agregar el socio
    }
  };

  const agregarSocioSiValido = (socio) => {
    const avisoEstado = AVISOS_ESTADO_SOCIO[socio.estado?.nombre];
    if (avisoEstado) {
      setErrorSocio(avisoEstado);
      return;
    }
    setSociosAgregados((prev) => [...prev, socio]);
    setNroSocioInput('');
    setSocioPreview(null);
    setErrorSocio('');
    setErrorListaSocios('');
  };

  const agregarSocio = async () => {
    const nro = nroSocioInput.trim();
    if (!nro) return;

    if (topeSociosAlcanzado) {
      setErrorSocio(`Ya alcanzaste el cupo disponible para el turno elegido (${cuposDisponiblesTurno} personas).`);
      return;
    }
    if (sociosAgregados.some((s) => s.nro_socio === nro)) {
      setErrorSocio('Este socio ya fue agregado.');
      return;
    }

    const socioYaResuelto = socioPreview?.nro_socio === nro ? socioPreview : null;
    if (socioYaResuelto) {
      agregarSocioSiValido(socioYaResuelto);
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
      agregarSocioSiValido(socio);
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

    if (sociosAgregados.length === 0) {
      setErrorListaSocios('Debe agregar al menos un socio.');
      return;
    }
    advance();
  };

  const onSubmit = async (data) => {
    setSubmitError('');
    if (cuposDisponiblesTurno != null && sociosAgregados.length > cuposDisponiblesTurno) {
      setSubmitError(MENSAJES_ERROR_SUBMIT['sin-cupo']);
      return;
    }
    try {
      await createReserva({
        ids_socios: sociosAgregados.map((s) => s.id),
        id_instalacion: instalacion.id,
        fecha_reserva: data.fecha_reserva,
        hora_inicio: data.hora_inicio,
      });
      setSubmitted(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (e) {
      setSubmitError(MENSAJES_ERROR_SUBMIT[e.message] || 'No se pudo registrar la reserva. Intentá de nuevo.');
    }
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      isSubmitting={isSubmitting}
      title="Nueva reserva"
      successTitle="¡Reserva registrada!"
      successMessage="La reserva fue procesada correctamente."
      submitLabel="Registrar reserva"
      submitLoadingLabel="Registrando..."
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
                  disabled={busquedaSocio || !nroSocioInput.trim() || topeSociosAlcanzado}
                >
                  Agregar
                </button>
              </div>
              {topeSociosAlcanzado && (
                <p className="csf-error">
                  <AlertCircle size={12} />
                  {`Ya alcanzaste el cupo disponible para el turno elegido (${cuposDisponiblesTurno} personas).`}
                </p>
              )}
              {socioPreview && socioPreview.nro_socio === nroSocioInput.trim() && (
                <span className="csf-socio-nombre-inline">
                  <CheckCircle2 size={13} color="var(--status-success-border)" />
                  {socioPreview.apellido} {socioPreview.nombre}
                </span>
              )}
              <SociosSeleccionados 
                buscando={busquedaSocio}
                logo={logo}
                sociosAgregados={sociosAgregados}
                removerSocio={removerSocio}
                errorListaSocios={errorListaSocios}
              />
            </Field>

            <Field label="Instalación" icon={Building2}>
              <StyledInput type="text" value={instalacion.nombre} disabled />
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
            <Field label="Turno" icon={Clock} error={errors.hora_inicio?.message}>
              <TurnoSelector
                turnos={turnosDisponibles}
                capacidadMaxima={instalacion.capacidad_maxima}
                selected={horaInicioSeleccionada}
                onSelect={(hora) => setValue('hora_inicio', hora, { shouldValidate: true, shouldDirty: true })}
                loading={cargandoTurnos}
              />
              <input type="hidden" {...register('hora_inicio', { required: 'Debe seleccionar un turno' })} />
            </Field>
            {!cargandoTurnos && fechaSeleccionada && !errorTurnos && turnosDisponibles.length === 0 && (
              <p className="csf-error">
                <AlertCircle size={12} />
                No hay turnos disponibles para esta instalación en la fecha elegida.
              </p>
            )}
            {errorTurnos && (
              <p className="csf-error">
                <AlertCircle size={12} />
                {errorTurnos}
              </p>
            )}
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
  instalacion: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
    capacidad_maxima: PropTypes.number,
  }).isRequired,
};
