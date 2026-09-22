import { fetchTo } from '../utils/utils';

/**
 * Conexión de la cuenta de Mercado Pago con la que cobra el club.
 *
 * Cada club cobra con su **propia** cuenta, conectada por OAuth, así que el dinero le entra
 * directo y SocioUnido no intermedia fondos. El club nunca viaja en estas llamadas: sale del
 * claim `club_id` del token y el gateway lo propaga como `X-Club-Id`. Si lo eligiera el
 * frontend, un admin podría dejar la cuenta de su club conectada como la de otro.
 */

/**
 * Estado de la cuenta de cobro del club: `conectado`, `desvinculado` o `sin_conectar`.
 * No devuelve ningún token — es información para decidir qué mostrar, no para cobrar.
 * @returns {Promise<{club_id: string, slug: string, estado: string, conectado: boolean, mp_user_id: string|null, expira_el: string|null}>}
 * @throws {Error} 'servicio-no-disponible' | 'sin-permiso'
 */
export async function getEstadoMercadoPago() {
  const res = await fetchTo('/api/v1/pagos/oauth/estado', 'GET');
  if (res.status === 401 || res.status === 403) throw new Error('sin-permiso');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al consultar la cuenta de Mercado Pago');
  return res.json();
}

/**
 * La URL de Mercado Pago a la que hay que mandar al admin para que autorice el cobro.
 * Lleva un `state` firmado con el club, que es lo único que ata la vuelta a este club.
 * @returns {Promise<string>}
 * @throws {Error} 'servicio-no-disponible' | 'sin-permiso' | 'oauth-no-configurado'
 */
export async function getUrlAutorizacionMercadoPago() {
  const res = await fetchTo('/api/v1/pagos/oauth/autorizar', 'GET');
  if (res.status === 401 || res.status === 403) throw new Error('sin-permiso');
  // 503 acá no es "el servicio está caído" sino "faltan las credenciales de la aplicación de
  // Mercado Pago en el servidor", que es un problema de configuración y no de conexión.
  if (res.status === 503) throw new Error('oauth-no-configurado');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al iniciar la conexión con Mercado Pago');
  const { url_autorizacion: url } = await res.json();
  return url;
}
