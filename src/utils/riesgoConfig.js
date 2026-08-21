export const RIESGO_CONFIG = {
  Alto: { bg: 'var(--status-danger-bg)', border: 'var(--status-danger-border)' },
  Medio: { bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)' },
  Bajo: { bg: 'var(--status-success-bg)', border: 'var(--status-success-border)' },
};

export const RIESGO_DEFAULT = { bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)' };

/** Normaliza a formato "Alto"/"Medio"/"Bajo" para matchear las claves de RIESGO_CONFIG sin importar el case de entrada. */
function normalizar(valor) {
  if (!valor) return '';
  const texto = String(valor).trim().toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Devuelve la configuración visual (colores) para un nivel de riesgo de morosidad.
 * @param {string} nivelRiesgo - "Alto", "Medio" o "Bajo" (case-insensitive).
 * @returns {{bg: string, border: string}}
 */
export function riesgoConfig(nivelRiesgo) {
  return RIESGO_CONFIG[normalizar(nivelRiesgo)] ?? RIESGO_DEFAULT;
}
