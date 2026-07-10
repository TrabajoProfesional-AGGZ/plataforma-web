export function getDocNumberRules({ required = true } = {}) {
  return {
    ...(required && { required: 'El número es requerido' }),
    pattern: {
      value: /^[A-Z0-9]{5,20}$/,
      message: 'Solo letras mayúsculas y números (5–20 caracteres)',
    },
    setValueAs: (v) => v.toUpperCase(),
  };
}

export function validarFechaNacimiento(v) {
  const d = new Date(v);
  const now = new Date();
  if (Number.isNaN(d.getTime())) return 'Fecha inválida';
  if (d > now) return 'La fecha no puede ser futura';
  if (now.getFullYear() - d.getFullYear() > 120) return 'Fecha inválida';
  return undefined;
}

export function validarFechaNacimientoOpcional(v) {
  if (!v) return undefined;
  return validarFechaNacimiento(v);
}

export function esUrlHttpsValida(v) {
  if (!v) return true;
  try {
    return new URL(v).protocol === 'https:' || 'La URL debe usar https://';
  } catch {
    return 'URL inválida';
  }
}

export function getImagenUrlRules() {
  return {
    validate: esUrlHttpsValida,
    maxLength: { value: MAX_LEN.URL_IMAGEN, message: `Máximo ${MAX_LEN.URL_IMAGEN} caracteres` },
  };
}

export const MAX_LEN = {
  TITULO_NOTICIA: 150,
  CUERPO_NOTICIA: 5000,
  MENSAJE_ALERTA: 500,
  NRO_SOCIO: 20,
  URL_IMAGEN: 2048,
  PASSWORD: 128,
};

export function validarFortalezaPassword(v) {
  if (!v || v.length < 10) return 'Mínimo 10 caracteres';
  if (v.length > MAX_LEN.PASSWORD) return `Máximo ${MAX_LEN.PASSWORD} caracteres`;
  if (!/[a-z]/.test(v)) return 'Debe incluir al menos una minúscula';
  if (!/[A-Z]/.test(v)) return 'Debe incluir al menos una mayúscula';
  if (!/[0-9]/.test(v)) return 'Debe incluir al menos un número';
  return undefined;
}

export function getPasswordRules() {
  return {
    required: 'La contraseña es requerida',
    validate: validarFortalezaPassword,
  };
}
