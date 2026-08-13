import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { getTopProductos } from '../../services/metricasService';
import { useTheme } from '../../hooks/useTheme';
import RankingList from './RankingList';
import './TiendaTab.css';

function TiendaTab() {
  const { logoSocio: logo } = useTheme();
  const [productos, setProductos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    getTopProductos(5)
      .then((data) => {
        if (cancelled) return;
        setProductos(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.message === 'servicio-no-disponible') {
          setError('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.');
        } else {
          setError('No se pudieron cargar las métricas de la tienda.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="tienda-tab-loading">
        <img src={logo} alt="" className="loading-logo" />
      </div>
    );
  }

  if (error) {
    return <p className="tienda-tab-error">{error}</p>;
  }

  return (
    <div className="tienda-tab">
      <div className="tienda-tab-card">
        <div className="tienda-tab-card-header">
          <ShoppingBag size={20} />
          <h2>Top 5 productos más vendidos</h2>
        </div>

        <RankingList
          items={productos?.ranking}
          emptyMessage="No hay productos con ventas registradas."
          renderDetalle={(p) => `${p.cantidad_vendida} unidades vendidas`}
          renderMetrica={(p) => (
            <span className="tienda-tab-monto">${p.monto_total.toLocaleString('es-AR')}</span>
          )}
        />
      </div>
    </div>
  );
}

export default TiendaTab;
