import { useState, useEffect } from 'react';
import { Wallet, Receipt, CalendarCheck, Ticket, ShoppingBag } from 'lucide-react';
import { getPagosEnCaja } from '../../services/metricasService';
import { useTheme } from '../../hooks/useTheme';
import './CajaTab.css';

const ICONO_POR_TIPO = {
  cuota: Receipt,
  reserva: CalendarCheck,
  entrada: Ticket,
  compra: ShoppingBag,
};

const LABEL_POR_TIPO = {
  cuota: 'Cuotas',
  reserva: 'Reservas',
  entrada: 'Entradas',
  compra: 'Compras',
};

function CajaTab() {
  const { logoSocio: logo } = useTheme();
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    getPagosEnCaja()
      .then((data) => {
        if (cancelled) return;
        setDatos(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.message === 'servicio-no-disponible') {
          setError('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.');
        } else {
          setError('No se pudieron cargar los pagos en caja.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="caja-tab-loading">
        <img src={logo} alt="" className="loading-logo" />
      </div>
    );
  }

  if (error) {
    return <p className="caja-tab-error">{error}</p>;
  }

  const desglose = datos?.desglose ?? [];

  return (
    <div className="caja-tab">
      <div className="caja-tab-kpi-card">
        <h2 className="caja-tab-kpi-title">Total pagado en caja</h2>
        <p className="caja-tab-kpi-value">${(datos?.total_monto ?? 0).toLocaleString('es-AR')}</p>
        <span className="caja-tab-kpi-subtitle">{datos?.total_cantidad ?? 0} pagos registrados</span>
      </div>

      <div className="caja-tab-desglose-container">
        <div className="caja-tab-desglose-header">
          <Wallet size={20} />
          <h3>Desglose por tipo</h3>
        </div>
        <hr className="caja-tab-rule" />

        {desglose.length > 0 ? (
          <div className="caja-tab-desglose-list">
            {desglose.map((d) => {
              const Icono = ICONO_POR_TIPO[d.tipo] ?? Wallet;
              return (
                <div key={d.tipo} className="caja-tab-desglose-item">
                  <div className="caja-tab-desglose-icono">
                    <Icono size={18} />
                  </div>
                  <div className="caja-tab-desglose-info">
                    <span className="caja-tab-desglose-label">{LABEL_POR_TIPO[d.tipo] ?? d.tipo}</span>
                    <span className="caja-tab-desglose-cantidad">{d.cantidad} pagos</span>
                  </div>
                  <span className="caja-tab-desglose-monto">${d.monto_total.toLocaleString('es-AR')}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="caja-tab-empty">Todavía no se registraron pagos en caja.</p>
        )}
      </div>
    </div>
  );
}

export default CajaTab;
