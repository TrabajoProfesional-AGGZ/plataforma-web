import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getAlertas, createAlerta, borrarAlerta } from '../../services/alertasService';
import { usePermiso } from '../../hooks/usePermiso';
import { CreateAlertaForm } from '../../components/createAlertaForm/CreateAlertaForm';
import ConfirmDeleteModal from '../../components/confirmDeleteModal/ConfirmDeleteModal';
import logo from '../../assets/logo_socio.png';
import './AlertasPage.css';
import '../../styles/ListPage.css';
import '../../styles/PageTableHeader.css';
import '../../styles/ListDetailShared.css';

function truncar(texto, max = 80) {
  if (!texto) return '';
  return texto.length > max ? `${texto.slice(0, max)}…` : texto;
}

function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString();
}

function AlertasPage() {
  const puedeVerAlertas = usePermiso('ver_alertas');
  const puedeCrearAlerta = usePermiso('crear_alerta');
  const puedeBorrarAlerta = usePermiso('borrar_alerta');

  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [crearOpen, setCrearOpen] = useState(false);
  const [alertaAEliminar, setAlertaAEliminar] = useState(null);

  useEffect(() => {
    if (!puedeVerAlertas) return;
    setLoading(true);
    getAlertas()
      .then((data) => setAlertas(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAlertaCreada(data) {
    setCrearOpen(false);
    const tempId = `temp-${Date.now()}`;
    setAlertas((prev) => [{ ...data, id: tempId, cantidad_destinatarios: 0, creado_en: new Date().toISOString() }, ...prev]);
    try {
      const created = await createAlerta(data);
      setAlertas((prev) => prev.map((a) => (a.id === tempId ? created : a)));
    } catch {
      setAlertas((prev) => prev.filter((a) => a.id !== tempId));
    }
  }

  async function handleEliminar() {
    const id = alertaAEliminar.id;
    const backup = alertaAEliminar;
    setAlertas((prev) => prev.filter((a) => a.id !== id));
    setAlertaAEliminar(null);
    try {
      await borrarAlerta(id);
    } catch {
      setAlertas((prev) => [backup, ...prev]);
    }
  }

  function renderLista() {
    if (loading) {
      return (
        <div className="alertas-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      );
    }
    if (alertas.length === 0) {
      return <p className="disciplinas-empty">No hay alertas registradas.</p>;
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
                <td>{truncar(a.mensaje)}</td>
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
        onCancel={() => setAlertaAEliminar(null)}
        labelConfirmar="Eliminar"
      />
    </div>
  );
}

export default AlertasPage;
