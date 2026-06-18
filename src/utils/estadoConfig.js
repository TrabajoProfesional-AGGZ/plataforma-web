import logoVerde from '../assets/logo-verde.png';
import logoRojo from '../assets/logo-rojo.png';
import logoAmarillo from '../assets/logo-amarillo.png';
import logoNaranja from '../assets/logo-naranja.png';

export const ESTADO_CONFIG = {
  'Activo':     { logo: logoVerde,    bg: '#a7daa7', border: '#0D6E0D' },
  'Moroso':     { logo: logoRojo,     bg: '#f4bebe', border: '#A01414' },
  'Inactivo':   { logo: logoAmarillo, bg: '#f5e9b2', border: '#9A6200' },
  'Suspendido': { logo: logoNaranja,  bg: '#ffbd98', border: '#f14701' },
};

export const ESTADO_DEFAULT = { logo: logoAmarillo, bg: '#f5e9b2', border: '#9A6200' };

export function estadoConfig(estado) {
  const nombre = typeof estado === 'object' ? (estado?.nombre ?? '') : (estado ?? '');
  return ESTADO_CONFIG[nombre] ?? ESTADO_DEFAULT;
}
