import { useState, useEffect } from 'react';
import { Plus, ChevronLeft } from 'lucide-react';
import { CreateInstalacionForm } from '../../components/createInstalacionForm/CreateInstalacionForm';
import { CreateReservaForm } from '../../components/createReservaForm/CreateReservaForm';
import './InstalacionesPage.css';

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function horariosSuperpuestos(ini1, fin1, ini2, fin2) {
  return ini1 < fin2 && fin1 > ini2;
}

function tieneConflicto(reservas, nueva, excluirId = null) {
  return reservas.some((r) => {
    if (r.id === excluirId) return false;
    if (r.fecha !== nueva.fecha) return false;
    return horariosSuperpuestos(r.hora_inicio, r.hora_fin, nueva.hora_inicio, nueva.hora_fin);
  });
}

const FORM_RESERVA_INICIAL = { titulo: '', fecha: '', hora_inicio: '', hora_fin: '', nombre_solicitante: '' };

function InstalacionesPage() {
  const [vista, setVista] = useState('lista');
  const [instalacionActual, setInstalacionActual] = useState(null);
  const [instalaciones, setInstalaciones] = useState([]);
  const [reservas, setReservas] = useState([]);

  // Formularios de creación (estilo multi-paso)
  const [crearInstalacionFormOpen, setCrearInstalacionFormOpen] = useState(false);
  const [crearReservaFormOpen, setCrearReservaFormOpen] = useState(false);

  // Modales simples para editar/eliminar instalaciones
  const [editarInstalacionOpen, setEditarInstalacionOpen] = useState(false);
  const [eliminarInstalacionOpen, setEliminarInstalacionOpen] = useState(false);

  // Modales simples para editar/eliminar reservas (en detalle)
  const [editarReservaOpen, setEditarReservaOpen] = useState(false);
  const [eliminarReservaOpen, setEliminarReservaOpen] = useState(false);
  const [reservaActual, setReservaActual] = useState(null);

  const [formInstalacion, setFormInstalacion] = useState({ nombre: '', capacidad_maxima: '', requiere_pago_extra: false });
  const [errInstalacion, setErrInstalacion] = useState('');
  const [formReserva, setFormReserva] = useState(FORM_RESERVA_INICIAL);
  const [errReservaInline, setErrReservaInline] = useState('');
  const [errReservaModal, setErrReservaModal] = useState('');

  const anyModalOpen =
    editarInstalacionOpen || eliminarInstalacionOpen ||
    editarReservaOpen || eliminarReservaOpen;

  useEffect(() => {
    if (!anyModalOpen) return;
    function handleKeyDown(e) {
      if (e.key !== 'Escape') return;
      if (editarInstalacionOpen) setEditarInstalacionOpen(false);
      else if (eliminarInstalacionOpen) setEliminarInstalacionOpen(false);
      else if (editarReservaOpen) setEditarReservaOpen(false);
      else if (eliminarReservaOpen) setEliminarReservaOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [anyModalOpen, editarInstalacionOpen, eliminarInstalacionOpen, editarReservaOpen, eliminarReservaOpen]);

  // === Instalaciones ===

  function handleInstalacionCreada(data) {
    setInstalaciones((prev) => [...prev, { id: genId(), ...data }]);
    setCrearInstalacionFormOpen(false);
  }

  function abrirEditarInstalacion() {
    setFormInstalacion({
      nombre: instalacionActual.nombre,
      capacidad_maxima: String(instalacionActual.capacidad_maxima),
      requiere_pago_extra: instalacionActual.requiere_pago_extra,
    });
    setErrInstalacion('');
    setEditarInstalacionOpen(true);
  }

  function handleEditarInstalacion(e) {
    e.preventDefault();
    if (!formInstalacion.nombre.trim()) {
      setErrInstalacion('El nombre es obligatorio.');
      return;
    }
    if (!formInstalacion.capacidad_maxima || Number(formInstalacion.capacidad_maxima) <= 0) {
      setErrInstalacion('La capacidad máxima es obligatoria y debe ser mayor a 0.');
      return;
    }
    const actualizada = {
      ...instalacionActual,
      nombre: formInstalacion.nombre.trim(),
      capacidad_maxima: Number(formInstalacion.capacidad_maxima),
      requiere_pago_extra: formInstalacion.requiere_pago_extra,
    };
    setInstalaciones((prev) => prev.map((i) => (i.id === actualizada.id ? actualizada : i)));
    setInstalacionActual(actualizada);
    setEditarInstalacionOpen(false);
  }

  function handleEliminarInstalacion() {
    setInstalaciones((prev) => prev.filter((i) => i.id !== instalacionActual.id));
    setReservas((prev) => prev.filter((r) => r.instalacion_id !== instalacionActual.id));
    setInstalacionActual(null);
    setVista('lista');
    setEliminarInstalacionOpen(false);
  }

  // === Reservas (en detalle de instalación) ===

  const reservasDeInstalacion = reservas.filter((r) => r.instalacion_id === instalacionActual?.id);

  function abrirEditarReserva(reserva) {
    setReservaActual(reserva);
    setFormReserva({
      titulo: reserva.titulo,
      fecha: reserva.fecha,
      hora_inicio: reserva.hora_inicio,
      hora_fin: reserva.hora_fin,
      nombre_solicitante: reserva.nombre_solicitante,
    });
    setErrReservaModal('');
    setEditarReservaOpen(true);
  }

  function handleEditarReserva(e) {
    e.preventDefault();
    const { titulo, fecha, hora_inicio, hora_fin, nombre_solicitante } = formReserva;
    if (!titulo.trim()) { setErrReservaModal('El título es obligatorio.'); return; }
    if (!fecha) { setErrReservaModal('La fecha es obligatoria.'); return; }
    if (!hora_inicio) { setErrReservaModal('La hora de inicio es obligatoria.'); return; }
    if (!hora_fin) { setErrReservaModal('La hora de fin es obligatoria.'); return; }
    if (hora_fin <= hora_inicio) { setErrReservaModal('La hora de fin debe ser posterior a la de inicio.'); return; }
    if (!nombre_solicitante.trim()) { setErrReservaModal('El nombre del solicitante es obligatorio.'); return; }
    const actualizada = {
      ...reservaActual,
      titulo: titulo.trim(),
      fecha,
      hora_inicio,
      hora_fin,
      nombre_solicitante: nombre_solicitante.trim(),
    };
    if (tieneConflicto(reservasDeInstalacion, actualizada, reservaActual.id)) {
      setErrReservaModal('Ya existe una reserva que se superpone en ese horario.');
      return;
    }
    setReservas((prev) => prev.map((r) => (r.id === actualizada.id ? actualizada : r)));
    setEditarReservaOpen(false);
    setReservaActual(null);
  }

  function abrirEliminarReserva(reserva) {
    setReservaActual(reserva);
    setEliminarReservaOpen(true);
  }

  function handleEliminarReserva() {
    setReservas((prev) => prev.filter((r) => r.id !== reservaActual.id));
    setEliminarReservaOpen(false);
    setReservaActual(null);
  }

  // === Reserva desde detalle de instalación (inline simple form) ===

  function handleCrearReservaEnInstalacion(e) {
    e.preventDefault();
    const { titulo, fecha, hora_inicio, hora_fin, nombre_solicitante } = formReserva;
    if (!titulo.trim()) { setErrReservaInline('El título es obligatorio.'); return; }
    if (!fecha) { setErrReservaInline('La fecha es obligatoria.'); return; }
    if (!hora_inicio) { setErrReservaInline('La hora de inicio es obligatoria.'); return; }
    if (!hora_fin) { setErrReservaInline('La hora de fin es obligatoria.'); return; }
    if (hora_fin <= hora_inicio) { setErrReservaInline('La hora de fin debe ser posterior a la de inicio.'); return; }
    if (!nombre_solicitante.trim()) { setErrReservaInline('El nombre del solicitante es obligatorio.'); return; }
    const nueva = {
      id: genId(),
      instalacion_id: instalacionActual.id,
      titulo: titulo.trim(),
      fecha,
      hora_inicio,
      hora_fin,
      nombre_solicitante: nombre_solicitante.trim(),
    };
    if (tieneConflicto(reservasDeInstalacion, nueva)) {
      setErrReservaInline('Ya existe una reserva que se superpone en ese horario.');
      return;
    }
    setReservas((prev) => [...prev, nueva]);
    setFormReserva(FORM_RESERVA_INICIAL);
    setErrReservaInline('');
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
              <button className="instalaciones-btn-crear" onClick={() => setCrearInstalacionFormOpen(true)}>
                <Plus size={15} aria-hidden="true" />
                Nueva instalación
              </button>
            </div>

            {instalaciones.length === 0 ? (
              <p className="instalaciones-empty">No hay instalaciones registradas.</p>
            ) : (
              <div className="instalaciones-table-wrapper">
                <table className="instalaciones-tabla">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Capacidad máxima</th>
                      <th>Pago extra</th>
                      <th>Reservas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instalaciones.map((inst) => {
                      const cantReservas = reservas.filter((r) => r.instalacion_id === inst.id).length;
                      return (
                        <tr
                          key={inst.id}
                          className="instalaciones-tr-clickable"
                          onClick={() => { setInstalacionActual(inst); setVista('detalle'); }}
                        >
                          <td>{inst.nombre}</td>
                          <td>{inst.capacidad_maxima} personas</td>
                          <td>
                            <span className={`instalaciones-badge ${inst.requiere_pago_extra ? 'badge-si' : 'badge-no'}`}>
                              {inst.requiere_pago_extra ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td>{cantReservas}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sección Reservas */}
          <div className="instalaciones-seccion-separator">
            <div className="instalaciones-seccion-header">
              <h2 className="instalaciones-seccion-title">Reservas</h2>
              <button className="instalaciones-btn-crear" onClick={() => setCrearReservaFormOpen(true)}>
                <Plus size={15} aria-hidden="true" />
                Nueva reserva
              </button>
            </div>
            <p className="instalaciones-empty instalaciones-placeholder">
              Las reservas se gestionan desde el detalle de cada instalación.
              Próximamente disponible de forma global.
            </p>
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
              <button className="instalaciones-btn-editar-inst" onClick={abrirEditarInstalacion}>
                Editar
              </button>
              <button className="instalaciones-btn-eliminar-inst" onClick={() => setEliminarInstalacionOpen(true)}>
                Eliminar
              </button>
            </div>
          </div>

          <div className="instalaciones-card">
            <h2 className="instalaciones-card-nombre">{instalacionActual.nombre}</h2>
            <div className="instalaciones-card-datos">
              <div className="instalaciones-card-dato">
                <span className="instalaciones-card-label">Capacidad máxima</span>
                <span>{instalacionActual.capacidad_maxima} personas</span>
              </div>
              <div className="instalaciones-card-dato">
                <span className="instalaciones-card-label">Pago extra</span>
                <span className={`instalaciones-badge ${instalacionActual.requiere_pago_extra ? 'badge-si' : 'badge-no'}`}>
                  {instalacionActual.requiere_pago_extra ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="instalaciones-reservas-section">
            <h3 className="instalaciones-reservas-title">Reservas</h3>

            {/* Formulario inline de nueva reserva en detalle */}
            <form className="instalaciones-reserva-form" onSubmit={handleCrearReservaEnInstalacion}>
              <div className="instalaciones-reserva-form-fields">
                <div className="modal-field">
                  <label className="modal-label" htmlFor="cr-titulo">Título</label>
                  <input
                    id="cr-titulo"
                    className="modal-input"
                    type="text"
                    value={formReserva.titulo}
                    onChange={(e) => setFormReserva((p) => ({ ...p, titulo: e.target.value }))}
                    placeholder="Descripción de la reserva"
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="cr-solicitante">Solicitante</label>
                  <input
                    id="cr-solicitante"
                    className="modal-input"
                    type="text"
                    value={formReserva.nombre_solicitante}
                    onChange={(e) => setFormReserva((p) => ({ ...p, nombre_solicitante: e.target.value }))}
                    placeholder="Nombre y apellido"
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="cr-fecha">Fecha</label>
                  <input
                    id="cr-fecha"
                    className="modal-input"
                    type="date"
                    value={formReserva.fecha}
                    onChange={(e) => setFormReserva((p) => ({ ...p, fecha: e.target.value }))}
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
                <button type="submit" className="instalaciones-btn-crear">
                  <Plus size={15} aria-hidden="true" />
                  Agregar reserva
                </button>
              </div>
            </form>

            {reservasDeInstalacion.length === 0 ? (
              <p className="instalaciones-empty">No hay reservas para esta instalación.</p>
            ) : (
              <div className="instalaciones-table-wrapper">
                <table className="instalaciones-tabla">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Fecha</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Solicitante</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...reservasDeInstalacion]
                      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio))
                      .map((r) => (
                        <tr key={r.id}>
                          <td>{r.titulo}</td>
                          <td>{r.fecha}</td>
                          <td>{r.hora_inicio}</td>
                          <td>{r.hora_fin}</td>
                          <td>{r.nombre_solicitante}</td>
                          <td>
                            <div className="instalaciones-reserva-acciones">
                              <button
                                className="instalaciones-btn-reserva-editar"
                                onClick={() => abrirEditarReserva(r)}
                              >
                                Editar
                              </button>
                              <button
                                className="instalaciones-btn-reserva-eliminar"
                                onClick={() => abrirEliminarReserva(r)}
                              >
                                Eliminar
                              </button>
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
          onSuccess={() => setCrearReservaFormOpen(false)}
          onCancel={() => setCrearReservaFormOpen(false)}
        />
      )}

      {/* ── Modal: Editar instalación ── */}
      {editarInstalacionOpen && (
        <div className="modal-overlay" onClick={() => setEditarInstalacionOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Editar instalación</h2>
            <form onSubmit={handleEditarInstalacion}>
              <div className="modal-field">
                <label className="modal-label" htmlFor="ei-nombre">Nombre</label>
                <input
                  id="ei-nombre"
                  className="modal-input"
                  type="text"
                  value={formInstalacion.nombre}
                  onChange={(e) => setFormInstalacion((p) => ({ ...p, nombre: e.target.value }))}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="ei-capacidad">Capacidad máxima</label>
                <input
                  id="ei-capacidad"
                  className="modal-input"
                  type="number"
                  min="1"
                  value={formInstalacion.capacidad_maxima}
                  onChange={(e) => setFormInstalacion((p) => ({ ...p, capacidad_maxima: e.target.value }))}
                />
              </div>
              <div className="modal-field modal-field-checkbox">
                <input
                  id="ei-pago"
                  type="checkbox"
                  checked={formInstalacion.requiere_pago_extra}
                  onChange={(e) => setFormInstalacion((p) => ({ ...p, requiere_pago_extra: e.target.checked }))}
                />
                <label className="modal-label" htmlFor="ei-pago">Requiere pago extra</label>
              </div>
              {errInstalacion && <p className="modal-error" role="alert">{errInstalacion}</p>}
              <div className="modal-actions">
                <button type="button" className="modal-button-cancel" onClick={() => setEditarInstalacionOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="modal-button-submit">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
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

      {/* ── Modal: Editar reserva ── */}
      {editarReservaOpen && reservaActual && (
        <div className="modal-overlay" onClick={() => setEditarReservaOpen(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Editar reserva</h2>
            <form onSubmit={handleEditarReserva}>
              <div className="modal-field">
                <label className="modal-label" htmlFor="er-titulo">Título</label>
                <input
                  id="er-titulo"
                  className="modal-input"
                  type="text"
                  value={formReserva.titulo}
                  onChange={(e) => setFormReserva((p) => ({ ...p, titulo: e.target.value }))}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="er-solicitante">Nombre del solicitante</label>
                <input
                  id="er-solicitante"
                  className="modal-input"
                  type="text"
                  value={formReserva.nombre_solicitante}
                  onChange={(e) => setFormReserva((p) => ({ ...p, nombre_solicitante: e.target.value }))}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="er-fecha">Fecha</label>
                <input
                  id="er-fecha"
                  className="modal-input"
                  type="date"
                  value={formReserva.fecha}
                  onChange={(e) => setFormReserva((p) => ({ ...p, fecha: e.target.value }))}
                />
              </div>
              <div className="modal-grid-2">
                <div className="modal-field">
                  <label className="modal-label" htmlFor="er-hora-ini">Hora inicio</label>
                  <input
                    id="er-hora-ini"
                    className="modal-input"
                    type="time"
                    value={formReserva.hora_inicio}
                    onChange={(e) => setFormReserva((p) => ({ ...p, hora_inicio: e.target.value }))}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="er-hora-fin">Hora fin</label>
                  <input
                    id="er-hora-fin"
                    className="modal-input"
                    type="time"
                    value={formReserva.hora_fin}
                    onChange={(e) => setFormReserva((p) => ({ ...p, hora_fin: e.target.value }))}
                  />
                </div>
              </div>
              {errReservaModal && <p className="modal-error" role="alert">{errReservaModal}</p>}
              <div className="modal-actions">
                <button type="button" className="modal-button-cancel" onClick={() => setEditarReservaOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="modal-button-submit">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Eliminar reserva ── */}
      {eliminarReservaOpen && reservaActual && (
        <div className="modal-overlay" onClick={() => setEliminarReservaOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Eliminar reserva</h2>
            <p className="modal-confirmar-texto">
              ¿Estás seguro de que querés eliminar la reserva &ldquo;{reservaActual.titulo}&rdquo;?
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
