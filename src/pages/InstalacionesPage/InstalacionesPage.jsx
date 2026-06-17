import { useState, useEffect } from 'react';
import { Plus, ChevronLeft } from 'lucide-react';
import { CreateInstalacionForm } from '../../components/createInstalacionForm/CreateInstalacionForm';
import { CreateReservaForm } from '../../components/createReservaForm/CreateReservaForm';
import { getInstalaciones, createInstalacion, deleteInstalacion } from '../../services/instalacionesService';
import { getReservas, createReserva, deleteReserva } from '../../services/reservasService';
import { getSocios, getSocioByNroSocio } from '../../services/sociosService';
import { usePermiso } from '../../hooks/usePermiso';
import logo from '../../assets/logo_socio.png';
import './InstalacionesPage.css';

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const FORM_RESERVA_INICIAL = { nro_socio: '', fecha_reserva: '', hora_inicio: '', hora_fin: '' };

function InstalacionesPage() {
  const puedeVerInstalaciones = usePermiso('ver_instalaciones');
  const puedeCrearInstalacion = usePermiso('crear_instalacion');
  const puedeBorrarInstalacion = usePermiso('borrar_instalacion');
  const puedeVerReservas = usePermiso('ver_reservas');
  const puedeCrearReserva = usePermiso('crear_reserva');
  const puedeBorrarReserva = usePermiso('borrar_reserva');

  const [vista, setVista] = useState('lista');
  const [instalacionActual, setInstalacionActual] = useState(null);
  const [instalaciones, setInstalaciones] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loadingInstalaciones, setLoadingInstalaciones] = useState(false);

  const [crearInstalacionFormOpen, setCrearInstalacionFormOpen] = useState(false);
  const [crearReservaFormOpen, setCrearReservaFormOpen] = useState(false);

  const [eliminarInstalacionOpen, setEliminarInstalacionOpen] = useState(false);
  const [eliminarReservaOpen, setEliminarReservaOpen] = useState(false);
  const [reservaActual, setReservaActual] = useState(null);

  const [formReserva, setFormReserva] = useState(FORM_RESERVA_INICIAL);
  const [errReservaInline, setErrReservaInline] = useState('');
  const [loadingReservaInline, setLoadingReservaInline] = useState(false);

  useEffect(() => {
    if (!puedeVerInstalaciones) return;
    setLoadingInstalaciones(true);
    getInstalaciones()
      .then((data) => setInstalaciones(data))
      .catch(() => {})
      .finally(() => setLoadingInstalaciones(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!instalacionActual || !puedeVerReservas) return;
    Promise.all([getReservas(instalacionActual.id), getSocios()])
      .then(([reservasData, sociosData]) => {
        const socioMap = Object.fromEntries(sociosData.map((s) => [s.id, s.nro_socio]));
        setReservas(reservasData.map((r) => ({
          ...r,
          nro_socio: r.nro_socio ?? socioMap[r.id_socio] ?? r.id_socio,
        })));
      })
      .catch(() => {});
  }, [instalacionActual]); // eslint-disable-line react-hooks/exhaustive-deps

  const anyModalOpen = eliminarInstalacionOpen || eliminarReservaOpen;

  useEffect(() => {
    if (!anyModalOpen) return;
    function handleKeyDown(e) {
      if (e.key !== 'Escape') return;
      if (eliminarInstalacionOpen) setEliminarInstalacionOpen(false);
      else if (eliminarReservaOpen) setEliminarReservaOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [anyModalOpen, eliminarInstalacionOpen, eliminarReservaOpen]);

  // === Instalaciones ===

  async function handleInstalacionCreada(data) {
    const tempId = genId();
    setInstalaciones((prev) => [...prev, { id: tempId, ...data }]);
    setCrearInstalacionFormOpen(false);
    try {
      const created = await createInstalacion(data);
      setInstalaciones((prev) => prev.map((i) => i.id === tempId ? { ...i, id: created.id } : i));
    } catch {
      setInstalaciones((prev) => prev.filter((i) => i.id !== tempId));
    }
  }

  async function handleEliminarInstalacion() {
    const id = instalacionActual.id;
    setInstalaciones((prev) => prev.filter((i) => i.id !== id));
    setReservas((prev) => prev.filter((r) => r.instalacion_id !== id));
    setInstalacionActual(null);
    setVista('lista');
    setEliminarInstalacionOpen(false);
    try {
      await deleteInstalacion(id);
    } catch { /* silently ignore */ }
  }

  // === Reservas (en detalle de instalación) ===

  const reservasDeInstalacion = reservas.filter((r) => (r.instalacion_id ?? r.id_instalacion) === instalacionActual?.id);

  function abrirEliminarReserva(reserva) {
    setReservaActual(reserva);
    setEliminarReservaOpen(true);
  }

  async function handleEliminarReserva() {
    const { id } = reservaActual;
    setReservas((prev) => prev.filter((r) => r.id !== id));
    setEliminarReservaOpen(false);
    setReservaActual(null);
    try {
      await deleteReserva(instalacionActual.id, id);
    } catch { /* silently ignore */ }
  }

  // === Reserva desde detalle de instalación (inline) ===

  async function handleCrearReservaEnInstalacion(e) {
    e.preventDefault();
    const { nro_socio, fecha_reserva, hora_inicio, hora_fin } = formReserva;
    if (!nro_socio.trim()) { setErrReservaInline('El número de socio es obligatorio.'); return; }
    if (!fecha_reserva) { setErrReservaInline('La fecha es obligatoria.'); return; }
    if (!hora_inicio) { setErrReservaInline('La hora de inicio es obligatoria.'); return; }
    if (!hora_fin) { setErrReservaInline('La hora de fin es obligatoria.'); return; }
    if (hora_fin <= hora_inicio) { setErrReservaInline('La hora de fin debe ser posterior a la de inicio.'); return; }

    setLoadingReservaInline(true);
    setErrReservaInline('');
    let socio;
    try {
      socio = await getSocioByNroSocio(nro_socio);
    } catch {
      setErrReservaInline('No se encontró ningún socio con ese número.');
      setLoadingReservaInline(false);
      return;
    }
    setLoadingReservaInline(false);

    const tempId = genId();
    const nueva = {
      id: tempId,
      instalacion_id: instalacionActual.id,
      nro_socio: nro_socio.trim(),
      fecha_reserva,
      hora_inicio,
      hora_fin,
    };
    setReservas((prev) => [...prev, nueva]);
    setFormReserva(FORM_RESERVA_INICIAL);
    try {
      const created = await createReserva({
        id_socio: socio.id,
        id_instalacion: instalacionActual.id,
        fecha_reserva: nueva.fecha_reserva,
        hora_inicio: nueva.hora_inicio,
        hora_fin: nueva.hora_fin,
      });
      setReservas((prev) => prev.map((r) => r.id === tempId ? { ...r, id: created.id } : r));
    } catch {
      setReservas((prev) => prev.filter((r) => r.id !== tempId));
      setErrReservaInline('Error al crear la reserva. Intente nuevamente.');
    }
  }

  return (
    <div className="instalaciones-page">
      {/* ── Vista: Lista ── */}
      {vista === 'lista' && (
        <>
          <h1 className="instalaciones-title">Reservas e Instalaciones</h1>

          {/* Sección Instalaciones */}
          <div className="instalaciones-seccion-separator">
            <div className="instalaciones-seccion-header">
              <h2 className="instalaciones-seccion-title">Instalaciones</h2>
              {puedeCrearInstalacion && (
                <button className="instalaciones-btn-crear" onClick={() => setCrearInstalacionFormOpen(true)}>
                  <Plus size={15} aria-hidden="true" />
                  Nueva instalación
                </button>
              )}
            </div>

            {loadingInstalaciones ? (
              <div className="instalaciones-loading">
                <img src={logo} alt="" className="loading-logo" />
              </div>
            ) : instalaciones.length === 0 ? (
              <p className="instalaciones-empty">No hay instalaciones registradas.</p>
            ) : (
              <div className="instalaciones-table-wrapper">
                <table className="instalaciones-tabla">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Capacidad máxima</th>
                      <th>Valor/hora</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instalaciones.map((inst) => (
                      <tr
                        key={inst.id}
                        className="instalaciones-tr-clickable"
                        onClick={() => { setInstalacionActual(inst); setVista('detalle'); }}
                      >
                        <td>{inst.nombre}</td>
                        <td>{inst.tipo}</td>
                        <td>{inst.capacidad_maxima} personas</td>
                        <td>${inst.valor_hora}/h</td>
                        <td>
                          <span className={`instalaciones-badge ${inst.activa ? 'badge-activa' : 'badge-inactiva'}`}>
                            {inst.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sección Reservas */}
          <div className="instalaciones-seccion-separator">
            <div className="instalaciones-seccion-header">
              <h2 className="instalaciones-seccion-title">Reservas</h2>
              {puedeCrearReserva && (
                <button className="instalaciones-btn-crear" onClick={() => setCrearReservaFormOpen(true)}>
                  <Plus size={15} aria-hidden="true" />
                  Nueva reserva
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Vista: Detalle ── */}
      {vista === 'detalle' && instalacionActual && (
        <>
          <div className="instalaciones-nav">
            <button className="instalaciones-btn-volver" onClick={() => setVista('lista')}>
              <ChevronLeft size={16} aria-hidden="true" />
              Volver
            </button>
            <div className="instalaciones-nav-acciones">
              {puedeBorrarInstalacion && (
                <button className="instalaciones-btn-eliminar-inst" onClick={() => setEliminarInstalacionOpen(true)}>
                  Eliminar
                </button>
              )}
            </div>
          </div>

          <div className="instalaciones-card">
            <h2 className="instalaciones-card-nombre">{instalacionActual.nombre}</h2>
            <div className="instalaciones-card-datos">
              <div className="instalaciones-card-dato">
                <span className="instalaciones-card-label">Tipo</span>
                <span>{instalacionActual.tipo}</span>
              </div>
              <div className="instalaciones-card-dato">
                <span className="instalaciones-card-label">Capacidad máxima</span>
                <span>{instalacionActual.capacidad_maxima} personas</span>
              </div>
              <div className="instalaciones-card-dato">
                <span className="instalaciones-card-label">Valor por hora</span>
                <span>${instalacionActual.valor_hora}/h</span>
              </div>
              <div className="instalaciones-card-dato">
                <span className="instalaciones-card-label">Estado</span>
                <span className={`instalaciones-badge ${instalacionActual.activa ? 'badge-activa' : 'badge-inactiva'}`}>
                  {instalacionActual.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>

          <div className="instalaciones-reservas-section">
            <h3 className="instalaciones-reservas-title">Reservas</h3>

            {puedeCrearReserva && (
              <form className="instalaciones-reserva-form" onSubmit={handleCrearReservaEnInstalacion}>
                <div className="instalaciones-reserva-form-fields">
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="cr-socio">Nro. de socio</label>
                    <input
                      id="cr-socio"
                      className="modal-input"
                      type="text"
                      value={formReserva.nro_socio}
                      onChange={(e) => setFormReserva((p) => ({ ...p, nro_socio: e.target.value }))}
                      placeholder="Ej. 1234"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="cr-fecha">Fecha</label>
                    <input
                      id="cr-fecha"
                      className="modal-input"
                      type="date"
                      value={formReserva.fecha_reserva}
                      onChange={(e) => setFormReserva((p) => ({ ...p, fecha_reserva: e.target.value }))}
                    />
                  </div>
                  <div className="instalaciones-reserva-horas">
                    <div className="modal-field">
                      <label className="modal-label" htmlFor="cr-hora-ini">Hora inicio</label>
                      <input
                        id="cr-hora-ini"
                        className="modal-input"
                        type="time"
                        value={formReserva.hora_inicio}
                        onChange={(e) => setFormReserva((p) => ({ ...p, hora_inicio: e.target.value }))}
                      />
                    </div>
                    <div className="modal-field">
                      <label className="modal-label" htmlFor="cr-hora-fin">Hora fin</label>
                      <input
                        id="cr-hora-fin"
                        className="modal-input"
                        type="time"
                        value={formReserva.hora_fin}
                        onChange={(e) => setFormReserva((p) => ({ ...p, hora_fin: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                {errReservaInline && <p className="modal-error" role="alert">{errReservaInline}</p>}
                <div className="instalaciones-reserva-form-actions">
                  <button type="submit" className="instalaciones-btn-crear" disabled={loadingReservaInline}>
                    <Plus size={15} aria-hidden="true" />
                    {loadingReservaInline ? 'Buscando socio...' : 'Agregar reserva'}
                  </button>
                </div>
              </form>
            )}

            {reservasDeInstalacion.length === 0 ? (
              <p className="instalaciones-empty">No hay reservas para esta instalación.</p>
            ) : (
              <div className="instalaciones-table-wrapper">
                <table className="instalaciones-tabla">
                  <thead>
                    <tr>
                      <th>Nro. de socio</th>
                      <th>Fecha</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...reservasDeInstalacion]
                      .sort((a, b) =>
                        (a.fecha_reserva ?? a.fecha ?? '').localeCompare(b.fecha_reserva ?? b.fecha ?? '') ||
                        (a.hora_inicio ?? '').localeCompare(b.hora_inicio ?? '')
                      )
                      .map((r) => (
                        <tr key={r.id}>
                          <td>{r.nro_socio}</td>
                          <td>{r.fecha_reserva ?? r.fecha}</td>
                          <td>{r.hora_inicio}</td>
                          <td>{r.hora_fin}</td>
                          <td>
                            <div className="instalaciones-reserva-acciones">
                              {puedeBorrarReserva && (
                                <button
                                  className="instalaciones-btn-reserva-eliminar"
                                  onClick={() => abrirEliminarReserva(r)}
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Formularios multi-paso (overlay) ── */}
      {crearInstalacionFormOpen && (
        <CreateInstalacionForm
          onSuccess={handleInstalacionCreada}
          onCancel={() => setCrearInstalacionFormOpen(false)}
        />
      )}

      {crearReservaFormOpen && (
        <CreateReservaForm
          instalaciones={instalaciones}
          onSuccess={() => setCrearReservaFormOpen(false)}
          onCancel={() => setCrearReservaFormOpen(false)}
        />
      )}

      {/* ── Modal: Eliminar instalación ── */}
      {eliminarInstalacionOpen && instalacionActual && (
        <div className="modal-overlay" onClick={() => setEliminarInstalacionOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Eliminar instalación</h2>
            <p className="modal-confirmar-texto">
              ¿Estás seguro de que querés eliminar &ldquo;{instalacionActual.nombre}&rdquo;?
              También se eliminarán todas sus reservas.
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-button-cancel" onClick={() => setEliminarInstalacionOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="modal-button-danger" onClick={handleEliminarInstalacion}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Eliminar reserva ── */}
      {eliminarReservaOpen && reservaActual && (
        <div className="modal-overlay" onClick={() => setEliminarReservaOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Eliminar reserva</h2>
            <p className="modal-confirmar-texto">
              ¿Estás seguro de que querés eliminar esta reserva?
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-button-cancel" onClick={() => setEliminarReservaOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="modal-button-danger" onClick={handleEliminarReserva}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstalacionesPage;
