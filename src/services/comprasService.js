import { fetchTo } from '../utils/utils';

/** Crea una compra de un producto para un socio, descontando stock en el backend. */
export async function crearCompra({ id_producto, id_socio, cantidad }) {
  const res = await fetchTo('/api/v1/compras', 'POST', { id_producto, id_socio, cantidad });
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const tipo = body?.detail?.tipo;
    if (tipo) throw new Error(tipo); // sin_stock / producto_inactivo / moroso / suspendido
    throw new Error('Error al crear la compra');
  }
  return res.json();
}
