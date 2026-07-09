import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { getTopDisciplinas, getOcupacionInstalaciones } from '../../services/metricasService';
import './MetricasPage.css';

function MetricasPage() {
  const [disciplinas, setDisciplinas] = useState(null);
  const [ocupacion, setOcupacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        const [disc, ocup] = await Promise.all([
          getTopDisciplinas(5),
          getOcupacionInstalaciones(30),
        ]);
        setDisciplinas(disc);
        setOcupacion(ocup);
      } catch (err) {
        setError('No se pudieron cargar las métricas. Intentá más tarde.');
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, []);

  if (loading) return <div className="metricas-loading">Cargando métricas...</div>;
  if (error) return <div className="metricas-error">{error}</div>;

  return (
    <div className="metricas-main">
      <h1 className="metricas-title">Métricas del Club</h1>
      <p className="metricas-subtitle">Estadísticas de uso de espacios y disciplinas</p>

      <div className="metricas-grid">

        {/* ── Top Disciplinas ── */}
        <section className="metricas-card">
          <div className="metricas-card-header">
            <TrendingUp size={20} />
            <h2>Top 5 Disciplinas por Inscriptos</h2>
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
            <p className="metricas-empty">No hay disciplinas con inscriptos activos.</p>
          )}
        </section>

        {/* ── Ocupación de Instalaciones ── */}
        <section className="metricas-card">
          <div className="metricas-card-header">
            <BarChart3 size={20} />
            <h2>Ocupación de Instalaciones</h2>
            <span className="metricas-badge">Últimos {ocupacion?.periodo_dias} días</span>
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
            <p className="metricas-empty">No hay instalaciones activas.</p>
          )}
        </section>

      </div>
    </div>
  );
}

export default MetricasPage;
