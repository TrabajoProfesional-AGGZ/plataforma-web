import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { CreateInstalacionForm } from '../../components/createInstalacionForm/CreateInstalacionForm';
import { CreateReservaForm } from '../../components/createReservaForm/CreateReservaForm';
import ConfirmDeleteModal from '../../components/confirmDeleteModal/ConfirmDeleteModal';
import { getInstalaciones, createInstalacion, deleteInstalacion } from '../../services/instalacionesService';
import { getReservasPorInstalacion, getReservasPorSocio, deleteReserva, getReservasHistoricasPorInstalacion } from '../../services/reservasService';
import { getSocios } from '../../services/sociosService';
import { usePermiso } from '../../hooks/usePermiso';
import { usePaginacion } from '../../hooks/usePaginacion';
import { VerSocioModal } from '../../components/verSocioModal/VerSocioModal';
import EstadoBadge from '../../components/badge/EstadoBadge';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import EmptyState from '../../components/feedback/EmptyState';
import { Paginacion } from '../../components/paginacion/Paginacion';
import { handleActivateKey } from '../../utils/a11y';
import { useTheme } from '../../hooks/useTheme';
import './InstalacionesPage.css';
import '../../styles/ListPage.css';
import '../../styles/SocioCard.css';
import '../../styles/PageTableHeader.css';
import '../../styles/ListDetailShared.css';

function mensajeError(err, fallback) {
  return err?.message === 'servicio-no-disponible'
    ? 'El servicio no está disponible. Intentá de nuevo más tarde.'
    : fallback;
}

