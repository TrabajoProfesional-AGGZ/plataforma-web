import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { getTopDisciplinas, getOcupacionInstalaciones } from '../../services/metricasService';
import logo from '../../assets/logo_socio.png';
import './ResumenTab.css';

function ResumenTab() {
  const [disciplinas, setDisciplinas] = useState(null);
  const [ocupacion, setOcupacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    Promise.all([getTopDisciplinas(5), getOcupacionInstalaciones(30)])
      .then(([disc, ocup]) => {
        if (cancelled) return;
        setDisciplinas(disc);
        setOcupacion(ocup);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.message === 'servicio-no-disponible') {
          setError('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.');
        } else {
          setError('No se pudieron cargar las métricas. Intentá más tarde.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="resumen-loading">
        <img src={logo} alt="" className="loading-logo" />
      </div>
    );
  }

  if (error) {
    return <p className="resumen-error">{error}</p>;
  }

  return (
    <div className="resumen-grid">

      <section className="resumen-card">
        <div className="resumen-card-header">
          <TrendingUp size={20} />
          <h2>Top 5 disciplinas por inscriptos</h2>
        </div>

        {disciplinas?.ranking?.length > 0 ? (
          <div className="ranking-list">
            {disciplinas.ranking.map((d, i) => (
              <div key={d.id} className="ranking-item">
                <div className="ranking-position">{i + 1}</div>
                <div className="ranking-info">
                  <span className="ranking-nombre">{d.nombre}</span>
                  <span className="ranking-detalle">
                    {d.total_inscriptos} / {d.cupo_maximo} inscriptos
                  </span>
                </div>
                <div className="ranking-bar-container">
                  <div
                    className="ranking-bar"
                    style={{ width: `${Math.min(d.porcentaje_cupo, 100)}%` }}
                  />
                  <span className="ranking-porcentaje">{d.porcentaje_cupo}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="resumen-empty">No hay disciplinas con inscriptos activos.</p>
        )}
      </section>

      <section className="resumen-card">
        <div className="resumen-card-header">
          <BarChart3 size={20} />
          <h2>Ocupación de instalaciones</h2>
          <span className="resumen-badge">Últimos {ocupacion?.periodo_dias} días</span>
        </div>

        {ocupacion?.promedio_ocupacion != null && (
          <div className="ocupacion-promedio">
            <span className="ocupacion-promedio-valor">{ocupacion.promedio_ocupacion}%</span>
            <span className="ocupacion-promedio-label">Promedio general</span>
          </div>
        )}

        {ocupacion?.instalaciones?.length > 0 ? (
          <div className="ocupacion-list">
            {ocupacion.instalaciones.map((inst) => (
              <div key={inst.id} className="ocupacion-item">
                <div className="ocupacion-info">
                  <span className="ocupacion-nombre">{inst.nombre}</span>
                  <span className="ocupacion-tipo">{inst.tipo}</span>
                </div>
                <div className="ocupacion-bar-container">
                  <div
                    className="ocupacion-bar"
                    style={{ width: `${Math.min(inst.porcentaje_ocupacion, 100)}%` }}
                  />
                  <span className="ocupacion-porcentaje">{inst.porcentaje_ocupacion}%</span>
                </div>
                <span className="ocupacion-horas">
                  {inst.horas_reservadas}h / {inst.horas_disponibles}h
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="resumen-empty">No hay instalaciones activas.</p>
        )}
      </section>

    </div>
  );
}

export default ResumenTab;
