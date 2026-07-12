import { useState, useEffect } from 'react';
import { getDashboardFinanzas } from '../../services/metricasService';
import { DesgloseFinanzasChart } from '../../components/charts/DesgloseFinanzasChart';
import { useTheme } from '../../hooks/useTheme';
import './FinanzasTab.css';

function FinanzasTab() {
  const { logoSocio: logo } = useTheme();
  const [datosFinanzas, setDatosFinanzas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado para el selector de mes (Formato YYYY-MM)
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    getDashboardFinanzas(periodoSeleccionado)
      .then((data) => {
        if (cancelled) return;
        setDatosFinanzas(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.message === 'servicio-no-disponible') {
          setError('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.');
        } else if (err.message === 'no-autorizado') {
          setError('No tenés los permisos necesarios para ver esta información.');
        } else {
          setError('No se pudieron cargar las métricas financieras.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [periodoSeleccionado]);

  function renderContenido() {
    if (loading) {
      return (
        <div className="finanzas-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      );
    }

    if (error) {
      return <p className="finanzas-error">{error}</p>;
    }

    if (!datosFinanzas) {
      return null;
    }

    return (
      <div className="finanzas-dashboard">

        <div className="finanzas-kpi-card">
          <h2 className="finanzas-kpi-title">Recaudación total consolidada</h2>
          <p className="finanzas-kpi-value">
            ${datosFinanzas.recaudacion_total.toLocaleString('es-AR')}
          </p>
          <span className="finanzas-kpi-subtitle">Periodo: {datosFinanzas.periodo}</span>
        </div>

        <div className="finanzas-chart-container">
          <h3 className="finanzas-chart-title">Desglose de ingresos por concepto</h3>
          <hr className="finanzas-rule" />
          <DesgloseFinanzasChart datos={datosFinanzas.desglose} />
        </div>

      </div>
    );
  }

  return (
    <div className="finanzas-tab">
      <div className="finanzas-toolbar">
        <div className="finanzas-filter-group">
          <label htmlFor="periodo" className="finanzas-filter-label">Período a consultar:</label>
          <input
            type="month"
            id="periodo"
            className="finanzas-input-month"
            value={periodoSeleccionado}
            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
          />
        </div>
      </div>

      {renderContenido()}
    </div>
  );
}

export default FinanzasTab;
