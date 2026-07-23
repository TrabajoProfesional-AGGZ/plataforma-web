import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getEventos, createEvento } from '../../services/eventosService';
import { usePermiso } from '../../hooks/usePermiso';
import { CreateEventoForm } from '../../components/createEventoForm/CreateEventoForm';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import EmptyState from '../../components/feedback/EmptyState';
import { urlImagenSegura } from '../../utils/utils';
import { useTheme } from '../../hooks/useTheme';
import './EventosPage.css';
import '../../styles/ListPage.css';
import '../../styles/PageTableHeader.css';
import '../../styles/ListDetailShared.css';

function mensajeError(err, fallback) {
  return err?.message === 'servicio-no-disponible'
    ? 'El servicio no está disponible. Intentá de nuevo más tarde.'
    : fallback;
}

function EventosPage() {
  const { logoSocio: logo } = useTheme();
  const puedeVerEventos = usePermiso('ver_eventos');
  const puedeCrearEvento = usePermiso('crear_evento');

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crearOpen, setCrearOpen] = useState(false);

  function cargarEventos() {
    setLoading(true);
    setError('');
    getEventos()
      .then((data) => setEventos(data))
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar los eventos.')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!puedeVerEventos) return;
    cargarEventos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEventoCreado(data) {
    setCrearOpen(false);
    const tempId = `temp-${Date.now()}`;
    setEventos((prev) => [...prev, { ...data, id: tempId, entradas_vendidas: 0 }]);
    try {
      const created = await createEvento(data);
      setEventos((prev) => prev.map((e) => (e.id === tempId ? created : e)));
    } catch (err) {
      setEventos((prev) => prev.filter((e) => e.id !== tempId));
      setError(mensajeError(err, 'No se pudo crear el evento.'));
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
    if (error && eventos.length === 0) {
      return <ErrorBanner mensaje={error} onReintentar={cargarEventos} />;
    }
    if (eventos.length === 0) {
      return <EmptyState mensaje="No hay eventos registrados." />;
    }
    return (
      <div className="disciplinas-table-wrapper">
        <table className="disciplinas-tabla">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nombre</th>
              <th>Día</th>
              <th>Horario</th>
              <th>Entradas</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((e) => {
              const imagenSegura = urlImagenSegura(e.foto_url);
              return (
                <tr key={e.id}>
                  <td>
                    {imagenSegura ? (
                      <img
                        src={imagenSegura}
                        alt=""
                        className="eventos-thumb"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{e.nombre}</td>
                  <td>{e.dia}</td>
                  <td>{e.hora_inicio?.slice(0, 5)} - {e.hora_fin?.slice(0, 5)}</td>
                  <td>{e.entradas_vendidas} / {e.capacidad_maxima}</td>
                  <td>${Number(e.valor_entrada).toLocaleString('es-AR')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="eventos-page">
      <h1 className="eventos-title">Eventos</h1>
      <div className="eventos-toolbar">
        {puedeCrearEvento && (
          <button className="eventos-btn-crear" onClick={() => setCrearOpen(true)}>
            <Plus size={15} aria-hidden="true" />
            Nuevo evento
          </button>
        )}
      </div>
      {error && eventos.length > 0 && <ErrorBanner mensaje={error} />}
      {renderLista()}

      {crearOpen && (
        <CreateEventoForm
          onSuccess={handleEventoCreado}
          onCancel={() => setCrearOpen(false)}
        />
      )}
    </div>
  );
}

export default EventosPage;
