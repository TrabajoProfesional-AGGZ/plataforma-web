import { useState, useEffect } from 'react';
import { Ticket } from 'lucide-react';
import { getTopEventos } from '../../services/metricasService';
import { useTheme } from '../../hooks/useTheme';
import RankingList from './RankingList';
import './EventosTab.css';

/** Pestaña "Eventos" de Métricas: ranking de eventos por entradas vendidas y % de ocupación. */
function EventosTab() {
  const { logoSocio: logo } = useTheme();
  const [eventos, setEventos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    getTopEventos(5)
      .then((data) => {
        if (cancelled) return;
        setEventos(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.message === 'servicio-no-disponible') {
          setError('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.');
        } else {
          setError('No se pudieron cargar las métricas de eventos.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="eventos-tab-loading">
        <img src={logo} alt="" className="loading-logo" />
      </div>
    );
  }

  if (error) {
    return <p className="eventos-tab-error">{error}</p>;
  }

  return (
    <div className="eventos-tab">
      <div className="eventos-tab-card">
        <div className="eventos-tab-card-header">
          <Ticket size={20} />
          <h2>Top 5 eventos por entradas vendidas</h2>
        </div>

        <RankingList
          items={eventos?.ranking}
          emptyMessage="No hay eventos con entradas vendidas."
          renderDetalle={(e) => `${e.entradas_vendidas} / ${e.capacidad_maxima} entradas`}
          renderMetrica={(e) => (
            <div className="eventos-tab-bar-container">
              <div
                className="eventos-tab-bar"
                style={{ width: `${Math.min(e.porcentaje_ocupacion, 100)}%` }}
              />
              <span className="eventos-tab-porcentaje">{e.porcentaje_ocupacion}%</span>
            </div>
          )}
        />
      </div>
    </div>
  );
}

export default EventosTab;
