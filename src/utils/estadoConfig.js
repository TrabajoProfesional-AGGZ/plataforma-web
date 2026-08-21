import logoVerde from '../assets/logo-verde.png';
import logoRojo from '../assets/logo-rojo.png';
import logoAmarillo from '../assets/logo-amarillo.png';
import logoNaranja from '../assets/logo-naranja.png';

export const ESTADO_CONFIG = {
  'Activo':     { logo: logoVerde,    bg: 'var(--status-success-bg)',   border: 'var(--status-success-border)',   variant: 'success' },
  'Moroso':     { logo: logoRojo,     bg: 'var(--status-danger-bg)',    border: 'var(--status-danger-border)',    variant: 'danger' },
  'Inactivo':   { logo: logoAmarillo, bg: 'var(--status-warning-bg)',   border: 'var(--status-warning-border)',   variant: 'warning' },
  'Suspendido': { logo: logoNaranja,  bg: 'var(--status-suspended-bg)', border: 'var(--status-suspended-border)', variant: 'suspended' },
};

export const ESTADO_DEFAULT = { logo: logoAmarillo, bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)', variant: 'warning' };

/**
 * Devuelve la configuración visual (logo, colores, variante) para un estado de socio.
 * @param {string|{nombre: string}} estado - Nombre del estado o el objeto estado con campo `nombre`.
 * @returns {{logo: string, bg: string, border: string, variant: string}}
 */
export function estadoConfig(estado) {
  const nombre = typeof estado === 'object' ? (estado?.nombre ?? '') : (estado ?? '');
  return ESTADO_CONFIG[nombre] ?? ESTADO_DEFAULT;
}
