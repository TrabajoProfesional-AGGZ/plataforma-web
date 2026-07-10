import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, ChevronLeft } from 'lucide-react';
import { CreateDisciplinaForm } from '../../components/createDisciplinaForm/CreateDisciplinaForm';
import ConfirmDeleteModal from '../../components/confirmDeleteModal/ConfirmDeleteModal';
import { getDisciplinas, createDisciplina, pausarDisciplina, getSociosByDisciplina, inscribirSocioADisciplina, extenderSuscripcionDisciplina } from '../../services/disciplinasService';
import { getSocioByNroSocio } from '../../services/sociosService';
import { usePermiso } from '../../hooks/usePermiso';
import { VerSocioModal } from '../../components/verSocioModal/VerSocioModal';
import EstadoBadge from '../../components/badge/EstadoBadge';
import logo from '../../assets/logo_socio.png';
import './DisciplinasPage.css';
import '../../styles/ListPage.css';
import '../../styles/PageTableHeader.css';
import '../../styles/ListDetailShared.css';

function DisciplinasPage() {
  const location = useLocation();
  const puedeVerDisciplinas = usePermiso('ver_disciplinas');
  const puedeCrearDisciplina = usePermiso('crear_disciplina');
  const puedeBorrarDisciplina = usePermiso('borrar_disciplina');

  const [vista, setVista] = useState('lista');
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaActual, setDisciplinaActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [crearOpen, setCrearOpen] = useState(false);
  const [pausarOpen, setPausarOpen] = useState(false);
  const [sociosDisciplina, setSociosDisciplina] = useState([]);
  const [loadingSociosDisciplina, setLoadingSociosDisciplina] = useState(false);
  const [verSocioData, setVerSocioData] = useState(null);
  const [verSocioOpen, setVerSocioOpen] = useState(false);
  const [filtroDisciplinaSocio, setFiltroDisciplinaSocio] = useState('');
  const [nroSocioInscribir, setNroSocioInscribir] = useState('');
  const [inscribiendoLoading, setInscribiendoLoading] = useState(false);
  const [inscribiendoError, setInscribiendoError] = useState('');
  const [estadoExtension, setEstadoExtension] = useState({});

  useEffect(() => {
    if (!puedeVerDisciplinas) return;
    setLoading(true);
    getDisciplinas()
      .then((data) => setDisciplinas(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pausarOpen && !verSocioOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setPausarOpen(false);
        setVerSocioOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pausarOpen, verSocioOpen]);

  useEffect(() => {
    if (!location.state?.disciplinaId || disciplinas.length === 0) return;
    const found = disciplinas.find((d) => d.id === location.state.disciplinaId);
    if (found) { setDisciplinaActual(found); setVista('detalle'); }
  }, [disciplinas]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!disciplinaActual) {
      setSociosDisciplina([]);
      setFiltroDisciplinaSocio('');
      return;
    }
    setFiltroDisciplinaSocio('');
    setNroSocioInscribir('');
    setInscribiendoError('');
    setEstadoExtension({});
    setLoadingSociosDisciplina(true);
    getSociosByDisciplina(disciplinaActual.id)
      .then((data) => setSociosDisciplina(data))
      .catch(() => setSociosDisciplina([]))
      .finally(() => setLoadingSociosDisciplina(false));
  }, [disciplinaActual]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleInscribirSocio(e) {
    e.preventDefault();
    const nro = nroSocioInscribir.trim();
    if (!nro) return;
    setInscribiendoLoading(true);
    setInscribiendoError('');
    try {
      const socio = await getSocioByNroSocio(nro);
      await inscribirSocioADisciplina(disciplinaActual.id, socio.id);
      const actualizados = await getSociosByDisciplina(disciplinaActual.id);
      setSociosDisciplina(actualizados);
      setNroSocioInscribir('');
    } catch (err) {
      const mensajes = {
        'socio-no-encontrado': 'No existe un socio con ese número.',
        'ya-inscripto': 'El socio ya está inscripto en esta disciplina.',
      };
      setInscribiendoError(mensajes[err.message] ?? 'No se pudo inscribir al socio.');
    } finally {
      setInscribiendoLoading(false);
    }
  }

  async function handleExtenderSuscripcion(idSocio) {
    setEstadoExtension((prev) => ({ ...prev, [idSocio]: 'loading' }));
    try {
      await extenderSuscripcionDisciplina(disciplinaActual.id, idSocio);
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

  async function handleDisciplinaCreada(data) {
    setCrearOpen(false);
    const tempId = `temp-${Date.now()}`;
    setDisciplinas((prev) => [...prev, { ...data, id: tempId, estado: 'Activa' }]);
    try {
      const created = await createDisciplina(data);
      setDisciplinas((prev) =>
        prev.map((d) => (d.id === tempId ? { ...data, ...created } : d))
      );
    } catch {
      setDisciplinas((prev) => prev.filter((d) => d.id !== tempId));
    }
  }

  async function handlePausar() {
    const id = disciplinaActual.id;
    const estadoAnterior = disciplinaActual.estado ?? 'Activa';
    setDisciplinas((prev) =>
      prev.map((d) => (d.id === id ? { ...d, estado: 'Pausada' } : d))
    );
    setVista('lista');
    setDisciplinaActual(null);
    setPausarOpen(false);
    try {
      await pausarDisciplina(id);
    } catch {
      setDisciplinas((prev) =>
        prev.map((d) => (d.id === id ? { ...d, estado: estadoAnterior } : d))
      );
    }
  }

  const sociosDisciplinaFiltrados = filtroDisciplinaSocio.trim()
    ? sociosDisciplina.filter((s) => String(s.nro_socio).includes(filtroDisciplinaSocio.trim()))
    : sociosDisciplina;

  function abrirVerSocio(socio) {
    setVerSocioData(socio);
    setVerSocioOpen(true);
  }

  function renderListaContenido() {
    if (loading) {
      return (
        <div className="disciplinas-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      );
    }
    if (disciplinas.length === 0) {
      return <p className="disciplinas-empty">No hay disciplinas registradas.</p>;
    }
    return (
      <div className="disciplinas-table-wrapper">
        <table className="disciplinas-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cupo máximo</th>
              <th>Arancelada</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {disciplinas.map((d) => (
              <tr
                key={d.id}
                className="disciplinas-tr-clickable"
                onClick={() => { setDisciplinaActual(d); setVista('detalle'); }}
              >
                <td>{d.nombre}</td>
                <td>{d.cupo_maximo} personas</td>
                <td>
                  <EstadoBadge variant={d.arancelada ? 'success' : 'neutral'}>
                    {d.arancelada ? 'Sí' : 'No'}
                  </EstadoBadge>
                </td>
                <td>
                  <EstadoBadge variant={d.estado === 'Pausada' ? 'warning' : 'success'}>
                    {d.estado ?? 'Activa'}
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
    <div className="disciplinas-page">
      {/* ── Vista: Lista ── */}
      {vista === 'lista' && (
        <>
          <h1 className="disciplinas-title">Disciplinas</h1>

          <div className="disciplinas-toolbar">
            {puedeCrearDisciplina && (
              <button className="disciplinas-btn-crear" onClick={() => setCrearOpen(true)}>
                <Plus size={15} aria-hidden="true" />
                Nueva disciplina
              </button>
            )}
          </div>

          {renderListaContenido()}
        </>
      )}

      {/* ── Vista: Detalle ── */}
      {vista === 'detalle' && disciplinaActual && (
        <>
          <div className="disciplinas-nav">
            <button className="disciplinas-btn-volver" onClick={() => setVista('lista')}>
              <ChevronLeft size={16} aria-hidden="true" />
              Volver
            </button>
          </div>

          <div className="disciplinas-detalle-content">
            <h1 className="disciplinas-detalle-nombre">{disciplinaActual.nombre}</h1>

            <div className="disciplinas-detalle-card">
              {[
                { label: 'Cupo máximo', value: `${disciplinaActual.cupo_maximo} personas` },
                { label: 'Arancelada', value: disciplinaActual.arancelada ? 'Sí' : 'No' },
                ...(disciplinaActual.arancelada
                  ? [{ label: 'Concepto de cobro', value: disciplinaActual.concepto_cobro }]
                  : []),
                {
                  label: 'Estado',
                  value: disciplinaActual.estado ?? 'Activa',
                  color: disciplinaActual.estado === 'Pausada' ? 'var(--status-warning-border)' : 'var(--status-success-border)',
                },
              ].map((field, i, arr) => (
                <div
                  key={field.label}
                  className="disciplinas-detalle-row"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-bg)' : 'none' }}
                >
                  <span className="disciplinas-detalle-row-label">{field.label}</span>
                  <span
                    className="disciplinas-detalle-row-value"
                    style={{ color: field.color ?? 'var(--color-text-primary)' }}
                  >
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="detalle-id">ID: {disciplinaActual.id}</p>
          </div>

          <div className="disciplinas-socios-section">
            <h3 className="disciplinas-socios-title">Socios inscriptos</h3>

            <div className="disciplinas-socios-toolbar">
              {!loadingSociosDisciplina && sociosDisciplina.length > 0 && (
                <input
                  type="text"
                  className="disciplinas-filtro-socio"
                  placeholder="Filtrar por N° de socio"
                  value={filtroDisciplinaSocio}
                  onChange={(e) => setFiltroDisciplinaSocio(e.target.value)}
                  aria-label="Filtrar por número de socio"
                />
              )}
              {puedeCrearDisciplina && (
                <form className="disciplinas-inscribir-form" onSubmit={handleInscribirSocio}>
                  <input
                    type="text"
                    className="disciplinas-filtro-socio"
                    placeholder="N° de socio a inscribir"
                    value={nroSocioInscribir}
                    onChange={(e) => setNroSocioInscribir(e.target.value)}
                    aria-label="Número de socio a inscribir"
                    disabled={inscribiendoLoading}
                  />
                  <button
                    type="submit"
                    className="disciplinas-btn-inscribir"
                    disabled={inscribiendoLoading || !nroSocioInscribir.trim()}
                  >
                    {inscribiendoLoading ? 'Inscribiendo…' : 'Inscribir socio'}
                  </button>
                </form>
              )}
            </div>
            {inscribiendoError && <p className="disciplinas-inscribir-error">{inscribiendoError}</p>}

            {loadingSociosDisciplina ? (
              <div className="disciplinas-loading">
                <img src={logo} alt="" className="loading-logo" />
              </div>
            ) : sociosDisciplina.length === 0 ? (
              <p className="disciplinas-empty">No hay socios inscriptos en esta disciplina.</p>
            ) : (
              <>
                {sociosDisciplinaFiltrados.length === 0 ? (
                  <p className="disciplinas-empty">No hay socios con ese número.</p>
                ) : (
                  <div className="disciplinas-table-wrapper">
                    <table className="disciplinas-tabla">
                      <thead>
                        <tr>
                          <th>N° Socio</th>
                          <th>Apellido y nombre</th>
                          <th>Estado</th>
                          {puedeCrearDisciplina && <th>Suscripción</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {sociosDisciplinaFiltrados.map((s) => (
                          <tr key={s.id}>
                            <td>
                              <button
                                type="button"
                                className="nro-socio-link"
                                onClick={() => abrirVerSocio(s)}
                              >
                                {s.nro_socio}
                              </button>
                            </td>
                            <td>{s.apellido} {s.nombre}</td>
                            <td>
                              <EstadoBadge estado={s.estado?.nombre ?? s.estado} />
                            </td>
                            {puedeCrearDisciplina && (
                              <td>
                                <button
                                  type="button"
                                  className="disciplinas-btn-extender"
                                  disabled={estadoExtension[s.id] === 'loading'}
                                  onClick={() => handleExtenderSuscripcion(s.id)}
                                >
                                  {labelExtenderSuscripcion(s.id)}
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {puedeBorrarDisciplina && (
            <div className="disciplinas-detalle-actions">
              <button className="disciplinas-btn-eliminar" onClick={() => setPausarOpen(true)}>
                Eliminar
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Formulario: Crear disciplina ── */}
      {crearOpen && (
        <CreateDisciplinaForm
          onSuccess={handleDisciplinaCreada}
          onCancel={() => setCrearOpen(false)}
        />
      )}

      <ConfirmDeleteModal
        open={pausarOpen && !!disciplinaActual}
        titulo="Pausar disciplina"
        mensaje={`¿Estás seguro de que querés pausar "${disciplinaActual?.nombre}"? La disciplina pasará al estado "Pausada" y no estará disponible para nuevas inscripciones.`}
        onConfirm={handlePausar}
        onCancel={() => setPausarOpen(false)}
        labelConfirmar="Pausar"
      />

      {verSocioOpen && verSocioData && (
        <VerSocioModal socio={verSocioData} onClose={() => setVerSocioOpen(false)} />
      )}
    </div>
  );
}

export default DisciplinasPage;
