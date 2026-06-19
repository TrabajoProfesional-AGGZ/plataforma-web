import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { CreateInstalacionForm } from '../../components/createInstalacionForm/CreateInstalacionForm';
import { CreateReservaForm } from '../../components/createReservaForm/CreateReservaForm';
import ConfirmDeleteModal from '../../components/confirmDeleteModal/ConfirmDeleteModal';
import { getInstalaciones, createInstalacion, deleteInstalacion } from '../../services/instalacionesService';
import { getReservasPorInstalacion, getReservasPorSocio, deleteReserva } from '../../services/reservasService';
import { getSocios } from '../../services/sociosService';
import { usePermiso } from '../../hooks/usePermiso';
import { estadoConfig } from '../../utils/estadoConfig';
import logo from '../../assets/logo_socio.png';
import './InstalacionesPage.css';
import '../../styles/ListPage.css';
import '../../styles/SocioCard.css';
import '../../styles/PageTableHeader.css';
import '../../styles/ListDetailShared.css';

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

  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroNroSocio, setFiltroNroSocio] = useState('');
  const [reservasBusqueda, setReservasBusqueda] = useState(null);
  const [reservasVisible, setReservasVisible] = useState(true);
  const [verSocioData, setVerSocioData] = useState(null);
  const [verSocioOpen, setVerSocioOpen] = useState(false);

  useEffect(() => {
    if (!puedeVerInstalaciones) return;
    setLoadingInstalaciones(true);
    getInstalaciones()
      .then((data) => setInstalaciones(data))
      .catch(() => {})
      .finally(() => setLoadingInstalaciones(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function cargarReservas(instalacionId) {
    const [reservasData, sociosData] = await Promise.all([getReservasPorInstalacion(instalacionId), getSocios()]);
    const socioMap = Object.fromEntries(sociosData.map((s) => [s.id, s]));
    setReservas(reservasData.map((r) => ({
      ...r,
      nro_socio: r.nro_socio ?? socioMap[r.id_socio]?.nro_socio ?? r.id_socio,
      socio: socioMap[r.id_socio] ?? null,
    })));
    setReservasBusqueda(null);
    setFiltroNroSocio('');
  }

  async function buscarPorSocio(nroSocio) {
    if (!nroSocio.trim()) {
      setReservasBusqueda(null);
      return;
    }
    const todas = await getReservasPorSocio(nroSocio.trim());
    const deEstaInstalacion = todas.filter((r) => (r.id_instalacion ?? r.instalacion_id) === instalacionActual?.id);
    const sociosData = await getSocios();
    const socioMap = Object.fromEntries(sociosData.map((s) => [s.id, s]));
    setReservasBusqueda(deEstaInstalacion.map((r) => ({
      ...r,
      nro_socio: r.nro_socio ?? socioMap[r.id_socio]?.nro_socio ?? r.id_socio,
      socio: socioMap[r.id_socio] ?? null,
    })));
  }

  useEffect(() => {
    if (!instalacionActual || !puedeVerReservas) return;
    cargarReservas(instalacionActual.id).catch(() => {});
  }, [instalacionActual]); // eslint-disable-line react-hooks/exhaustive-deps

  const anyModalOpen = eliminarInstalacionOpen || eliminarReservaOpen || verSocioOpen;

  useEffect(() => {
    if (!anyModalOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        // Al setear todos en false nos ahorramos los if/else anidados
        setEliminarInstalacionOpen(false);
        setEliminarReservaOpen(false);
        setVerSocioOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [anyModalOpen]);

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

  // === Instalaciones filtradas ===

  const tiposDisponibles = [...new Set(instalaciones.map((i) => i.tipo))].sort((a, b) => a.localeCompare(b));
  const instalacionesFiltradas = filtroTipo
    ? instalaciones.filter((i) => i.tipo === filtroTipo)
    : instalaciones;

  // === Reservas (en detalle de instalación) ===

  const reservasDeInstalacion = reservas.filter((r) => (r.instalacion_id ?? r.id_instalacion) === instalacionActual?.id);

  const baseReservas = reservasBusqueda ?? reservasDeInstalacion;
  const reservasFiltradas = filtroFecha
    ? baseReservas.filter((r) => (r.fecha_reserva ?? r.fecha) === filtroFecha)
    : baseReservas;

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

  function abrirVerSocio(socio) {
    setVerSocioData(socio);
    setVerSocioOpen(true);
  }

  // === Funciones de Renderizado Auxiliares ===

  const renderContenidoInstalaciones = () => {
    if (loadingInstalaciones) {
      return (
        <div className="instalaciones-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      );
    }
    if (instalaciones.length === 0) {
      return <p className="instalaciones-empty">No hay instalaciones registradas.</p>;
    }
    if (instalacionesFiltradas.length === 0) {
      return <p className="instalaciones-empty">No hay instalaciones del tipo seleccionado.</p>;
    }

    return (
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
            {instalacionesFiltradas.map((inst) => (
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
    );
  };

  const renderTablaReservas = () => {
    if (reservasFiltradas.length === 0) {
      return (
        <p className="instalaciones-empty">
          {filtroFecha && reservasDeInstalacion.length > 0
            ? 'No hay reservas para la fecha seleccionada.'
            : 'No hay reservas para esta instalación.'}
        </p>
      );
    }

    const reservasOrdenadas = [...reservasFiltradas].sort((a, b) =>
      (a.fecha_reserva ?? a.fecha ?? '').localeCompare(b.fecha_reserva ?? b.fecha ?? '') ||
      (a.hora_inicio ?? '').localeCompare(b.hora_inicio ?? '')
    );

    return (
      <div className="instalaciones-table-wrapper">
        <table className="instalaciones-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nro. de socio</th>
              <th>Fecha</th>
              <th>Inicio</th>
              <th>Fin</th>
              {puedeBorrarReserva && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {reservasOrdenadas.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>
                  {r.socio ? (
                    <button
                      type="button"
                      className="instalaciones-nro-socio-link"
                      onClick={() => abrirVerSocio(r.socio)}
                    >
                      {r.nro_socio}
                    </button>
                  ) : (
                    r.nro_socio
                  )}
                </td>
                <td>{r.fecha_reserva ?? r.fecha}</td>
                <td>{r.hora_inicio}</td>
                <td>{r.hora_fin}</td>
                {puedeBorrarReserva && (
                  <td>
                    <div className="instalaciones-reserva-acciones">
                      <button
                        className="instalaciones-btn-reserva-eliminar"
                        onClick={() => abrirEliminarReserva(r)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderModalVerSocio = () => {
    if (!verSocioOpen || !verSocioData) return null;
    const cfg = estadoConfig(verSocioData.estado);
    
    return (
      <div 
        className="modal-overlay" 
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) setVerSocioOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === 'Escape' || e.key === 'Enter')) {
            setVerSocioOpen(false);
          }
        }}
      >
        <div className="instalaciones-ver-socio-wrapper">
          <div className="socios-card" style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
            <div className="socios-card-inner">
              <img src={cfg.logo} alt="" className="socios-card-logo" />
              <div className="socios-card-data">
                <div className="socios-card-row">
                  <span className="socios-card-label">N° Socio</span>
                  <span>{verSocioData.nro_socio}</span>
                </div>
                <div className="socios-card-row">
                  <span className="socios-card-label">Apellido y nombre</span>
                  <span>{verSocioData.apellido} {verSocioData.nombre}</span>
                </div>
                {verSocioData.nro_documento && (
                  <div className="socios-card-row">
                    <span className="socios-card-label">DNI</span>
                    <span>{verSocioData.nro_documento}</span>
                  </div>
                )}
                {verSocioData.fecha_nacimiento && (
                  <div className="socios-card-row">
                    <span className="socios-card-label">Fecha de nacimiento</span>
                    <span>{verSocioData.fecha_nacimiento}</span>
                  </div>
                )}
                {verSocioData.email && (
                  <div className="socios-card-row">
                    <span className="socios-card-label">Email</span>
                    <span>{verSocioData.email}</span>
                  </div>
                )}
                {verSocioData.telefono && (
                  <div className="socios-card-row">
                    <span className="socios-card-label">Teléfono</span>
                    <span>{verSocioData.telefono}</span>
                  </div>
                )}
                {verSocioData.categoria && (
                  <div className="socios-card-row">
                    <span className="socios-card-label">Categoría</span>
                    <span>{verSocioData.categoria?.nombre ?? verSocioData.categoria}</span>
                  </div>
                )}
                {verSocioData.estado && (
                  <div className="socios-card-row">
                    <span className="socios-card-label">Estado</span>
                    <span>{verSocioData.estado?.nombre ?? verSocioData.estado}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="instalaciones-ver-socio-cerrar">
            <button type="button" className="modal-button-cancel" onClick={() => setVerSocioOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="instalaciones-page">
      {/* ── Vista: Lista ── */}
      {vista === 'lista' && (
        <>
          <h1 className="instalaciones-title">Reservas e Instalaciones</h1>

          <div className="instalaciones-seccion-separator">
            <div className="instalaciones-seccion-header">
              <h2 className="instalaciones-seccion-title">Instalaciones</h2>
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
                { label: 'Valor por hora', value: `$${instalacionActual.valor_hora}/h` },
                {
                  label: 'Estado',
                  value: instalacionActual.activa ? 'Activa' : 'Inactiva',
                  color: instalacionActual.activa ? '#155724' : '#4a4a4a',
                },
              ].map((field, i, arr) => (
                <div
                  key={field.label}
                  className="instalaciones-detalle-row"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none' }}
                >
                  <span className="instalaciones-detalle-row-label">{field.label}</span>
                  <span
                    className="instalaciones-detalle-row-value"
                    style={{ color: field.color ?? '#111111' }}
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
                    onChange={(e) => setFiltroFecha(e.target.value)}
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
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') buscarPorSocio(filtroNroSocio).catch(() => {});
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

            {reservasVisible && renderTablaReservas()}
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
        onCancel={() => setEliminarInstalacionOpen(false)}
      />

      <ConfirmDeleteModal
        open={eliminarReservaOpen && !!reservaActual}
        titulo="Eliminar reserva"
        mensaje="¿Estás seguro de que querés eliminar esta reserva?"
        onConfirm={handleEliminarReserva}
        onCancel={() => setEliminarReservaOpen(false)}
      />

      {/* ── Modal: Ver socio ── */}
      {renderModalVerSocio()}
    </div>
  );
}

export default InstalacionesPage;
