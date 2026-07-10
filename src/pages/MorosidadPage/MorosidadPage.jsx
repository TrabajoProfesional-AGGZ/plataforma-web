import { useState, useEffect } from 'react';
import { getDashboardFidelizacion } from '../../services/fidelizacionService';
import { usePermiso } from '../../hooks/usePermiso';
import { useListState } from '../../hooks/useListState';
import { TendenciasPagoChart } from '../../components/charts/TendenciasPagoChart';
import { riesgoConfig } from '../../utils/riesgoConfig';
import logo from '../../assets/logo_socio.png';
import './MorosidadPage.css';
import '../../styles/ListPage.css';
import '../../styles/PageTableHeader.css';

function formatearPorcentaje(valor) {
  if (valor == null) return '—';
  return `${Math.round(valor * 100)}%`;
}

function SelectorMes({ id, label, value, onChange, opciones }) {
  return (
    <div className="morosidad-filter-group">
      <label htmlFor={id} className="morosidad-filter-label">{label}</label>
      <select id={id} className="morosidad-select" value={value} onChange={onChange}>
        {opciones.map((mes) => (
          <option key={mes} value={mes}>{mes}</option>
        ))}
      </select>
    </div>
  );
}

function MorosidadPage() {
  const puedeVerMetricas = usePermiso('ver_metricas');
  const { resultado: datos, setResultado: setDatos, loading, setLoading, error, setError } = useListState();
  const [mesDesde, setMesDesde] = useState('');
  const [mesHasta, setMesHasta] = useState('');

  useEffect(() => {
    if (!puedeVerMetricas) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    getDashboardFidelizacion()
      .then((data) => {
        if (cancelled) return;
        setDatos(data);
        const meses = (data.tendencias_pago ?? []).map((t) => t.mes);
        setMesDesde(meses[0] ?? '');
        setMesHasta(meses[meses.length - 1] ?? '');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.message === 'servicio-no-disponible') {
          setError('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.');
        } else if (err.message === 'no-autorizado') {
          setError('No tenés los permisos necesarios para ver esta información.');
        } else {
          setError('No se pudieron cargar las métricas de morosidad.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puedeVerMetricas]);

  const mesesDisponibles = (datos?.tendencias_pago ?? []).map((t) => t.mes);

  const tendenciasFiltradas = (datos?.tendencias_pago ?? []).filter((t) => {
    const idxDesde = mesesDisponibles.indexOf(mesDesde);
    const idxHasta = mesesDisponibles.indexOf(mesHasta);
    if (idxDesde === -1 || idxHasta === -1) return true;
    const idx = mesesDisponibles.indexOf(t.mes);
    return idx >= idxDesde && idx <= idxHasta;
  });

  const prediccionOrdenada = [...(datos?.prediccion_morosidad ?? [])].sort(
    (a, b) => b.probabilidad_atraso - a.probabilidad_atraso
  );

  function renderContenido() {
    if (loading) {
      return (
        <div className="morosidad-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      );
    }

    if (error) {
      return <p className="morosidad-error">{error}</p>;
    }

    if (!datos) {
      return null;
    }

    return (
      <div className="morosidad-dashboard">
        <p className="morosidad-periodo">
          Período analizado: {datos.periodo_analizado?.desde} — {datos.periodo_analizado?.hasta}
        </p>

        <div className="morosidad-section">
          <h2 className="morosidad-section-title">Predicción de morosidad</h2>
          {prediccionOrdenada.length === 0 ? (
            <p className="disciplinas-empty">No hay predicciones de morosidad disponibles.</p>
          ) : (
            <div className="disciplinas-table-wrapper">
              <table className="disciplinas-tabla">
                <thead>
                  <tr>
                    <th>Socio</th>
                    <th>Probabilidad de atraso</th>
                    <th>Días promedio histórico</th>
                    <th>Nivel de riesgo</th>
                  </tr>
                </thead>
                <tbody>
                  {prediccionOrdenada.map((p) => {
                    const { bg, border } = riesgoConfig(p.nivel_riesgo);
                    return (
                      <tr key={p.socio_id}>
                        <td>{p.nombre_completo}</td>
                        <td>{formatearPorcentaje(p.probabilidad_atraso)}</td>
                        <td>{p.dias_promedio_historico} días</td>
                        <td>
                          <span
                            className="disciplinas-badge"
                            style={{ backgroundColor: bg, borderColor: border, color: border }}
                          >
                            {p.nivel_riesgo}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="morosidad-section">
          <h2 className="morosidad-section-title">Tendencias de pago</h2>

          <div className="morosidad-toolbar">
            <SelectorMes
              id="morosidad-mes-desde"
              label="Desde:"
              value={mesDesde}
              onChange={(e) => setMesDesde(e.target.value)}
              opciones={mesesDisponibles}
            />
            <SelectorMes
              id="morosidad-mes-hasta"
              label="Hasta:"
              value={mesHasta}
              onChange={(e) => setMesHasta(e.target.value)}
              opciones={mesesDisponibles}
            />
          </div>

          <TendenciasPagoChart datos={tendenciasFiltradas} />
        </div>
      </div>
    );
  }

  return (
    <div className="morosidad-page">
      <h1 className="morosidad-title">Predicción de Morosidad</h1>

      {!puedeVerMetricas ? (
        <p className="morosidad-error" style={{ marginTop: 'var(--space-6)' }}>
          No tenés los permisos necesarios para acceder a las métricas de morosidad del club.
        </p>
      ) : (
        renderContenido()
      )}
    </div>
  );
}

export default MorosidadPage;
