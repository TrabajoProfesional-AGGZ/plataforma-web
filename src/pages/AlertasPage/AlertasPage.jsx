import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getAlertas, createAlerta, borrarAlerta } from '../../services/alertasService';
import { usePermiso } from '../../hooks/usePermiso';
import { CreateAlertaForm } from '../../components/createAlertaForm/CreateAlertaForm';
import ConfirmDeleteModal from '../../components/confirmDeleteModal/ConfirmDeleteModal';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import EmptyState from '../../components/feedback/EmptyState';
import logo from '../../assets/logo_socio.png';
import './AlertasPage.css';
import '../../styles/ListPage.css';
import '../../styles/PageTableHeader.css';
import '../../styles/ListDetailShared.css';

function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString();
}

function mensajeError(err, fallback) {
  return err?.message === 'servicio-no-disponible'
    ? 'El servicio no está disponible. Intentá de nuevo más tarde.'
    : fallback;
}

function AlertasPage() {
  const puedeVerAlertas = usePermiso('ver_alertas');
  const puedeCrearAlerta = usePermiso('crear_alerta');
  const puedeBorrarAlerta = usePermiso('borrar_alerta');

  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crearOpen, setCrearOpen] = useState(false);
  const [alertaAEliminar, setAlertaAEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function cargarAlertas() {
    setLoading(true);
    setError('');
    getAlertas()
      .then((data) => setAlertas(data))
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar las alertas.')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!puedeVerAlertas) return;
    cargarAlertas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            {alertas.map((a) => (
              <tr key={a.id}>
                <td className="td-truncate" title={a.mensaje}>{a.mensaje}</td>
                <td>{a.filtro_categoria ?? 'Todas'}</td>
                <td>{a.filtro_estado ?? 'Todos'}</td>
                <td>{a.cantidad_destinatarios}</td>
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
            ))}
          </tbody>
        </table>
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
