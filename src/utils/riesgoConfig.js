export const RIESGO_CONFIG = {
  Alto: { bg: 'var(--status-danger-bg)', border: 'var(--status-danger-border)' },
  Medio: { bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)' },
  Bajo: { bg: 'var(--status-success-bg)', border: 'var(--status-success-border)' },
};

export const RIESGO_DEFAULT = { bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)' };

function normalizar(valor) {
  if (!valor) return '';
  const texto = String(valor).trim().toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function riesgoConfig(nivelRiesgo) {
  return RIESGO_CONFIG[normalizar(nivelRiesgo)] ?? RIESGO_DEFAULT;
}
