/**
 * Mapa de clave de permiso (tal como llega en el array de permisos del login) a su etiqueta
 * legible en español. Fuente de verdad del frontend: los permisos se cargan manualmente en la
 * base de datos, sin seed automático.
 */
export const PERMISO_LABELS = {
  'ver_socios':        'Ver socios',
  'crear_socio':       'Crear socio',
  'editar_socio':      'Editar socio',
  'borrar_socio':      'Dar de baja socio',
  'ver_usuarios':      'Ver usuarios',
  'crear_usuario':     'Crear usuario',
  'editar_usuario':    'Editar usuario',
  'borrar_usuario':    'Dar de baja usuario',
  'ver_reservas':      'Ver reservas',
  'crear_reserva':     'Crear reserva',
  'borrar_reserva':    'Dar de baja reserva',
  'crear_instalacion': 'Crear instalación',
  'ver_instalaciones': 'Ver instalaciones',
  'borrar_instalacion':'Dar de baja instalación',
  'crear_disciplina': 'Crear disciplina',
  'ver_disciplinas': 'Ver disciplinas',
  'borrar_disciplina': 'Dar de baja disciplina',
  'crear_noticia': 'Crear noticia',
  'ver_noticias': 'Ver noticias',
  'editar_noticia': 'Editar noticia',
  'borrar_noticia': 'Dar de baja noticia',
  'crear_alerta': 'Crear alerta',
  'ver_alertas': 'Ver alertas',
  'borrar_alerta': 'Dar de baja alerta',
  'ver_metricas': 'Ver las metricas del club',
  'ver_tramites': 'Ver trámites',
  'crear_evento': 'Crear evento',
  'ver_eventos': 'Ver eventos',
  'ver_pagos_pendientes': 'Ver pagos pendientes',
  'crear_entrada': 'Reservar entrada para socio',
  'crear_compra': 'Crear compra para socio'
};

/** Etiqueta legible por módulo (clave = lo que devuelve `moduloDePermiso`), para agrupar `PermisosModal`. */
export const PERMISO_MODULO = {
  socios: 'Socios',
  usuarios: 'Usuarios',
  reservas: 'Reservas',
  instalaciones: 'Instalaciones',
  disciplinas: 'Disciplinas',
  noticias: 'Noticias',
  alertas: 'Alertas',
  metricas: 'Métricas',
  tramites: 'Trámites',
  eventos: 'Eventos',
  pagos_pendientes: 'Pagos',
  entradas: 'Eventos',
  compras: 'Tienda',
};

/** Singular → plural para las claves de permiso que no coinciden con `PERMISO_MODULO` tal cual. */
const SINGULAR_A_PLURAL = {
  socio: 'socios',
  usuario: 'usuarios',
  reserva: 'reservas',
  instalacion: 'instalaciones',
  disciplina: 'disciplinas',
  noticia: 'noticias',
  alerta: 'alertas',
  evento: 'eventos',
  entrada: 'entradas',
  compra: 'compras',
};

/** Módulo (clave de `PERMISO_MODULO`) al que pertenece una clave de permiso, tomando lo que sigue al primer `_`. */
export function moduloDePermiso(key) {
  const resto = key.slice(key.indexOf('_') + 1);
  return SINGULAR_A_PLURAL[resto] ?? resto;
}
