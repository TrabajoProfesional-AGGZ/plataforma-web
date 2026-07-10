import logoVerde from '../assets/logo-verde.png';
import logoRojo from '../assets/logo-rojo.png';
import logoAmarillo from '../assets/logo-amarillo.png';
import logoNaranja from '../assets/logo-naranja.png';

export const ESTADO_CONFIG = {
  'Activo':     { logo: logoVerde,    bg: 'var(--status-success-bg)',   border: 'var(--status-success-border)' },
  'Moroso':     { logo: logoRojo,     bg: 'var(--status-danger-bg)',    border: 'var(--status-danger-border)' },
  'Inactivo':   { logo: logoAmarillo, bg: 'var(--status-warning-bg)',   border: 'var(--status-warning-border)' },
  'Suspendido': { logo: logoNaranja,  bg: 'var(--status-suspended-bg)', border: 'var(--status-suspended-border)' },
};

export const ESTADO_DEFAULT = { logo: logoAmarillo, bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)' };

export function estadoConfig(estado) {
  const nombre = typeof estado === 'object' ? (estado?.nombre ?? '') : (estado ?? '');
  return ESTADO_CONFIG[nombre] ?? ESTADO_DEFAULT;
}
