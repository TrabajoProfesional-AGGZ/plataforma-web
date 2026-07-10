import { useState, useEffect } from 'react';
import { Plus, ChevronLeft } from 'lucide-react';
import { getNoticias, getNoticiasHistoricas, getNoticia, createNoticia, borrarNoticia } from '../../services/noticiasService';
import { usePermiso } from '../../hooks/usePermiso';
import { CreateNoticiaForm } from '../../components/createNoticiaForm/CreateNoticiaForm';
import { EditNoticiaForm } from '../../components/editNoticiaForm/EditNoticiaForm';
import ConfirmDeleteModal from '../../components/confirmDeleteModal/ConfirmDeleteModal';
import EstadoBadge from '../../components/badge/EstadoBadge';
import { urlImagenSegura } from '../../utils/utils';
import logo from '../../assets/logo_socio.png';
import './NoticiasPage.css';
import '../../styles/ListPage.css';
import '../../styles/PageTableHeader.css';
import '../../styles/ListDetailShared.css';

function NoticiasPage() {
  const puedeVerNoticias = usePermiso('ver_noticias');
  const puedeCrearNoticia = usePermiso('crear_noticia');
  const puedeEditarNoticia = usePermiso('editar_noticia');
  const puedeBorrarNoticia = usePermiso('borrar_noticia');

  const [vista, setVista] = useState('lista');
  const [noticias, setNoticias] = useState([]);
  const [noticiaActual, setNoticiaActual] = useState(null);
  const [verHistoricas, setVerHistoricas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [crearOpen, setCrearOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [eliminarOpen, setEliminarOpen] = useState(false);

  const imagenSegura = urlImagenSegura(noticiaActual?.imagen);

  useEffect(() => {
    if (!puedeVerNoticias) return;
    setLoading(true);
    getNoticias()
      .then((data) => setNoticias(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggleHistoricas() {
    const nuevaVista = !verHistoricas;
    setVerHistoricas(nuevaVista);
    setLoading(true);
    try {
      const data = nuevaVista ? await getNoticiasHistoricas() : await getNoticias();
      setNoticias(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function handleClickFila(n) {
    setLoadingDetalle(true);
    setErrorDetalle('');
    setVista('detalle');
    try {
      const detalle = await getNoticia(n.id);
      setNoticiaActual(detalle);
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setErrorDetalle('El servicio no está disponible. Intentá de nuevo más tarde.');
      } else {
        setErrorDetalle('No se pudo cargar la noticia.');
      }
    } finally {
      setLoadingDetalle(false);
    }
  }

  async function handleNoticiaCreada(data) {
    setCrearOpen(false);
    const tempId = `temp-${Date.now()}`;
    setNoticias((prev) => [...prev, { ...data, id: tempId }]);
    try {
      const created = await createNoticia(data);
      setNoticias((prev) =>
        prev.map((n) => (n.id === tempId ? { ...data, ...created } : n))
      );
    } catch {
      setNoticias((prev) => prev.filter((n) => n.id !== tempId));
    }
  }

  async function handleEliminar() {
    const id = noticiaActual.id;
    const backup = noticiaActual;
    setNoticias((prev) => prev.filter((n) => n.id !== id));
    setVista('lista');
    setNoticiaActual(null);
    setEliminarOpen(false);
    try {
      await borrarNoticia(id);
    } catch {
      setNoticias((prev) => [...prev, backup]);
    }
  }

  function handleEditarExito(actualizada) {
    setNoticiaActual(actualizada);
    setNoticias((prev) =>
      prev.map((n) => (n.id === actualizada.id ? { ...n, titulo: actualizada.titulo } : n))
    );
    setEditarOpen(false);
  }

  function estadoBadgeVariant(estado) {
    if (!estado) return 'warning';
    const e = estado.toLowerCase();
    if (e === 'publicada') return 'success';
    return 'warning';
  }

  function renderLista() {
    if (loading) {
      return (
        <div className="noticias-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      );
    }
    if (noticias.length === 0) {
      return <p className="disciplinas-empty">No hay noticias registradas.</p>;
    }
    return (
      <div className="disciplinas-table-wrapper">
        <table className="disciplinas-tabla">
          <thead>
            <tr>
              <th>Título</th>
              <th>Publicación</th>
              <th>Vencimiento</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {noticias.map((n) => (
              <tr
                key={n.id}
                className="disciplinas-tr-clickable"
                onClick={() => handleClickFila(n)}
              >
                <td>{n.titulo}</td>
                <td>{n.fecha_publicacion}</td>
                <td>{n.fecha_expiracion}</td>
                <td>
                  <EstadoBadge variant={estadoBadgeVariant(n.estado)}>
                    {n.estado ?? '—'}
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
    <div className="noticias-page">
      {vista === 'lista' && (
        <>
          <h1 className="noticias-title">Noticias</h1>
          <div className="noticias-toolbar">
            <button className="noticias-btn-historicas" onClick={handleToggleHistoricas}>
              {verHistoricas ? 'Ver vigentes' : 'Ver históricas'}
            </button>
            {puedeCrearNoticia && (
              <button className="noticias-btn-crear" onClick={() => setCrearOpen(true)}>
                <Plus size={15} aria-hidden="true" />
                Nueva noticia
              </button>
            )}
          </div>
          {renderLista()}
        </>
      )}

      {vista === 'detalle' && (
        <>
          <div className="noticias-nav">
            <button
              className="noticias-btn-volver"
              onClick={() => { setVista('lista'); setNoticiaActual(null); setErrorDetalle(''); }}
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Volver
            </button>
          </div>

          {loadingDetalle && (
            <div className="noticias-loading">
              <img src={logo} alt="" className="loading-logo" />
            </div>
          )}

          {errorDetalle && !loadingDetalle && (
            <p className="noticias-error">{errorDetalle}</p>
          )}

          {!loadingDetalle && !errorDetalle && noticiaActual && (
            <article className="noticias-diario">
              <header className="noticias-diario-masthead">
                <span className="noticias-diario-seccion">Noticias del Club</span>
                <div className="noticias-diario-masthead-right">
                  <span className="noticias-diario-fecha">Fecha de publicación: {noticiaActual.fecha_publicacion}</span>
                  {noticiaActual.fecha_expiracion && (
                    <span className="noticias-diario-fecha">Fecha de vencimiento: {noticiaActual.fecha_expiracion}</span>
                  )}
                </div>
              </header>

              <h1 className="noticias-diario-titulo">{noticiaActual.titulo}</h1>

              <hr className="noticias-diario-rule" />

              {imagenSegura && (
                <figure className="noticias-diario-figura">
                  <img
                    src={imagenSegura}
                    alt="Imagen de la noticia"
                    className="noticias-diario-imagen"
                    referrerPolicy="no-referrer"
                  />
                </figure>
              )}

              <div className="noticias-diario-cuerpo">
                {(noticiaActual.cuerpo || '').split(/\n\n+/).map((parrafo, i) => (
                  <p key={i}>
                    {parrafo.split('\n').map((linea, j, arr) =>
                      j < arr.length - 1 ? [linea, <br key={j} />] : linea
                    )}
                  </p>
                ))}
              </div>

              <div className="noticias-detalle-actions">
                {puedeEditarNoticia && (
                  <button className="noticias-btn-editar" onClick={() => setEditarOpen(true)}>
                    Editar
                  </button>
                )}
                {puedeBorrarNoticia && (
                  <button className="noticias-btn-eliminar" onClick={() => setEliminarOpen(true)}>
                    Eliminar
                  </button>
                )}
              </div>
            </article>
          )}
        </>
      )}

      {crearOpen && (
        <CreateNoticiaForm
          onSuccess={handleNoticiaCreada}
          onCancel={() => setCrearOpen(false)}
        />
      )}

      {editarOpen && noticiaActual && (
        <EditNoticiaForm
          noticia={noticiaActual}
          onSuccess={handleEditarExito}
          onCancel={() => setEditarOpen(false)}
        />
      )}

      <ConfirmDeleteModal
        open={eliminarOpen && !!noticiaActual}
        titulo="Eliminar noticia"
        mensaje={`¿Estás seguro de que querés eliminar "${noticiaActual?.titulo}"? Esta acción no se puede deshacer.`}
        onConfirm={handleEliminar}
        onCancel={() => setEliminarOpen(false)}
        labelConfirmar="Eliminar"
      />
    </div>
  );
}

export default NoticiasPage;
