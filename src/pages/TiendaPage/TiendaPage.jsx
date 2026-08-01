import { useState, useEffect } from 'react';
import { Plus, ChevronLeft } from 'lucide-react';
import { getProductos, getProducto } from '../../services/productosService';
import { usePermiso } from '../../hooks/usePermiso';
import { CreateProductoForm } from '../../components/createProductoForm/CreateProductoForm';
import { EditProductoForm } from '../../components/editProductoForm/EditProductoForm';
import { createProducto } from '../../services/productosService';
import EstadoBadge from '../../components/badge/EstadoBadge';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import EmptyState from '../../components/feedback/EmptyState';
import { urlImagenSegura } from '../../utils/utils';
import { handleActivateKey } from '../../utils/a11y';
import { useTheme } from '../../hooks/useTheme';
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

  const [vista, setVista] = useState('lista');
  const [productos, setProductos] = useState([]);
  const [productoActual, setProductoActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [crearOpen, setCrearOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);

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
                  {p.imagen_url && (
                    <img src={p.imagen_url} alt="" className="tienda-thumb" referrerPolicy="no-referrer" />
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
        <>
          <div className="noticias-nav">
            <button
              className="noticias-btn-volver"
              onClick={() => { setVista('lista'); setProductoActual(null); setErrorDetalle(''); }}
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Volver
            </button>
          </div>

          {loadingDetalle && (
            <div className="list-loading"><img src={logo} alt="" className="loading-logo" /></div>
          )}

          {errorDetalle && !loadingDetalle && <p className="noticias-error">{errorDetalle}</p>}

          {!loadingDetalle && !errorDetalle && productoActual && (
            <div className="tienda-detalle-admin">
              {imagenSegura && (
                <img src={imagenSegura} alt={productoActual.nombre} className="tienda-detalle-admin-img" referrerPolicy="no-referrer" />
              )}
              <div className="tienda-detalle-admin-info">
                <h2>{productoActual.nombre}</h2>
                <div className="tienda-detalle-admin-meta">
                  <span className="tienda-detalle-admin-precio">
                    ${Number(productoActual.precio).toLocaleString('es-AR')}
                  </span>
                  <span>Stock: {productoActual.stock}</span>
                  <EstadoBadge variant={productoActual.activo ? 'success' : 'warning'}>
                    {productoActual.activo ? 'Activo' : 'Inactivo'}
                  </EstadoBadge>
                </div>
                {productoActual.descripcion && (
                  <p className="tienda-detalle-admin-desc">{productoActual.descripcion}</p>
                )}
                <div className="noticias-detalle-actions">
                  <button className="noticias-btn-editar" onClick={() => setEditarOpen(true)}>
                    Editar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
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
    </div>
  );
}

export default TiendaPage;