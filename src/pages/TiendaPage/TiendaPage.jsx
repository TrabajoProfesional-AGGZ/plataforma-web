import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, PackageSearch } from 'lucide-react';
import { getProductos, getProducto } from '../../services/productosService';
import { CreateProductoForm } from '../../components/createProductoForm/CreateProductoForm';
import { EditProductoForm } from '../../components/editProductoForm/EditProductoForm';
import { CrearCompraForm } from '../../components/crearCompraForm/CrearCompraForm';
import { createProducto } from '../../services/productosService';
import EstadoBadge from '../../components/badge/EstadoBadge';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import EmptyState from '../../components/feedback/EmptyState';
import { urlImagenSegura } from '../../utils/utils';
import { handleActivateKey } from '../../utils/a11y';
import { useTheme } from '../../hooks/useTheme';
import { usePermiso } from '../../hooks/usePermiso';
import './TiendaPage.css';
import '../../styles/ListPage.css';
import '../../styles/PageTableHeader.css';
import '../../styles/ListDetailShared.css';

function mensajeError(err, fallback) {
  return err?.message === 'servicio-no-disponible'
    ? 'El servicio no está disponible. Intentá de nuevo más tarde.'
    : fallback;
}

function TiendaPage() {
  const { logoSocio: logo } = useTheme();
  const puedeCrearCompra = usePermiso('crear_compra');

  const [vista, setVista] = useState('lista');
  const [productos, setProductos] = useState([]);
  const [productoActual, setProductoActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [crearOpen, setCrearOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [crearCompraOpen, setCrearCompraOpen] = useState(false);

  const imagenSegura = urlImagenSegura(productoActual?.imagen_url);

  async function cargarProductos() {
    setLoading(true);
    setError('');
    try {
      setProductos(await getProductos());
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los productos.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargarProductos(); }, []);

  async function handleClickFila(p) {
    setLoadingDetalle(true);
    setErrorDetalle('');
    setVista('detalle');
    try {
      setProductoActual(await getProducto(p.id));
    } catch (err) {
      setErrorDetalle(mensajeError(err, 'No se pudo cargar el producto.'));
    } finally {
      setLoadingDetalle(false);
    }
  }

  async function handleProductoCreado(data) {
    setCrearOpen(false);
    const tempId = `temp-${Date.now()}`;
    setProductos((prev) => [...prev, { ...data, id: tempId }]);
    try {
      const created = await createProducto(data);
      setProductos((prev) =>
        prev.map((p) => (p.id === tempId ? { ...data, ...created } : p))
      );
    } catch (err) {
      setProductos((prev) => prev.filter((p) => p.id !== tempId));
      setError(mensajeError(err, 'No se pudo crear el producto.'));
    }
  }

  function handleEditarExito(actualizado) {
    setProductoActual(actualizado);
    setProductos((prev) =>
      prev.map((p) => (p.id === actualizado.id ? { ...p, ...actualizado } : p))
    );
    setEditarOpen(false);
  }

  async function handleCompraCreada() {
    setCrearCompraOpen(false);
    // Refresca el detalle en vez de decrementar client-side, para no
    // desincronizar con el descuento de stock real hecho en el backend.
    try {
      const actualizado = await getProducto(productoActual.id);
      setProductoActual(actualizado);
      setProductos((prev) =>
        prev.map((p) => (p.id === actualizado.id ? { ...p, ...actualizado } : p))
      );
    } catch (err) {
      setErrorDetalle(mensajeError(err, 'No se pudo actualizar el stock del producto.'));
    }
  }

  function renderLista() {
    if (loading) {
      return (
        <div className="list-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      );
    }
    if (error && productos.length === 0) {
      return <ErrorBanner mensaje={error} onReintentar={cargarProductos} />;
    }
    if (productos.length === 0) {
      return <EmptyState mensaje="No hay productos registrados." />;
    }
    return (
      <div className="disciplinas-table-wrapper">
        <table className="disciplinas-tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr
                key={p.id}
                className="disciplinas-tr-clickable"
                tabIndex={0}
                role="button"
                aria-label={`Ver detalle de ${p.nombre}`}
                onClick={() => handleClickFila(p)}
                onKeyDown={handleActivateKey(() => handleClickFila(p))}
              >
                <td className="tienda-td-producto">
                  {urlImagenSegura(p.imagen_url) && (
                    <img
                      src={urlImagenSegura(p.imagen_url)}
                      alt=""
                      className="tienda-thumb"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {p.nombre}
                </td>
                <td>${Number(p.precio).toLocaleString('es-AR')}</td>
                <td>{p.stock}</td>
                <td>
                  <EstadoBadge variant={p.activo ? 'success' : 'warning'}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </EstadoBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="tienda-admin-page">
      {vista === 'lista' && (
        <>
          <h1 className="noticias-title">Tienda</h1>
          <div className="noticias-toolbar">
            <div />
            <button className="noticias-btn-crear" onClick={() => setCrearOpen(true)}>
              <Plus size={15} aria-hidden="true" />
              Nuevo producto
            </button>
          </div>
          {error && productos.length > 0 && <ErrorBanner mensaje={error} />}
          {renderLista()}
        </>
      )}

      {vista === 'detalle' && (
        <div className="tienda-detalle-view">
          <button
            type="button"
            className="tienda-btn-volver"
            onClick={() => { setVista('lista'); setProductoActual(null); setErrorDetalle(''); }}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Volver a la tienda
          </button>

          {loadingDetalle && (
            <div className="list-loading"><img src={logo} alt="" className="loading-logo" /></div>
          )}

          {errorDetalle && !loadingDetalle && <p className="tienda-detalle-error">{errorDetalle}</p>}

          {!loadingDetalle && !errorDetalle && productoActual && (
            <article className="tienda-detalle-card">
              <div className="tienda-detalle-media">
                {imagenSegura ? (
                  <img
                    src={imagenSegura}
                    alt={productoActual.nombre}
                    className="tienda-detalle-img"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="tienda-detalle-img-placeholder" aria-hidden="true">
                    <PackageSearch size={36} strokeWidth={1.5} />
                    <span>Sin foto</span>
                  </div>
                )}
              </div>

              <div className="tienda-detalle-info">
                <span className="tienda-detalle-eyebrow">Artículo de tienda</span>
                <h2 className="tienda-detalle-nombre">{productoActual.nombre}</h2>

                <div className="tienda-detalle-price-row">
                  <span className="tienda-detalle-precio">
                    ${Number(productoActual.precio).toLocaleString('es-AR')}
                  </span>
                  <EstadoBadge variant={productoActual.activo ? 'success' : 'warning'}>
                    {productoActual.activo ? 'Activo' : 'Inactivo'}
                  </EstadoBadge>
                </div>

                <div
                  className={`tienda-detalle-stock ${
                    productoActual.stock > 0 ? 'tienda-detalle-stock--ok' : 'tienda-detalle-stock--agotado'
                  }`}
                >
                  <span className="tienda-detalle-stock-dot" aria-hidden="true" />
                  {productoActual.stock > 0
                    ? `${productoActual.stock} unidades disponibles`
                    : 'Sin stock disponible'}
                </div>

                {productoActual.descripcion && (
                  <>
                    <div className="tienda-detalle-divider" />
                    <p className="tienda-detalle-desc-label">Descripción</p>
                    <p className="tienda-detalle-desc">{productoActual.descripcion}</p>
                  </>
                )}

                <div className="tienda-detalle-actions">
                  <button
                    type="button"
                    className="tienda-btn-editar"
                    onClick={() => setEditarOpen(true)}
                  >
                    Editar producto
                  </button>
                  {puedeCrearCompra && (
                    <button
                      type="button"
                      className="tienda-btn-editar"
                      onClick={() => setCrearCompraOpen(true)}
                      disabled={productoActual.stock <= 0}
                    >
                      Crear compra
                    </button>
                  )}
                </div>
              </div>
            </article>
          )}
        </div>
      )}

      {crearOpen && (
        <CreateProductoForm
          onSuccess={handleProductoCreado}
          onCancel={() => setCrearOpen(false)}
        />
      )}

      {editarOpen && productoActual && (
        <EditProductoForm
          producto={productoActual}
          onSuccess={handleEditarExito}
          onCancel={() => setEditarOpen(false)}
        />
      )}

      {crearCompraOpen && productoActual && (
        <CrearCompraForm
          producto={productoActual}
          onSuccess={handleCompraCreada}
          onCancel={() => setCrearCompraOpen(false)}
        />
      )}
    </div>
  );
}

export default TiendaPage;