import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, CreditCard, AlertTriangle } from 'lucide-react';
import { getEstadoMercadoPago, getUrlAutorizacionMercadoPago } from '../../services/cobrosService';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { SkeletonRows } from '../../components/feedback/SkeletonRows';
import './CobrosPage.css';

const MENSAJES_DE_ERROR = {
  'sin-permiso': 'Tu usuario no puede administrar la cuenta de cobro del club.',
  'servicio-no-disponible': 'No pudimos consultar la cuenta de Mercado Pago. Probá de nuevo en unos segundos.',
  'oauth-no-configurado': 'La conexión con Mercado Pago no está configurada en el servidor. Avisale al equipo de SocioUnido.',
};

function mensajeDe(error) {
  return MENSAJES_DE_ERROR[error.message] ?? 'Ocurrió un error inesperado.';
}

/** Fecha de vencimiento de la autorización, en el formato que se lee en Argentina. */
function formatearVencimiento(iso) {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Página de cobros: conecta la cuenta de Mercado Pago con la que cobra **este** club.
 *
 * Cada club cobra con su propia cuenta, así que el dinero le entra directo y SocioUnido no
 * intermedia fondos. El club no se elige acá: sale del token del admin logueado.
 */
function CobrosPage() {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [conectando, setConectando] = useState(false);
  const [parametros, setParametros] = useSearchParams();

  // Mercado Pago devuelve al admin acá con `?mp=conectado` (lo redirige el callback de
  // ms-pagos). El parámetro se consume una sola vez: si quedara en la URL, un refresh o un
  // link compartido mostrarían un cartel de éxito que no corresponde a nada.
  const [recienConectado] = useState(() => parametros.get('mp') === 'conectado');

  useEffect(() => {
    if (parametros.has('mp')) {
      const limpios = new URLSearchParams(parametros);
      limpios.delete('mp');
      setParametros(limpios, { replace: true });
    }
  }, [parametros, setParametros]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setEstado(await getEstadoMercadoPago());
    } catch (fallo) {
      setEstado(null);
      setError(mensajeDe(fallo));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const conectar = async () => {
    setConectando(true);
    setError(null);
    try {
      // Se sale del panel a propósito: la autorización es de Mercado Pago y tiene que pasar en
      // su dominio, con el admin viendo en la barra que le está dando permiso a su propia
      // cuenta. Vuelve al callback de ms-pagos, que lo trae de nuevo acá.
      window.location.assign(await getUrlAutorizacionMercadoPago());
    } catch (fallo) {
      setError(mensajeDe(fallo));
      setConectando(false);
    }
  };

  const conectada = estado?.conectado === true;
  const desvinculada = estado?.estado === 'desvinculado';
  // Tres estados y no dos: "desvinculada" es que el club revocó la autorización desde Mercado
  // Pago, que se arregla distinto de nunca haberla conectado — y hay cobros que ya dependían de
  // ella.
  const etiquetaEstado = conectada ? 'Conectada' : desvinculada ? 'Desvinculada' : 'Sin conectar';
  const vencimiento = formatearVencimiento(estado?.expira_el);

  return (
    <div className="cobros-page">
      <h1 className="page-title">Cobros</h1>

      {recienConectado && (
        <div className="cobros-exito" role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>Listo: el club ya cobra con su cuenta de Mercado Pago.</span>
        </div>
      )}

      <div className="cobros-card">
        <div className="cobros-card-header">
          <CreditCard size={20} aria-hidden="true" />
          <h2>Cuenta de Mercado Pago</h2>
          {!cargando && estado && (
            <span className={`cobros-badge cobros-badge--${conectada ? 'ok' : 'pendiente'}`}>
              {etiquetaEstado}
            </span>
          )}
        </div>

        <p className="cobros-descripcion">
          Las cuotas, reservas y entradas que paguen los socios se acreditan directamente en la
          cuenta de Mercado Pago del club. SocioUnido no recibe ni retiene ese dinero.
        </p>

        {cargando && <SkeletonRows n={2} altura={40} />}

        {!cargando && error && <ErrorBanner mensaje={error} onReintentar={cargar} />}

        {!cargando && !error && desvinculada && (
          <div className="cobros-aviso" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>
              La autorización fue revocada desde Mercado Pago, así que los pagos nuevos van a
              fallar hasta que vuelvas a conectarla.
            </span>
          </div>
        )}

        {!cargando && !error && estado && (
          <dl className="cobros-datos">
            {estado.mp_user_id && (
              <div className="cobros-dato">
                <dt>Cuenta</dt>
                <dd>{estado.mp_user_id}</dd>
              </div>
            )}
            {conectada && vencimiento && (
              <div className="cobros-dato">
                <dt>Autorización vigente hasta</dt>
                <dd>{vencimiento}</dd>
              </div>
            )}
          </dl>
        )}

        {!cargando && !error && (
          <button
            type="button"
            className="cobros-btn"
            onClick={conectar}
            disabled={conectando}
          >
            {conectando
              ? 'Redirigiendo a Mercado Pago...'
              : conectada
                ? 'Reconectar la cuenta'
                : 'Conectar Mercado Pago'}
          </button>
        )}
      </div>
    </div>
  );
}

export default CobrosPage;
