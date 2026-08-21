import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { MessageSquare, Tag, Activity, Users, Hash } from 'lucide-react';
import PropTypes from 'prop-types';
import { fetchCategoriasSocio, fetchEstadosSocio } from '../../services/catalogosService';
import { buscarSocioPorTexto } from '../../services/sociosService';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, StyledSelect, FormStep } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import { useTheme } from '../../hooks/useTheme';
import { MAX_LEN } from '../../utils/formValidators';
import { SociosSeleccionados } from '../SociosSeleccionados/SociosSeleccionados';

const STEPS = [{ id: 1, label: 'Datos', icon: MessageSquare }];

/**
 * Formulario de un paso para crear una alerta. El destinatario se elige por
 * uno de dos modos mutuamente excluyentes: por categoría/estado financiero
 * (filtros, con opción "Todas"/"Todos") o por una lista de socios puntuales
 * buscados por N° de socio, email o ID — el payload enviado a `onSuccess`
 * cambia de forma según el modo elegido.
 * @param {{ onSuccess: (payload: object) => void, onCancel: () => void }} props
 */
export function CreateAlertaForm({ onSuccess, onCancel }) {
  const { logoSocio: logo } = useTheme();
  const { step, direction, submitted, setSubmitted, navGuard } = useMultiStepFormState();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

  const [catalogo, setCatalogo] = useState({ categorias: [], estados: [] });
  const [modo, setModo] = useState('filtros');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [sociosAgregados, setSociosAgregados] = useState([]);
  const [errorListaSocios, setErrorListaSocios] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCategoriasSocio(), fetchEstadosSocio()])
      .then(([categorias, estados]) => { if (!cancelled) setCatalogo({ categorias, estados }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const agregarSocio = async () => {
    const valor = busquedaInput.trim();
    if (!valor) return;

    setBuscando(true);
    setErrorBusqueda('');
    try {
      const socio = await buscarSocioPorTexto(valor);
      if (sociosAgregados.some((s) => s.id === socio.id)) {
        setErrorBusqueda('Este socio ya fue agregado.');
        return;
      }
      setSociosAgregados((prev) => [...prev, socio]);
      setBusquedaInput('');
      setErrorListaSocios('');
    } catch {
      setErrorBusqueda('No se encontró ningún socio con ese número, email o ID.');
    } finally {
      setBuscando(false);
    }
  };

  const removerSocio = (id) => {
    setSociosAgregados((prev) => prev.filter((s) => s.id !== id));
  };

  const onSubmit = async (data) => {
    if (modo === 'socios' && sociosAgregados.length === 0) {
      setErrorListaSocios('Debe agregar al menos un socio.');
      return;
    }

    setSubmitted(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    onSuccess(
      modo === 'socios'
        ? { mensaje: data.mensaje.trim(), ids_socios: sociosAgregados.map((s) => s.id) }
        : {
          mensaje: data.mensaje.trim(),
          filtro_categoria: data.filtro_categoria || null,
          filtro_estado: data.filtro_estado || null,
        }
    );
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      isSubmitting={isSubmitting}
      title="Nueva alerta"
      successTitle="¡Alerta enviada!"
      successMessage="La alerta fue registrada correctamente."
      submitLabel="Enviar alerta"
      submitLoadingLabel="Enviando..."
      onCancel={onCancel}
      direction={direction}
      onFormSubmit={handleSubmit(onSubmit)}
    >
      <FormStep key="step1" direction={direction}>
        <Field label="Mensaje" icon={MessageSquare} error={errors.mensaje?.message}>
          <textarea
            {...register('mensaje', {
              required: 'El mensaje es requerido',
              maxLength: { value: MAX_LEN.MENSAJE_ALERTA, message: `Máximo ${MAX_LEN.MENSAJE_ALERTA} caracteres` },
            })}
            placeholder="Redactá el mensaje de la alerta..."
            rows={5}
            className={`csf-input${errors.mensaje ? ' csf-input--error' : ''}`}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.875rem' }}
          />
        </Field>

        <Field label="Destinatarios" icon={Users}>
          <StyledSelect
            value={modo}
            onChange={(e) => {
              setModo(e.target.value);
              setErrorListaSocios('');
            }}
          >
            <option value="filtros">Por categoría / estado financiero</option>
            <option value="socios">Socios específicos</option>
          </StyledSelect>
        </Field>

        {modo === 'filtros' ? (
          <>
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
          </>
        ) : (
          <>
            <Field id="alerta-buscar-socio" label="Buscar socio" icon={Hash} error={errorBusqueda}>
              <div className="csf-socio-input-row">
                <StyledInput
                  id="alerta-buscar-socio"
                  type="text"
                  placeholder="N° de socio, email o ID"
                  value={busquedaInput}
                  onChange={(e) => {
                    setBusquedaInput(e.target.value);
                    setErrorBusqueda('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); agregarSocio(); }
                  }}
                />
                <button
                  type="button"
                  className="csf-btn-agregar-socio"
                  onClick={agregarSocio}
                  disabled={buscando || !busquedaInput.trim()}
                >
                  Agregar
                </button>
              </div>
              
              <SociosSeleccionados 
                buscando={buscando}
                logo={logo}
                sociosAgregados={sociosAgregados}
                removerSocio={removerSocio}
                errorListaSocios={errorListaSocios}
              />
            </Field>
          </>
        )}
      </FormStep>
    </MultiStepFormShell>
  );
}

CreateAlertaForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
