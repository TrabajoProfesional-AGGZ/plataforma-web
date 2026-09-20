import { LayoutDashboard, Users, ShieldCheck, Building2, Trophy, Newspaper, Ticket, BarChart3, Bell, Settings, ShoppingBag, CreditCard } from 'lucide-react';

/**
 * Fuente única de verdad de las secciones: sidebar, dashboard y título de
 * documento leen de acá. `permiso: null` = visible para cualquier autenticado.
 * `enDashboard: false` saca la card de la portada sin sacarla del menú.
 */
export const SECCIONES = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, permiso: null, enDashboard: false },
  { to: '/socios', label: 'Socios', Icon: Users, permiso: 'ver_socios', descripcion: 'Crear nuevos socios y consultar el padrón.' },
  { to: '/usuarios', label: 'Usuarios', Icon: ShieldCheck, permiso: 'ver_usuarios', descripcion: 'Crear nuevos usuarios administrativos y gestionar roles/permisos.' },
  { to: '/instalaciones', label: 'Reservas e Instalaciones', Icon: Building2, permiso: 'ver_instalaciones', descripcion: 'Administrar espacios físicos y reservas.' },
  { to: '/disciplinas', label: 'Disciplinas', Icon: Trophy, permiso: 'ver_disciplinas', descripcion: 'Crear, modificar, eliminar o consultar disciplinas.' },
  { to: '/noticias', label: 'Noticias', Icon: Newspaper, permiso: 'ver_noticias', descripcion: 'Publicar noticias' },
  { to: '/eventos', label: 'Eventos', Icon: Ticket, permiso: 'ver_eventos', descripcion: 'Crear eventos y reservar entradas.' },
  { to: '/metricas', label: 'Métricas', Icon: BarChart3, permiso: 'ver_metricas', descripcion: 'Consultar métricas financieras, de uso y predicción de morosidad.' },
  { to: '/alertas', label: 'Alertas', Icon: Bell, permiso: 'ver_alertas', descripcion: 'Crear alertas para los socios' },
  { to: '/tienda', label: 'Tienda', Icon: ShoppingBag, permiso: null, descripcion: 'Catálogo de productos y compras en caja.' },
  // El gateway sólo puede gatear esta pantalla por `tipo: admin`, que lo tiene cualquier
  // usuario del panel. Acá se pide además `ver_pagos_pendientes`: es a propósito más estricto
  // que la API, porque conectar la cuenta donde entra el dinero del club no es de cualquiera.
  { to: '/cobros', label: 'Cobros', Icon: CreditCard, permiso: 'ver_pagos_pendientes', descripcion: 'Conectar la cuenta de Mercado Pago con la que cobra el club.' },
  { to: '/perfil', label: 'Perfil', Icon: Settings, permiso: null, enDashboard: false },
];

export const seccionPorRuta = (pathname) => SECCIONES.find((s) => s.to === pathname) ?? null;
