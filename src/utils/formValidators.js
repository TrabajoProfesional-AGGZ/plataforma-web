export function validarFechaNacimiento(v) {
  const d = new Date(v);
  const now = new Date();
  if (isNaN(d.getTime())) return 'Fecha inválida';
  if (d > now) return 'La fecha no puede ser futura';
  if (now.getFullYear() - d.getFullYear() > 120) return 'Fecha inválida';
  return true;
}

export function validarFechaNacimientoOpcional(v) {
  if (!v) return true;
  return validarFechaNacimiento(v);
}
