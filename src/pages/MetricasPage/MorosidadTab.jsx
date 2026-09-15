import { useState, useEffect, useCallback } from 'react';
import { getDashboardFidelizacion } from '../../services/fidelizacionService';
import { useListState } from '../../hooks/useListState';
import { usePaginacion } from '../../hooks/usePaginacion';
import { Paginacion } from '../../components/paginacion/Paginacion';
import { TendenciasPagoChart } from '../../components/charts/TendenciasPagoChart';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import EmptyState from '../../components/feedback/EmptyState';
import { SkeletonRows } from '../../components/feedback/SkeletonRows';
import { riesgoConfig } from '../../utils/riesgoConfig';
import './MorosidadTab.css';
import '../../styles/ListPage.css';
import '../../styles/PageTableHeader.css';

/** Formatea una fracción 0-1 como porcentaje redondeado, o '—' si no hay valor. */
function formatearPorcentaje(valor) {
  if (valor == null) return '—';
  return `${Math.round(valor * 100)}%`;
}

/** Select de mes reutilizado por los filtros "Desde"/"Hasta" de tendencias de pago. */
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

/** Pestaña "Morosidad" de Métricas: predicción de atraso por socio y gráfico de tendencias de pago filtrable por rango de mes. */
function MorosidadTab() {
  const { resultado: datos, setResultado: setDatos, loading, setLoading, error, setError } = useListState();
  const [mesDesde, setMesDesde] = useState('');
  const [mesHasta, setMesHasta] = useState('');

  const prediccionOrdenada = [...(datos?.prediccion_morosidad ?? [])].sort(
    (a, b) => b.probabilidad_atraso - a.probabilidad_atraso
  );
  const {
    pagina: paginaPrediccion,
    totalPaginas: totalPaginasPrediccion,
    listaPaginada: prediccionPaginada,
    irAPagina: irAPaginaPrediccion,
    resetPagina: resetPaginaPrediccion,
  } = usePaginacion(prediccionOrdenada, 10);

  const cargar = useCallback(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getDashboardFidelizacion()
      .then((data) => {
        if (cancelled) return;
        setDatos(data);
        resetPaginaPrediccion();
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
  }, []);

  useEffect(() => cargar(), [cargar]);

  const mesesDisponibles = (datos?.tendencias_pago ?? []).map((t) => t.mes);

  const tendenciasFiltradas = (datos?.tendencias_pago ?? []).filter((t) => {
    const idxDesde = mesesDisponibles.indexOf(mesDesde);
    const idxHasta = mesesDisponibles.indexOf(mesHasta);
    if (idxDesde === -1 || idxHasta === -1) return true;
    const idx = mesesDisponibles.indexOf(t.mes);
    return idx >= idxDesde && idx <= idxHasta;
  });

  if (loading) {
    return <SkeletonRows n={6} />;
  }

  if (error) {
    return <ErrorBanner mensaje={error} onReintentar={cargar} />;
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
          <EmptyState mensaje="No hay predicciones de morosidad disponibles." />
        ) : (
          <div className="disciplinas-table-wrapper">
            <table className="disciplinas-tabla">
              <thead>
                <tr>
                  <th>Socio</th>
                  <th className="td-num">Probabilidad de atraso</th>
                  <th className="td-num">Días promedio histórico</th>
                  <th className="td-center">Nivel de riesgo</th>
                </tr>
              </thead>
              <tbody>
                {prediccionPaginada.map((p) => {
                  const { bg, border } = riesgoConfig(p.nivel_riesgo);
                  return (
                    <tr key={p.socio_id}>
                      <td>{p.nombre_completo}</td>
                      <td className="td-num">{formatearPorcentaje(p.probabilidad_atraso)}</td>
                      <td className="td-num">{p.dias_promedio_historico} días</td>
                      <td className="td-center">
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
            <Paginacion
              pagina={paginaPrediccion}
              totalPaginas={totalPaginasPrediccion}
              onCambiarPagina={irAPaginaPrediccion}
            />
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

export default MorosidadTab;
