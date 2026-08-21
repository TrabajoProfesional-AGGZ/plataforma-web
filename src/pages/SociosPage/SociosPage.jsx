import { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import { getSocios, deleteSocio } from '../../services/sociosService';
import { getDisciplinas, getSociosByDisciplina, extenderSuscripcionDisciplina } from '../../services/disciplinasService';
import { CreateSocioForm } from '../../components/createForm/CreateSocioForm';
import { EditSocioForm } from '../../components/editForm/EditSocioForm';
import ConfirmDeleteModal from '../../components/confirmDeleteModal/ConfirmDeleteModal';
import { ResolverListaEsperaModal } from '../../components/resolverListaEsperaModal/ResolverListaEsperaModal';
import { usePermiso } from '../../hooks/usePermiso';
import { useSortedList } from '../../hooks/useSortedList';
import { useListState } from '../../hooks/useListState';
import { useBackToRoot } from '../../hooks/useBackToRoot';
import { usePaginacion } from '../../hooks/usePaginacion';
import { estadoConfig } from '../../utils/estadoConfig';
import { urlImagenSegura } from '../../utils/utils';
import { MAX_LEN } from '../../utils/formValidators';
import { handleActivateKey } from '../../utils/a11y';
import EmptyState from '../../components/feedback/EmptyState';
import { SocioAccionesExtra } from '../../components/socioAccionesExtra/SocioAccionesExtra';
import { Paginacion } from '../../components/paginacion/Paginacion';
import { useTheme } from '../../hooks/useTheme';
import './SociosPage.css';
import '../../styles/ListPage.css';
import '../../styles/ListDetailShared.css';
import '../../styles/SocioCard.css';
import '../../styles/PageTableHeader.css';

const ORDEN_INICIAL = { campo: 'nro_socio', dir: 'asc' };

/** Normaliza el valor de una columna para ordenar: objetos anidados (categoría/estado) por su nombre, nro_socio como número. */
function getValorOrden(socio, campo) {
  const val = socio[campo];
  if (val && typeof val === 'object') return String(val.nombre ?? '').toLowerCase();
  if (campo === 'nro_socio') return Number(val) || 0;
  return String(val ?? '').toLowerCase();
}

/** Traduce el estado de orden de una columna al valor `aria-sort` correspondiente. */
function ariaSortDe(orden, campo) {
  if (orden.campo !== campo) return 'none';
  return orden.dir === 'asc' ? 'ascending' : 'descending';
}



/** Página de búsqueda/listado y detalle de socios: crear, editar, eliminar y filtrar por disciplina. */
function SociosPage() {
  const { logoSocio: logo } = useTheme();
  const puedeCrear = usePermiso('crear_socio');
  const puedeEditar = usePermiso('editar_socio');
  const puedeBorrar = usePermiso('borrar_socio');
  const puedeVerDisciplinas = usePermiso('ver_disciplinas');
  const puedeCrearDisciplina = usePermiso('crear_disciplina');

  const cacheSociosRef = useRef(null);

  const [nroSocio, setNroSocio] = useState('');
  const [modo, setModo] = useState('idle'); // idle | socio | lista | no-encontrado
  // modoRef evita que el callback onPage (asíncrono, con closure sobre modo) actúe con un valor de modo desactualizado.
  const modoRef = useRef(modo);
  useEffect(() => { modoRef.current = modo; }, [modo]);
  useBackToRoot(modo, 'lista', () => setModo('lista'));
  const { resultado, setResultado, loading, setLoading, error, setError } = useListState();
  const { orden, setOrden, toggleOrden, iconoOrden, aplicarOrden } = useSortedList(getValorOrden, ORDEN_INICIAL);

  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [disciplinas, setDisciplinas] = useState([]);
  const [estadoSuscripcionPorSocio, setEstadoSuscripcionPorSocio] = useState(null);
  const [errorDisciplinaFiltro, setErrorDisciplinaFiltro] = useState('');
  const [estadoExtension, setEstadoExtension] = useState({});
  const [listaEsperaModal, setListaEsperaModal] = useState(null);

  const [crearModalOpen, setCrearModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function inicializarSocios() {
      setLoading(true);
      setError(null);
      try {
        const socios = await getSocios({
          onPage: (parcial) => {
            if (!cancelled) {
              cacheSociosRef.current = parcial;
              if (modoRef.current === 'idle' || modoRef.current === 'lista') {
                setResultado(parcial);
                setModo('lista');
              }
              setLoading(false);
            }
          },
        });
        if (!cancelled) {
          cacheSociosRef.current = socios;
          if (modoRef.current === 'idle' || modoRef.current === 'lista') {
            setResultado(socios);
            setModo('lista');
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (err.message === 'servicio-no-disponible') {
            setError('El servicio no está disponible en este momento. Intentá de nuevo más tarde.');
          } else {
            setError('Error al obtener los socios. Intentá de nuevo.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    inicializarSocios();
    return () => { cancelled = true; };
  }, [setError, setLoading, setResultado]);

  useEffect(() => {
    if (!puedeVerDisciplinas) return;
    let cancelled = false;
    getDisciplinas()
      .then((data) => { if (!cancelled) setDisciplinas(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [puedeVerDisciplinas]);

  async function recargarSociosDeDisciplina() {
    if (!filtroDisciplina) return;
    setErrorDisciplinaFiltro('');
    try {
      const data = await getSociosByDisciplina(filtroDisciplina);
      setEstadoSuscripcionPorSocio(new Map(data.map((s) => [s.id, s.estado_suscripcion])));
    } catch {
      setEstadoSuscripcionPorSocio(new Map());
      setErrorDisciplinaFiltro('No se pudieron obtener los socios de la disciplina.');
    }
  }

  useEffect(() => {
    if (!filtroDisciplina) {
      setEstadoSuscripcionPorSocio(null);
      setErrorDisciplinaFiltro('');
      return;
    }
    let cancelled = false;
    setErrorDisciplinaFiltro('');
    getSociosByDisciplina(filtroDisciplina)
      .then((data) => {
        if (!cancelled) setEstadoSuscripcionPorSocio(new Map(data.map((s) => [s.id, s.estado_suscripcion])));
      })
      .catch(() => {
        if (!cancelled) {
          setEstadoSuscripcionPorSocio(new Map());
          setErrorDisciplinaFiltro('No se pudieron obtener los socios de la disciplina.');
        }
      });
    return () => { cancelled = true; };
  }, [filtroDisciplina]);

  /** Carga los socios de forma paginada (actualiza la vista con cada página vía onPage) y cachea el resultado completo. */
  async function cargarSocios() {
    setLoading(true);
    setError(null);
    setModo('lista');
    modoRef.current = 'lista';
    try {
      const socios = await getSocios({
        onPage: (parcial) => {
          cacheSociosRef.current = parcial;
          if (modoRef.current === 'idle' || modoRef.current === 'lista') {
            setResultado(parcial);
            setModo('lista');
          }
          setLoading(false);
        },
      });
      cacheSociosRef.current = socios;
      if (modoRef.current === 'idle' || modoRef.current === 'lista') {
        setResultado(socios);
        setModo('lista');
      }
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setError('El servicio no está disponible en este momento. Intentá de nuevo más tarde.');
      } else {
        setError('Error al obtener los socios. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function recargarSocios() {
    setNroSocio('');
    setOrden(ORDEN_INICIAL);
    setFiltroEstado('');
    setFiltroAbierto(false);
    setFiltroCategoria('');
    setFiltroDisciplina('');
    setEstadoExtension({});
    cacheSociosRef.current = null;
    await cargarSocios();
  }

  /** Busca por N° de socio usando la caché local si ya está disponible, para no reconsultar todo el listado. */
  async function handleBuscar(e) {
    e.preventDefault();
    if (!nroSocio.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let socios = cacheSociosRef.current;
      if (socios === null) {
        socios = await getSocios();
        cacheSociosRef.current = socios;
      }
      const encontrados = socios.filter(s => String(s.nro_socio) === String(nroSocio.trim()));
      if (encontrados.length === 0) {
        setModo('no-encontrado');
        setResultado(null);
      } else {
        setResultado(encontrados);
        setModo('lista');
      }
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setError('El servicio no está disponible en este momento. Intentá de nuevo más tarde.');
      } else {
        setError('Error al buscar el socio. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleVerTodos() {
    setNroSocio('');
    setOrden(ORDEN_INICIAL);
    setFiltroEstado('');
    setFiltroAbierto(false);
    setFiltroCategoria('');
    setFiltroDisciplina('');
    setEstadoExtension({});
    setError(null);
    if (cacheSociosRef.current !== null) {
      setResultado(cacheSociosRef.current);
      setModo('lista');
      return;
    }
    cargarSocios();
  }

  function abrirEditar() {
    setErrorModal('');
    setEditarModalOpen(true);
  }

  async function handleExtenderSuscripcion(e, idSocio) {
    e.stopPropagation();
    setEstadoExtension((prev) => ({ ...prev, [idSocio]: 'loading' }));
    try {
      await extenderSuscripcionDisciplina(filtroDisciplina, idSocio);
      setEstadoExtension((prev) => ({ ...prev, [idSocio]: 'exito' }));
    } catch {
      setEstadoExtension((prev) => ({ ...prev, [idSocio]: 'error' }));
    }
  }

  function labelExtenderSuscripcion(idSocio) {
    switch (estadoExtension[idSocio]) {
      case 'loading': return 'Extendiendo…';
      case 'exito': return 'Suscripción extendida';
      case 'error': return 'Error, reintentar';
      default: return 'Extender suscripcion';
    }
  }

  function abrirListaEsperaModal(e, socio) {
    e.stopPropagation();
    setListaEsperaModal(socio);
  }

  async function handleListaEsperaSuccess() {
    setListaEsperaModal(null);
    await recargarSociosDeDisciplina();
  }

  function abrirEliminar() {
    setErrorModal('');
    setEliminarModalOpen(true);
  }

  async function handleEliminar() {
    setGuardando(true);
    setErrorModal('');
    try {
      await deleteSocio(resultado.id);
      cacheSociosRef.current = null;
      setEliminarModalOpen(false);
      setModo('idle');
      setResultado(null);
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setErrorModal('El servicio no está disponible en este momento. Intentá de nuevo más tarde.');
      } else {
        setErrorModal('Error al eliminar el socio. Intentá de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  }

  const listaBase = Array.isArray(resultado) ? resultado : [];
  const listaFiltrada = listaBase.filter((s) => {
    const matchEstado = filtroEstado ? s.estado.nombre === filtroEstado : true;
    const matchCategoria = filtroCategoria ? s.categoria.nombre === filtroCategoria : true;
    const matchDisciplina = filtroDisciplina ? (estadoSuscripcionPorSocio?.has(s.id) ?? false) : true;
    return matchEstado && matchCategoria && matchDisciplina;
  });
  const listaOrdenada = aplicarOrden(listaFiltrada);
  const { pagina, totalPaginas, listaPaginada, irAPagina, resetPagina } = usePaginacion(listaOrdenada, 10);

  useEffect(() => {
    resetPagina();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado, filtroEstado, filtroCategoria, filtroDisciplina]);

  return (
    <div className="socios-page">
      <h1 className="socios-title">Consultar Socios</h1>
      <div className="socios-toolbar">
        <div className="socios-toolbar-left">
          <form className="socios-search-form" onSubmit={handleBuscar}>
            <div className="socios-search-container">
              <Search size={16} aria-hidden="true" />
              <input
                className="socios-search-input"
                type="text"
                placeholder="Buscar por N° de socio"
                value={nroSocio}
                onChange={(e) => setNroSocio(e.target.value)}
                maxLength={MAX_LEN.NRO_SOCIO}
              />
            </div>
            <button
              className="socios-search-button"
              type="submit"
              disabled={loading || !nroSocio.trim()}
            >
              Buscar
            </button>
          </form>
        </div>
        <div className="socios-toolbar-right">
          <button className="socios-ver-todos-button" onClick={handleVerTodos}>
            Ver todos
          </button>
          {puedeCrear && (
            <button className="socios-crear-button" onClick={() => setCrearModalOpen(true)} disabled={loading}>
              <Plus size={15} aria-hidden="true" />
              Crear socio
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="list-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      )}
      {error && <p className="socios-error">{error}</p>}

      {!loading && modo === 'no-encontrado' && (
        <p className="socios-no-encontrado">No se encontró ningún socio con ese N° de socio.</p>
      )}

      {!loading && modo === 'socio' && resultado && (() => {
        const cfg = estadoConfig(resultado.estado.nombre);
        const fotoSegura = urlImagenSegura(resultado.foto_url);
        return (
          <div className="socios-card">
            <div className="socios-card-inner">
              <div className="detalle-logo-circle" style={{ '--estado-color': cfg.border }}>
                {fotoSegura
                  ? <img src={fotoSegura} alt="" className="detalle-logo-img" referrerPolicy="no-referrer" />
                  : <img src={cfg.logo} alt="" className="detalle-logo-img" />}
              </div>
              <div className="socios-card-data">
                <div className="detalle-card-data-header">
                  <span className="detalle-full-name">{resultado.apellido} {resultado.nombre}</span>
                  <span className="detalle-estado-badge" style={{ backgroundColor: cfg.bg, color: cfg.border, borderColor: cfg.border }}>
                    {resultado.estado.nombre}
                  </span>
                </div>
                <div className="socios-card-row">
                  <span className="socios-card-label">N° Socio</span>
                  <span>{resultado.nro_socio}</span>
                </div>
                <div className="socios-card-row">
                  <span className="socios-card-label">DNI</span>
                  <span>{resultado.nro_documento}</span>
                </div>
                <div className="socios-card-row">
                  <span className="socios-card-label">Nacimiento</span>
                  <span>{resultado.fecha_nacimiento}</span>
                </div>
                <div className="socios-card-row">
                  <span className="socios-card-label">Email</span>
                  <span>{resultado.email}</span>
                </div>
                {resultado.telefono && (
                  <div className="socios-card-row">
                    <span className="socios-card-label">Teléfono</span>
                    <span>{resultado.telefono}</span>
                  </div>
                )}
                <div className="socios-card-row">
                  <span className="socios-card-label">Categoría</span>
                  <span>{resultado.categoria.nombre}</span>
                </div>
                <SocioAccionesExtra
                  idSocio={resultado.id}
                  nroSocio={resultado.nro_socio}
                  nombreSocio={`${resultado.apellido} ${resultado.nombre}`}
                />
              </div>
            </div>
            <div className="socios-card-actions">
              {puedeBorrar && (
                <button className="socios-btn-eliminar" onClick={abrirEliminar}>
                  Eliminar
                </button>
              )}
              {puedeEditar && (
                <button className="socios-btn-editar" onClick={abrirEditar}>
                  Editar
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {!loading && modo === 'lista' && Array.isArray(resultado) && (() => {
        if (resultado.length === 0) {
          return (
            <div className="socios-table-wrapper">
              <EmptyState mensaje="No hay socios registrados." />
            </div>
          );
        }
        const estadosUnicos = [...new Set(resultado.map(s => s.estado.nombre))].sort();
        const categoriasUnicas = [...new Set(resultado.map(s => s.categoria.nombre))].sort();
        const mostrarColumnaSuscripcion = !!filtroDisciplina && puedeCrearDisciplina;
        return (
          <>
            <div className="socios-filtros">
              <button
                className="socios-filtro-toggle"
                type="button"
                onClick={() => setFiltroAbierto(p => !p)}
              >
                Filtrar por
              </button>
              {filtroAbierto && (
                <div className="socios-filtros-dropdowns">
                  <div className="socios-filtros-grupo">
                    <select
                      className="socios-filtro-select"
                      value={filtroCategoria}
                      onChange={(e) => setFiltroCategoria(e.target.value)}
                    >
                      <option value="">Categoría: Todas</option>
                      {categoriasUnicas.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="socios-filtros-grupo">
                    <select
                      id="filtro-estado"
                      className="socios-filtro-select"
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                      <option value="">Estado: Todos</option>
                      {estadosUnicos.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  {puedeVerDisciplinas && disciplinas.length > 0 && (
                    <div className="socios-filtros-grupo">
                      <select
                        id="filtro-disciplina"
                        className="socios-filtro-select"
                        value={filtroDisciplina}
                        onChange={(e) => setFiltroDisciplina(e.target.value)}
                      >
                        <option value="">Disciplina: Todas</option>
                        {disciplinas.map(d => (
                          <option key={d.id} value={d.id}>{d.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
            {errorDisciplinaFiltro && <p className="socios-error">{errorDisciplinaFiltro}</p>}
            <div className="socios-table-wrapper">
              {listaFiltrada.length === 0 ? (
                <EmptyState mensaje="No hay socios con los filtros seleccionados." />
              ) : (
                <table className="socios-table">
                  <thead>
                    <tr>
                      <th className="socios-th-sort" aria-sort={ariaSortDe(orden, 'nro_socio')}>
                        <button type="button" className="th-sort-btn" onClick={() => toggleOrden('nro_socio')}>
                          N° Socio{iconoOrden('nro_socio')}
                        </button>
                      </th>
                      <th className="socios-th-sort" aria-sort={ariaSortDe(orden, 'apellido')}>
                        <button type="button" className="th-sort-btn" onClick={() => toggleOrden('apellido')}>
                          Apellido{iconoOrden('apellido')}
                        </button>
                      </th>
                      <th className="socios-th-sort" aria-sort={ariaSortDe(orden, 'nombre')}>
                        <button type="button" className="th-sort-btn" onClick={() => toggleOrden('nombre')}>
                          Nombre{iconoOrden('nombre')}
                        </button>
                      </th>
                      <th className="socios-th-sort" aria-sort={ariaSortDe(orden, 'categoria')}>
                        <button type="button" className="th-sort-btn" onClick={() => toggleOrden('categoria')}>
                          Categoría{iconoOrden('categoria')}
                        </button>
                      </th>
                      <th className="socios-th-sort" aria-sort={ariaSortDe(orden, 'estado')}>
                        <button type="button" className="th-sort-btn" onClick={() => toggleOrden('estado')}>
                          Estado{iconoOrden('estado')}
                        </button>
                      </th>
                      {mostrarColumnaSuscripcion && <th>Suscripción</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {listaPaginada.map((s) => {
                      const cfg = estadoConfig(s.estado.nombre);
                      const verDetalle = () => { setResultado(s); setModo('socio'); };
                      return (
                        <tr
                          key={s.id}
                          className="socios-tr-clickable"
                          tabIndex={0}
                          role="button"
                          aria-label={`Ver detalle de ${s.apellido} ${s.nombre}`}
                          onClick={verDetalle}
                          onKeyDown={handleActivateKey(verDetalle)}
                        >
                          <td>{s.nro_socio}</td>
                          <td>{s.apellido}</td>
                          <td>{s.nombre}</td>
                          <td>{s.categoria.nombre}</td>
                          <td>
                            <span
                              className="socios-estado-cell"
                              style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                            >
                              <img src={cfg.logo} alt="" className="socios-estado-logo" />
                              {s.estado.nombre}
                            </span>
                          </td>
                          {mostrarColumnaSuscripcion && (
                            <td>
                              {estadoSuscripcionPorSocio?.get(s.id) === 'en_espera' ? (
                                <button
                                  type="button"
                                  className="socios-btn-extender"
                                  onClick={(e) => abrirListaEsperaModal(e, s)}
                                >
                                  Quitar de lista de espera
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="socios-btn-extender"
                                  disabled={estadoExtension[s.id] === 'loading'}
                                  onClick={(e) => handleExtenderSuscripcion(e, s.id)}
                                >
                                  {labelExtenderSuscripcion(s.id)}
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiarPagina={irAPagina} />
          </>
        );
      })()}

      {/* Modal crear socio */}
      {crearModalOpen && (
        <CreateSocioForm
          onSuccess={() => { setCrearModalOpen(false); recargarSocios(); }}
          onCancel={() => setCrearModalOpen(false)}
        />
      )}

      {/* Modal editar socio */}
      {editarModalOpen && resultado && (
        <EditSocioForm
          socio={resultado}
          onSuccess={(socioActualizado) => { setResultado(socioActualizado); setEditarModalOpen(false); }}
          onCancel={() => setEditarModalOpen(false)}
        />
      )}

      <ConfirmDeleteModal
        open={eliminarModalOpen && !!resultado}
        titulo="Eliminar socio"
        mensaje={`¿Estás seguro de que querés eliminar al socio N° ${resultado?.nro_socio}?`}
        onConfirm={handleEliminar}
        onCancel={() => setEliminarModalOpen(false)}
        guardando={guardando}
        errorModal={errorModal}
      />

      {listaEsperaModal && (
        <ResolverListaEsperaModal
          idDisciplina={filtroDisciplina}
          idSocio={listaEsperaModal.id}
          nombreSocio={`${listaEsperaModal.apellido} ${listaEsperaModal.nombre}`}
          onSuccess={handleListaEsperaSuccess}
          onCancel={() => setListaEsperaModal(null)}
        />
      )}
    </div>
  );
}

export default SociosPage;
