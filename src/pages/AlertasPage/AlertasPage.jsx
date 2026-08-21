import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getAlertas, createAlerta, borrarAlerta } from '../../services/alertasService';
import { usePermiso } from '../../hooks/usePermiso';
import { usePaginacion } from '../../hooks/usePaginacion';
import { CreateAlertaForm } from '../../components/createAlertaForm/CreateAlertaForm';
import ConfirmDeleteModal from '../../components/confirmDeleteModal/ConfirmDeleteModal';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import EmptyState from '../../components/feedback/EmptyState';
import { Paginacion } from '../../components/paginacion/Paginacion';
import { useTheme } from '../../hooks/useTheme';
import './AlertasPage.css';
import '../../styles/ListPage.css';
import '../../styles/PageTableHeader.css';
import '../../styles/ListDetailShared.css';

/** Formatea una fecha ISO a fecha y hora local, o '—' si no hay valor. */
function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString();
}

/** Traduce un error de servicio a un mensaje amigable, o usa el mensaje por defecto. */
function mensajeError(err, fallback) {
  return err?.message === 'servicio-no-disponible'
    ? 'El servicio no está disponible. Intentá de nuevo más tarde.'
    : fallback;
}

/** Página de listado de alertas: crear, ver destinatarios y eliminar. */
function AlertasPage() {
  const { logoSocio: logo } = useTheme();
  const puedeVerAlertas = usePermiso('ver_alertas');
  const puedeCrearAlerta = usePermiso('crear_alerta');
  const puedeBorrarAlerta = usePermiso('borrar_alerta');

  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crearOpen, setCrearOpen] = useState(false);
  const [alertaAEliminar, setAlertaAEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const alertasOrdenadas = [...alertas].sort(
    (a, b) => new Date(b.creado_en) - new Date(a.creado_en)
  );
  const { pagina, totalPaginas, listaPaginada, irAPagina, resetPagina } = usePaginacion(alertasOrdenadas, 10);

  function cargarAlertas() {
    setLoading(true);
    setError('');
    getAlertas()
      .then((data) => { setAlertas(data); resetPagina(); })
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar las alertas.')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!puedeVerAlertas) return;
    cargarAlertas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Agrega la alerta de forma optimista y la reemplaza (o revierte) según la respuesta del backend. */
  async function handleAlertaCreada(data) {
    setCrearOpen(false);
    const tempId = `temp-${Date.now()}`;
    setAlertas((prev) => [{ ...data, id: tempId, cantidad_destinatarios: 0, creado_en: new Date().toISOString() }, ...prev]);
    try {
      const created = await createAlerta(data);
      setAlertas((prev) => prev.map((a) => (a.id === tempId ? created : a)));
    } catch (err) {
      setAlertas((prev) => prev.filter((a) => a.id !== tempId));
      setError(mensajeError(err, 'No se pudo crear la alerta.'));
    }
  }

  /** Elimina la alerta de la lista de forma optimista y restaura si falla el backend. */
  async function handleEliminar() {
    if (guardando) return;
    setGuardando(true);
    const id = alertaAEliminar.id;
    const backup = alertaAEliminar;
    setAlertas((prev) => prev.filter((a) => a.id !== id));
    setAlertaAEliminar(null);
    try {
      await borrarAlerta(id);
    } catch (err) {
      setAlertas((prev) => [backup, ...prev]);
      setError(mensajeError(err, 'No se pudo eliminar la alerta.'));
    } finally {
      setGuardando(false);
    }
  }

  function renderLista() {
    if (loading) {
      return (
        <div className="list-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      );
    }
    if (error && alertas.length === 0) {
      return <ErrorBanner mensaje={error} onReintentar={cargarAlertas} />;
    }
    if (alertas.length === 0) {
      return <EmptyState mensaje="No hay alertas registradas." />;
    }
    return (
      <div className="disciplinas-table-wrapper">
        <table className="disciplinas-tabla">
          <thead>
            <tr>
              <th>Mensaje</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Destinatarios</th>
              <th>Fecha</th>
              {puedeBorrarAlerta && <th></th>}
            </tr>
          </thead>
          <tbody>
            {listaPaginada.map((a) => {
              const esDirigida = (a.socios_destino ?? []).length > 0;
              const nombresDestino = (a.socios_destino ?? [])
                .map((s) => `${s.nro_socio} — ${s.apellido} ${s.nombre}`)
                .join(', ');
              return (
              <tr key={a.id}>
                <td className="td-truncate" title={a.mensaje}>{a.mensaje}</td>
                <td>{esDirigida ? '—' : (a.filtro_categoria ?? 'Todas')}</td>
                <td>{esDirigida ? '—' : (a.filtro_estado ?? 'Todos')}</td>
                <td title={esDirigida ? nombresDestino : undefined}>
                  {esDirigida ? `${a.cantidad_destinatarios} (socios específicos)` : a.cantidad_destinatarios}
                </td>
                <td>{formatearFecha(a.creado_en)}</td>
                {puedeBorrarAlerta && (
                  <td>
                    <button
                      type="button"
                      className="alertas-btn-eliminar-fila"
                      aria-label="Eliminar alerta"
                      onClick={() => setAlertaAEliminar(a)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
        <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiarPagina={irAPagina} />
      </div>
    );
  }

  return (
    <div className="alertas-page">
      <h1 className="alertas-title">Alertas</h1>

      <div className="alertas-toolbar">
        {puedeCrearAlerta && (
          <button className="alertas-btn-crear" onClick={() => setCrearOpen(true)}>
            <Plus size={15} aria-hidden="true" />
            Nueva alerta
          </button>
        )}
      </div>

      {error && alertas.length > 0 && <ErrorBanner mensaje={error} />}

      {renderLista()}

      {crearOpen && (
        <CreateAlertaForm
          onSuccess={handleAlertaCreada}
          onCancel={() => setCrearOpen(false)}
        />
      )}

      <ConfirmDeleteModal
        open={!!alertaAEliminar}
        titulo="Eliminar alerta"
        mensaje="¿Estás seguro de que querés eliminar esta alerta? Esta acción no se puede deshacer."
        onConfirm={handleEliminar}
        guardando={guardando}
        onCancel={() => setAlertaAEliminar(null)}
        labelConfirmar="Eliminar"
      />
    </div>
  );
}

export default AlertasPage;
