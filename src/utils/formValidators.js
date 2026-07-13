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
  if (!v) return undefined;
  try {
    return new URL(v).protocol === 'https:' ? undefined : 'La URL debe usar https://';
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
  TITULO_IMAGEN: 150,
  EMAIL: 254,
};

// eslint-disable-next-line no-control-regex
const CARACTERES_DE_CONTROL = /[\x00-\x1F\x7F]/;

export function validarCredencialSegura(value, maxLength) {
  if (CARACTERES_DE_CONTROL.test(value)) {
    return 'El valor contiene caracteres no permitidos';
  }
  if (value.length > maxLength) {
    return `Máximo ${maxLength} caracteres`;
  }
  return '';
}

const TIPOS_IMAGEN_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSIONES_IMAGEN_PERMITIDAS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const EXTENSIONES_PELIGROSAS = new Set([
  'exe', 'sh', 'bat', 'cmd', 'msi', 'php', 'js', 'jar', 'py',
  'dll', 'com', 'scr', 'vbs', 'ps1', 'apk', 'html', 'htm',
]);
const TAMANIO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

export function validarArchivoImagen(file) {
  if (!file) return undefined;
  if (!TIPOS_IMAGEN_PERMITIDOS.has(file.type)) return 'Solo se permiten imágenes JPG, PNG o WEBP';

  const partes = file.name.split('.');
  const extension = partes[partes.length - 1]?.toLowerCase();
  if (partes.length < 2 || !EXTENSIONES_IMAGEN_PERMITIDAS.has(extension)) {
    return 'Solo se permiten imágenes JPG, PNG o WEBP';
  }
  if (partes.slice(1, -1).some((segmento) => EXTENSIONES_PELIGROSAS.has(segmento.toLowerCase()))) {
    return 'Nombre de archivo no permitido';
  }
  if (file.size > TAMANIO_MAXIMO_IMAGEN) return 'La imagen no puede superar los 5MB';
  return undefined;
}

export function validarFortalezaPassword(v) {
  if (!v || v.length < 10) return 'Mínimo 10 caracteres';
  if (v.length > MAX_LEN.PASSWORD) return `Máximo ${MAX_LEN.PASSWORD} caracteres`;
  if (!/[a-z]/.test(v)) return 'Debe incluir al menos una minúscula';
  if (!/[A-Z]/.test(v)) return 'Debe incluir al menos una mayúscula';
  if (!/\d/.test(v)) return 'Debe incluir al menos un número';
  return undefined;
}

export function getPasswordRules() {
  return {
    required: 'La contraseña es requerida',
    validate: validarFortalezaPassword,
  };
}
