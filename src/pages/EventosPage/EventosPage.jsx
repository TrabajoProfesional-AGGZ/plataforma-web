import { useState, useEffect } from 'react';
import { Plus, Ticket } from 'lucide-react';
import { getEventos, getEventosHistoricos, createEvento } from '../../services/eventosService';
import { usePermiso } from '../../hooks/usePermiso';
import { CreateEventoForm } from '../../components/createEventoForm/CreateEventoForm';
import { ReservarEntradaForm } from '../../components/reservarEntradaForm/ReservarEntradaForm';
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
  const puedeCrearEntrada = usePermiso('crear_entrada');

  const [eventos, setEventos] = useState([]);
  const [eventosHistoricos, setEventosHistoricos] = useState([]);
  const [vista, setVista] = useState('vigentes');
  const [loading, setLoading] = useState(false);
  const [cargandoHistoricos, setCargandoHistoricos] = useState(false);
  const [error, setError] = useState('');
  const [crearOpen, setCrearOpen] = useState(false);
  const [eventoReserva, setEventoReserva] = useState(null);

  function cargarEventos() {
    setLoading(true);
    setError('');
    getEventos()
      .then((data) => setEventos(data))
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar los eventos.')))
      .finally(() => setLoading(false));
  }

  function verHistoricos() {
    setCargandoHistoricos(true);
    setError('');
    getEventosHistoricos()
      .then((data) => {
        setEventosHistoricos(data);
        setVista('historicos');
      })
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar los eventos históricos.')))
      .finally(() => setCargandoHistoricos(false));
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
    const esVigentes = vista === 'vigentes';
    const listaActual = esVigentes ? eventos : eventosHistoricos;
    const cargandoActual = esVigentes ? loading : cargandoHistoricos;

    if (cargandoActual) {
      return (
        <div className="list-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      );
    }
    if (error && listaActual.length === 0) {
      return <ErrorBanner mensaje={error} onReintentar={esVigentes ? cargarEventos : verHistoricos} />;
    }
    if (listaActual.length === 0) {
      return (
        <EmptyState
          mensaje={esVigentes ? 'No hay eventos registrados.' : 'No hay eventos históricos.'}
        />
      );
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
              {esVigentes && puedeCrearEntrada && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {listaActual.map((e) => {
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
                  {esVigentes && puedeCrearEntrada && (
                    <td>
                      <button
                        type="button"
                        className="eventos-btn-reservar-entrada"
                        onClick={() => setEventoReserva(e)}
                        disabled={String(e.id).startsWith('temp-')}
                      >
                        <Ticket size={14} aria-hidden="true" />
                        Reservar entrada
                      </button>
                    </td>
                  )}
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
        {puedeCrearEvento && vista === 'vigentes' && (
          <button className="eventos-btn-crear" onClick={() => setCrearOpen(true)}>
            <Plus size={15} aria-hidden="true" />
            Nuevo evento
          </button>
        )}
      </div>
      {error && (vista === 'vigentes' ? eventos : eventosHistoricos).length > 0 && (
        <ErrorBanner mensaje={error} />
      )}
      {renderLista()}

      <div className="eventos-vista-toggle">
        {vista === 'vigentes' ? (
          <button className="eventos-btn-vista-toggle" onClick={verHistoricos}>
            Ver eventos históricos
          </button>
        ) : (
          <button className="eventos-btn-vista-toggle" onClick={() => setVista('vigentes')}>
            Ver eventos vigentes
          </button>
        )}
      </div>

      {crearOpen && (
        <CreateEventoForm
          onSuccess={handleEventoCreado}
          onCancel={() => setCrearOpen(false)}
        />
      )}

      {eventoReserva && (
        <ReservarEntradaForm
          evento={eventoReserva}
          onSuccess={() => {
            setEventos((prev) => prev.map((e) => (
              e.id === eventoReserva.id ? { ...e, entradas_vendidas: e.entradas_vendidas + 1 } : e
            )));
            setEventoReserva(null);
          }}
          onCancel={() => setEventoReserva(null)}
        />
      )}
    </div>
  );
}

export default EventosPage;