function InstalacionesPage() {
  const { logoSocio: logo } = useTheme();
  const location = useLocation();
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
  const [error, setError] = useState('');

  const [crearInstalacionFormOpen, setCrearInstalacionFormOpen] = useState(false);
  const [crearReservaFormOpen, setCrearReservaFormOpen] = useState(false);

  const [eliminarInstalacionOpen, setEliminarInstalacionOpen] = useState(false);
  const [eliminarReservaOpen, setEliminarReservaOpen] = useState(false);
  const [reservaActual, setReservaActual] = useState(null);
  const [guardandoInstalacion, setGuardandoInstalacion] = useState(false);
  const [guardandoReserva, setGuardandoReserva] = useState(false);

  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroNroSocio, setFiltroNroSocio] = useState('');
  const [reservasBusqueda, setReservasBusqueda] = useState(null);
  const [reservasVisible, setReservasVisible] = useState(true);
  const [verSocioData, setVerSocioData] = useState(null);
  const [verSocioOpen, setVerSocioOpen] = useState(false);
  const [vistaReservas, setVistaReservas] = useState('activas');
  const [reservasHistoricas, setReservasHistoricas] = useState([]);

  function cargarInstalaciones() {
    setLoadingInstalaciones(true);
    setError('');
    getInstalaciones()
      .then((data) => setInstalaciones(data))
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar las instalaciones.')))
      .finally(() => setLoadingInstalaciones(false));
  }

  useEffect(() => {
    if (!puedeVerInstalaciones) return;
    cargarInstalaciones();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function cargarReservas(instalacionId) {
    const [reservasData, sociosData] = await Promise.all([getReservasPorInstalacion(instalacionId), getSocios()]);
    const socioMap = Object.fromEntries(sociosData.map((s) => [s.id, s]));
    setReservas(reservasData.map((r) => ({
      ...r,
      socios: (r.socios ?? []).map((s) => socioMap[s.id] ?? s),
    })));
    setReservasBusqueda(null);
    setFiltroNroSocio('');
    resetPaginaReservas();
  }

  async function buscarPorSocio(nroSocio) {
    if (!nroSocio.trim()) {
      setReservasBusqueda(null);
      resetPaginaReservas();
      return;
    }
    const todas = await getReservasPorSocio(nroSocio.trim());
    const deEstaInstalacion = todas.filter((r) => (r.id_instalacion ?? r.instalacion_id) === instalacionActual?.id);
    const sociosData = await getSocios();
    const socioMap = Object.fromEntries(sociosData.map((s) => [s.id, s]));
    setReservasBusqueda(deEstaInstalacion.map((r) => ({
      ...r,
      socios: (r.socios ?? []).map((s) => socioMap[s.id] ?? s),
    })));
    resetPaginaReservas();
  }

  useEffect(() => {
    if (!instalacionActual || !puedeVerReservas) return;
    setVistaReservas('activas');
    setReservasHistoricas([]);
    cargarReservas(instalacionActual.id).catch(() => {});
  }, [instalacionActual]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!location.state?.instalacionId || instalaciones.length === 0) return;
    const found = instalaciones.find((i) => i.id === location.state.instalacionId);
    if (found) { setInstalacionActual(found); setVista('detalle'); }
  }, [instalaciones]); // eslint-disable-line react-hooks/exhaustive-deps

  // === Instalaciones ===

  async function handleInstalacionCreada(data) {
    setCrearInstalacionFormOpen(false);
    const tempId = `temp-${Date.now()}`;
    setInstalaciones((prev) => [...prev, { ...data, id: tempId }]);
    try {
      const created = await createInstalacion(data);
      setInstalaciones((prev) =>
        prev.map((i) => (i.id === tempId ? { ...data, ...created } : i))
      );
    } catch (err) {
      setInstalaciones((prev) => prev.filter((i) => i.id !== tempId));
      setError(mensajeError(err, 'No se pudo crear la instalación.'));
    }
  }

  async function handleEliminarInstalacion() {
    if (guardandoInstalacion) return;
    setGuardandoInstalacion(true);
    const id = instalacionActual.id;
    setInstalaciones((prev) => prev.filter((i) => i.id !== id));
    setReservas((prev) => prev.filter((r) => r.instalacion_id !== id));
    setInstalacionActual(null);
    setVista('lista');
    setEliminarInstalacionOpen(false);
    try {
      await deleteInstalacion(id);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo eliminar la instalación.'));
    } finally {
      setGuardandoInstalacion(false);
    }
  }

  // === Instalaciones filtradas ===

  const tiposDisponibles = [...new Set(instalaciones.map((i) => i.tipo))].sort((a, b) => a.localeCompare(b));
  const instalacionesFiltradas = filtroTipo
    ? instalaciones.filter((i) => i.tipo === filtroTipo)
    : instalaciones;
  const instalacionesOrdenadas = [...instalacionesFiltradas].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const {
    pagina: paginaInstalaciones,
    totalPaginas: totalPaginasInstalaciones,
    listaPaginada: instalacionesPaginadas,
    irAPagina: irAPaginaInstalaciones,
    resetPagina: resetPaginaInstalaciones,
  } = usePaginacion(instalacionesOrdenadas, 10);

  useEffect(() => {
    resetPaginaInstalaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipo, instalaciones]);

  // === Reservas (en detalle de instalación) ===

  const reservasDeInstalacion = reservas.filter((r) => (r.instalacion_id ?? r.id_instalacion) === instalacionActual?.id);

  const baseReservas = reservasBusqueda ?? reservasDeInstalacion;
  const reservasFiltradas = filtroFecha
    ? baseReservas.filter((r) => (r.fecha_reserva ?? r.fecha) === filtroFecha)
    : baseReservas;

  const reservasHistoricasFiltradas = filtroNroSocio.trim()
    ? reservasHistoricas.filter((r) => r.socios?.some((s) => String(s.nro_socio) === filtroNroSocio.trim()))
    : reservasHistoricas;

  const reservasVisiblesActuales = vistaReservas === 'activas' ? reservasFiltradas : reservasHistoricasFiltradas;
  const reservasOrdenadasActuales = [...reservasVisiblesActuales].sort((a, b) =>
    (a.fecha_reserva ?? a.fecha ?? '').localeCompare(b.fecha_reserva ?? b.fecha ?? '') ||
    (a.hora_inicio ?? '').localeCompare(b.hora_inicio ?? '')
  );
  const {
    pagina: paginaReservas,
    totalPaginas: totalPaginasReservas,
    listaPaginada: reservasPaginadas,
    irAPagina: irAPaginaReservas,
    resetPagina: resetPaginaReservas,
  } = usePaginacion(reservasOrdenadasActuales, 10);

  function abrirEliminarReserva(reserva) {
    setReservaActual(reserva);
    setEliminarReservaOpen(true);
  }

  async function handleEliminarReserva() {
    if (guardandoReserva) return;
    setGuardandoReserva(true);
    const { id } = reservaActual;
    const anterior = reservas;
    setReservas((prev) => prev.map((r) => r.id === id ? { ...r, estado: 'Cancelada' } : r));
    setEliminarReservaOpen(false);
    setReservaActual(null);
    try {
      await deleteReserva(instalacionActual.id, id);
    } catch (err) {
      setReservas(anterior);
      setError(mensajeError(err, 'No se pudo eliminar la reserva.'));
    } finally {
      setGuardandoReserva(false);
    }
  }

  async function cargarReservasHistoricas(instalacionId) {
    const [reservasData, sociosData] = await Promise.all([
      getReservasHistoricasPorInstalacion(instalacionId),
      getSocios(),
    ]);
    const socioMap = Object.fromEntries(sociosData.map((s) => [s.id, s]));
    setReservasHistoricas(reservasData.map((r) => ({
      ...r,
      socios: (r.socios ?? []).map((s) => socioMap[s.id] ?? s),
    })));
    resetPaginaReservas();
  }

  function abrirVerSocio(socio) {
    setVerSocioData(socio);
    setVerSocioOpen(true);
  }

  // === Funciones de Renderizado Auxiliares ===

  const renderContenidoInstalaciones = () => {
    if (loadingInstalaciones) {
      return (
        <div className="list-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      );
    }
    if (error && instalaciones.length === 0) {
      return <ErrorBanner mensaje={error} onReintentar={cargarInstalaciones} />;
    }
    if (instalaciones.length === 0) {
      return <EmptyState mensaje="No hay instalaciones registradas." />;
    }
    if (instalacionesFiltradas.length === 0) {
      return <EmptyState mensaje="No hay instalaciones del tipo seleccionado." />;
    }

    return (
      <div className="instalaciones-table-wrapper">
        <table className="instalaciones-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Capacidad máxima</th>
              <th>Valor/Turno</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {instalacionesPaginadas.map((inst) => {
              const verDetalle = () => { setInstalacionActual(inst); setVista('detalle'); };
              return (
              <tr
                key={inst.id}
                className="instalaciones-tr-clickable"
                tabIndex={0}
                role="button"
                aria-label={`Ver detalle de ${inst.nombre}`}
                onClick={verDetalle}
                onKeyDown={handleActivateKey(verDetalle)}
              >
                <td>{inst.nombre}</td>
                <td>{inst.tipo}</td>
                <td>{inst.capacidad_maxima} personas</td>
                <td>${inst.valor_turno}/turno</td>
                <td>
                  <EstadoBadge variant={inst.activa ? 'success' : 'neutral'}>
                    {inst.activa ? 'Activa' : 'Inactiva'}
                  </EstadoBadge>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        <Paginacion
          pagina={paginaInstalaciones}
          totalPaginas={totalPaginasInstalaciones}
          onCambiarPagina={irAPaginaInstalaciones}
        />
      </div>
    );
  };

  const renderTablaReservas = (datos, { mostrarEstado = false, mostrarAcciones = false, mensajeVacio = null } = {}) => {
    if (datos.length === 0) {
      return (
        <EmptyState
          mensaje={mensajeVacio ?? (filtroFecha && reservasDeInstalacion.length > 0
            ? 'No hay reservas para la fecha seleccionada.'
            : 'No hay reservas para esta instalación.')}
        />
      );
    }

    return (
      <div className="instalaciones-table-wrapper">
        <table className="instalaciones-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Socio(s)</th>
              <th>Fecha</th>
              <th>Inicio</th>
              <th>Fin</th>
              {mostrarEstado && <th>Estado</th>}
              {mostrarAcciones && puedeBorrarReserva && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {reservasPaginadas.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>
                  <div className="reserva-socios-list">
                    {(r.socios ?? []).map((socio) => (
                      <button
                        key={socio.id}
                        type="button"
                        className="nro-socio-link"
                        onClick={() => abrirVerSocio(socio)}
                      >
                        {socio.nro_socio}
                      </button>
                    ))}
                  </div>
                </td>
                <td>{r.fecha_reserva ?? r.fecha}</td>
                <td>{r.hora_inicio?.slice(0, 5)}</td>
                <td>{r.hora_fin?.slice(0, 5)}</td>
                {mostrarEstado && <td>{r.estado}</td>}
                {mostrarAcciones && puedeBorrarReserva && (
                  <td>
                    <div className="instalaciones-reserva-acciones">
                      {r.estado !== 'Cancelada' && (
                        <button
                          className="instalaciones-btn-reserva-eliminar"
                          onClick={() => abrirEliminarReserva(r)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <Paginacion
          pagina={paginaReservas}
          totalPaginas={totalPaginasReservas}
          onCambiarPagina={irAPaginaReservas}
        />
      </div>
    );
  };

  const renderModalVerSocio = () => {
    if (!verSocioOpen || !verSocioData) return null;
    return <VerSocioModal socio={verSocioData} onClose={() => setVerSocioOpen(false)} />;
  };

  return (
    <div className="instalaciones-page">
      {/* ── Vista: Lista ── */}
      {vista === 'lista' && (
        <>
          <h1 className="instalaciones-title">Reservas e Instalaciones</h1>

          <div className="instalaciones-seccion-separator">
            <div className="instalaciones-seccion-header">
              <div className="instalaciones-seccion-toolbar">
                <div>
                  {tiposDisponibles.length > 0 && (
                    <select
                      className="instalaciones-filtro-tipo"
                      value={filtroTipo}
                      onChange={(e) => setFiltroTipo(e.target.value)}
                      aria-label="Filtrar por tipo"
                    >
                      <option value="">Todos los tipos</option>
                      {tiposDisponibles.map((tipo) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  )}
                </div>
                {puedeCrearInstalacion && (
                  <button className="instalaciones-btn-crear" onClick={() => setCrearInstalacionFormOpen(true)}>
                    <Plus size={15} aria-hidden="true" />
                    Nueva instalación
                  </button>
                )}
              </div>
            </div>

            {error && instalaciones.length > 0 && <ErrorBanner mensaje={error} />}
            {renderContenidoInstalaciones()}
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
          </div>

          <div className="instalaciones-detalle-content">
            <h1 className="instalaciones-detalle-nombre">{instalacionActual.nombre}</h1>

            <div className="instalaciones-detalle-card">
              {[
                { label: 'Tipo', value: instalacionActual.tipo },
                { label: 'Capacidad máxima', value: `${instalacionActual.capacidad_maxima} personas` },
                { label: 'Valor por turno', value: `$${instalacionActual.valor_turno}/turno` },
                { label: 'Duración del turno', value: `${instalacionActual.duracion_turno} minutos` },
                { label: 'Cancelación', value: `Hasta ${instalacionActual.tiempo_minimo_cancelacion} minutos antes del turno`},
                {
                  label: 'Estado',
                  value: instalacionActual.activa ? 'Activa' : 'Inactiva',
                  color: instalacionActual.activa ? 'var(--status-success-border)' : 'var(--color-text-secondary)',
                },
              ].map((field, i, arr) => (
                <div
                  key={field.label}
                  className="instalaciones-detalle-row"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-bg)' : 'none' }}
                >
                  <span className="instalaciones-detalle-row-label">{field.label}</span>
                  <span
                    className="instalaciones-detalle-row-value"
                    style={{ color: field.color ?? 'var(--color-text-primary)' }}
                  >
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="detalle-id">ID: {instalacionActual.id}</p>
          </div>

          {puedeBorrarInstalacion && (
            <div className="instalaciones-agregar-reserva">
              <button className="instalaciones-btn-eliminar-inst" onClick={() => setEliminarInstalacionOpen(true)}>
                Eliminar
              </button>
            </div>
          )}

          <div className="instalaciones-reservas-section">
            <h3 className="instalaciones-reservas-title">Reservas</h3>
            <div className="instalaciones-reservas-controles">
              <div className="instalaciones-reservas-controles-izq">
                {puedeVerReservas && reservasDeInstalacion.length > 0 && (
                  <input
                    type="date"
                    className="instalaciones-filtro-fecha"
                    value={filtroFecha}
                    onChange={(e) => { setFiltroFecha(e.target.value); resetPaginaReservas(); }}
                    aria-label="Filtrar por fecha"
                  />
                )}
                {puedeVerReservas && (
                  <input
                    type="text"
                    className="instalaciones-filtro-fecha"
                    placeholder="Filtrar por N° de socio"
                    value={filtroNroSocio}
                    aria-label="Filtrar por número de socio"
                    onChange={(e) => {
                      const val = e.target.value;
                      setFiltroNroSocio(val);
                      if (!val.trim()) setReservasBusqueda(null);
                      resetPaginaReservas();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && vistaReservas === 'activas') {
                        buscarPorSocio(filtroNroSocio).catch(() => {});
                      }
                    }}
                  />
                )}
                <button
                  className="instalaciones-btn-toggle"
                  onClick={() => setReservasVisible((v) => !v)}
                  aria-label={reservasVisible ? 'Ocultar reservas' : 'Mostrar reservas'}
                >
                  {reservasVisible ? (
                    <><ChevronUp size={15} aria-hidden="true" /> Ocultar reservas</>
                  ) : (
                    <><ChevronDown size={15} aria-hidden="true" /> Mostrar reservas</>
                  )}
                </button>
              </div>
              {puedeCrearReserva && (
                <button className="instalaciones-btn-crear" onClick={() => setCrearReservaFormOpen(true)}>
                  <Plus size={15} aria-hidden="true" />
                  Agregar reserva
                </button>
              )}
            </div>

            {reservasVisible && (
              <>
                {vistaReservas === 'activas'
                  ? renderTablaReservas(reservasFiltradas, { mostrarEstado: true, mostrarAcciones: true })
                  : renderTablaReservas(reservasHistoricasFiltradas, { mostrarEstado: true, mensajeVacio: 'No hay reservas históricas para esta instalación.' })}
                {puedeVerReservas && (
                  <div className="instalaciones-vista-toggle">
                    {vistaReservas === 'activas' ? (
                      <button
                        className="instalaciones-btn-vista-toggle"
                        onClick={() => {
                          setFiltroNroSocio('');
                          setReservasBusqueda(null);
                          cargarReservasHistoricas(instalacionActual.id).then(() => setVistaReservas('historicas')).catch(() => {});
                        }}
                      >
                        Ver reservas históricas
                      </button>
                    ) : (
                      <button
                        className="instalaciones-btn-vista-toggle"
                        onClick={() => {
                          setFiltroNroSocio('');
                          setReservasBusqueda(null);
                          setVistaReservas('activas');
                          resetPaginaReservas();
                        }}
                      >
                        Ver reservas activas
                      </button>
                    )}
                  </div>
                )}
              </>
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

      {crearReservaFormOpen && instalacionActual && (
        <CreateReservaForm
          instalaciones={[instalacionActual]}
          instalacionPreseleccionada={instalacionActual.id}
          onSuccess={async () => {
            setCrearReservaFormOpen(false);
            await cargarReservas(instalacionActual.id);
          }}
          onCancel={() => setCrearReservaFormOpen(false)}
        />
      )}

      <ConfirmDeleteModal
        open={eliminarInstalacionOpen && !!instalacionActual}
        titulo="Eliminar instalación"
        mensaje={`¿Estás seguro de que querés eliminar "${instalacionActual?.nombre}"? También se eliminarán todas sus reservas.`}
        onConfirm={handleEliminarInstalacion}
        guardando={guardandoInstalacion}
        onCancel={() => setEliminarInstalacionOpen(false)}
      />

      <ConfirmDeleteModal
        open={eliminarReservaOpen && !!reservaActual}
        titulo="Eliminar reserva"
        mensaje="¿Estás seguro de que querés eliminar esta reserva?"
        onConfirm={handleEliminarReserva}
        guardando={guardandoReserva}
        onCancel={() => setEliminarReservaOpen(false)}
      />

      {/* ── Modal: Ver socio ── */}
      {renderModalVerSocio()}
    </div>
  );
}

export default InstalacionesPage;
