export const RIESGO_CONFIG = {
  Alto: { bg: '#f4bebe', border: '#A01414' },
  Medio: { bg: '#f5e9b2', border: '#9A6200' },
  Bajo: { bg: '#a7daa7', border: '#0D6E0D' },
};

export const RIESGO_DEFAULT = { bg: '#f5e9b2', border: '#9A6200' };

function normalizar(valor) {
  if (!valor) return '';
  const texto = String(valor).trim().toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function riesgoConfig(nivelRiesgo) {
  return RIESGO_CONFIG[normalizar(nivelRiesgo)] ?? RIESGO_DEFAULT;
}
