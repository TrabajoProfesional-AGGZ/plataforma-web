import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getResumenFinanciero, marcarPagadaCaja } from '../../services/finanzasService';
import { SocioSubModal } from '../socioAccionesExtra/SocioSubModal';
import ConfirmDeleteModal from '../confirmDeleteModal/ConfirmDeleteModal';
import EstadoBadge from '../badge/EstadoBadge';
import { useTheme } from '../../hooks/useTheme';
import './SocioPagosPendientesModal.css';

const ESTADOS_PAGADOS = new Set(['Pagada', 'Confirmada']);

const ESTADO_VARIANT = {
  Pendiente: 'warning',
  Vencida: 'danger',
};

function formatearMonto(monto) {
  return `$${Number(monto).toLocaleString('es-AR')}`;
}

function mensajeError(err, fallback) {
  return err?.message === 'servicio-no-disponible'
    ? 'El servicio no está disponible. Intentá de nuevo más tarde.'
    : fallback;
}

function SocioPagosPendientesModal({ idSocio, onClose }) {
  const { logoSocio: logo } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemAConfirmar, setItemAConfirmar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorConfirmar, setErrorConfirmar] = useState('');
  const handleClose = useCallback(onClose, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    getResumenFinanciero(idSocio)
      .then((data) => {
        if (cancelled) return;
        const pendientes = (data.cuotas ?? []).filter((item) => !ESTADOS_PAGADOS.has(item.estado));
        setItems(pendientes);
      })
      .catch((err) => { if (!cancelled) setError(mensajeError(err, 'No se pudieron cargar los pagos pendientes.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [idSocio]);

  async function handleConfirmarPago() {
    if (!itemAConfirmar) return;
    setGuardando(true);
    setErrorConfirmar('');
    try {
      await marcarPagadaCaja(itemAConfirmar.tipo, itemAConfirmar.id);
      setItems((prev) => prev.filter((i) => i.id !== itemAConfirmar.id));
      setItemAConfirmar(null);
    } catch (err) {
      setErrorConfirmar(mensajeError(err, 'No se pudo marcar el pago. Intentá de nuevo.'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SocioSubModal
      titulo="Pagos pendientes"
      wrapperClass="socio-pagos-pendientes-wrapper"
      onClose={itemAConfirmar ? () => {} : handleClose}
    >
      {loading ? (
        <div className="socio-modal-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      ) : error ? (
        <p className="socio-modal-empty">{error}</p>
      ) : items.length === 0 ? (
        <p className="socio-modal-empty">El socio no tiene pagos pendientes.</p>
      ) : (
        <ul className="socio-modal-lista">
          {items.map((item) => (
            <li key={`${item.tipo}-${item.id}`} className="socio-modal-item socio-pagos-pendientes-item">
              <div className="socio-modal-item-info socio-pagos-pendientes-info">
                <span className="socio-modal-item-nombre">{item.concepto}</span>
                <span className="socio-pagos-pendientes-detalle">
                  {formatearMonto(item.monto)} · vence {item.fecha_vencimiento}
                </span>
                <EstadoBadge variant={ESTADO_VARIANT[item.estado] ?? 'neutral'}>
                  {item.estado}
                </EstadoBadge>
              </div>
              <button
                type="button"
                className="socio-modal-btn-ver"
                onClick={() => setItemAConfirmar(item)}
              >
                Marcar como pagada
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDeleteModal
        open={!!itemAConfirmar}
        titulo="Marcar como pagada"
        mensaje={itemAConfirmar
          ? `¿Confirmás que "${itemAConfirmar.concepto}" (${formatearMonto(itemAConfirmar.monto)}) se pagó en caja? Esta acción no se puede deshacer.`
          : ''}
        onConfirm={handleConfirmarPago}
        onCancel={() => { setItemAConfirmar(null); setErrorConfirmar(''); }}
        guardando={guardando}
        errorModal={errorConfirmar}
        labelConfirmar="Marcar como pagada"
        labelGuardando="Guardando..."
      />
    </SocioSubModal>
  );
}

SocioPagosPendientesModal.propTypes = {
  idSocio: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export { SocioPagosPendientesModal };
