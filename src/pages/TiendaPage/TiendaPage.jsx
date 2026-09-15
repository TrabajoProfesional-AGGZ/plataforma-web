import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, PackageSearch, ChevronRight } from 'lucide-react';
import { getProductos, getProducto } from '../../services/productosService';
import { CreateProductoForm } from '../../components/createProductoForm/CreateProductoForm';
import { EditProductoForm } from '../../components/editProductoForm/EditProductoForm';
import { CrearCompraForm } from '../../components/crearCompraForm/CrearCompraForm';
import { DetailHeader } from '../../components/DetailHeader/DetailHeader';
import { StyledSelect } from '../../components/createForm/FormFields';
import { createProducto } from '../../services/productosService';
import EstadoBadge from '../../components/badge/EstadoBadge';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import EmptyState from '../../components/feedback/EmptyState';
import { SkeletonRows } from '../../components/feedback/SkeletonRows';
import { urlImagenSegura } from '../../utils/utils';
import { handleActivateKey } from '../../utils/a11y';
import { usePermiso } from '../../hooks/usePermiso';
import { usePaginacion } from '../../hooks/usePaginacion';
import { Paginacion } from '../../components/paginacion/Paginacion';
import './TiendaPage.css';
import '../../styles/ListPage.css';
import '../../styles/PageTableHeader.css';
import '../../styles/ListDetailShared.css';

/** Traduce un error de servicio a un mensaje amigable, o usa el mensaje por defecto. */
function mensajeError(err, fallback) {
  return err?.message === 'servicio-no-disponible'
    ? 'El servicio no está disponible. Intentá de nuevo más tarde.'
    : fallback;
}

/** Página de catálogo y detalle de productos: crear, editar y crear compras para un socio. */
function TiendaPage() {
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
  const [ordenTienda, setOrdenTienda] = useState('nombre_asc');

  const imagenSegura = urlImagenSegura(productoActual?.imagen_url);
  const detalleListo = !loadingDetalle && !errorDetalle && !!productoActual;

  const productosOrdenados = [...productos].sort((a, b) => {
    if (ordenTienda === 'precio_asc') return Number(a.precio) - Number(b.precio);
    if (ordenTienda === 'precio_desc') return Number(b.precio) - Number(a.precio);
    return a.nombre.localeCompare(b.nombre);
  });
  const { pagina, totalPaginas, listaPaginada, irAPagina, resetPagina } = usePaginacion(productosOrdenados, 10);

  async function cargarProductos() {
    setLoading(true);
    setError('');
    try {
      setProductos(await getProductos());
      resetPagina();
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los productos.'));
    } finally {
      setLoading(false);
    }
  }

  function handleCambiarOrden(e) {
    setOrdenTienda(e.target.value);
    resetPagina();
  }

  useEffect(() => {
    cargarProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  /** Agrega el producto de forma optimista y lo reemplaza (o revierte) según la respuesta del backend. */
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
      return <SkeletonRows n={6} />;
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
              <th className="td-num">Precio</th>
              <th className="td-num">Stock</th>
              <th className="td-center">Estado</th>
              <th className="td-chevron" aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            {listaPaginada.map((p) => (
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
                <td className="td-num">${Number(p.precio).toLocaleString('es-AR')}</td>
                <td className="td-num">{p.stock}</td>
                <td className="td-center">
                  <EstadoBadge variant={p.activo ? 'success' : 'warning'}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </EstadoBadge>
                </td>
                <td className="td-chevron"><ChevronRight size={16} aria-hidden="true" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiarPagina={irAPagina} />
      </div>
    );
  }

  return (
    <div className="tienda-admin-page">
      {vista === 'lista' && (
        <>
          <h1 className="page-title">Tienda</h1>
          <div className="noticias-toolbar">
            <div className="tienda-orden-select-wrap">
              <StyledSelect
                className="filtros-select-trigger"
                value={ordenTienda}
                onChange={handleCambiarOrden}
                aria-label="Ordenar por"
              >
                <option value="nombre_asc">Nombre (A-Z)</option>
                <option value="precio_asc">Precio: menor a mayor</option>
                <option value="precio_desc">Precio: mayor a menor</option>
              </StyledSelect>
            </div>
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
          <DetailHeader
            onBack={() => { setVista('lista'); setProductoActual(null); setErrorDetalle(''); }}
            titulo={detalleListo ? productoActual.nombre : null}
            estado={detalleListo && (
              <EstadoBadge variant={productoActual.activo ? 'success' : 'warning'}>
                {productoActual.activo ? 'Activo' : 'Inactivo'}
              </EstadoBadge>
            )}
            acciones={detalleListo && (
              <>
                <button type="button" className="btn-outline" onClick={() => setEditarOpen(true)}>
                  Editar producto
                </button>
                {puedeCrearCompra && (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setCrearCompraOpen(true)}
                    disabled={productoActual.stock <= 0}
                  >
                    Crear compra
                  </button>
                )}
              </>
            )}
          />

          {loadingDetalle && <SkeletonRows n={4} />}

          {errorDetalle && !loadingDetalle && <ErrorBanner mensaje={errorDetalle} />}

          {detalleListo && (
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
                <div className="tienda-detalle-price-row">
                  <span className="tienda-detalle-precio">
                    ${Number(productoActual.precio).toLocaleString('es-AR')}
                  </span>
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
              </div>
            </article>
          )}
        </div>
      )}

      <AnimatePresence>
        {crearOpen && (
          <CreateProductoForm
            key="crear"
            onSuccess={handleProductoCreado}
            onCancel={() => setCrearOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editarOpen && productoActual && (
          <EditProductoForm
            key="editar"
            producto={productoActual}
            onSuccess={handleEditarExito}
            onCancel={() => setEditarOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {crearCompraOpen && productoActual && (
          <CrearCompraForm
            key="crear-compra"
            producto={productoActual}
            onSuccess={handleCompraCreada}
            onCancel={() => setCrearCompraOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default TiendaPage;