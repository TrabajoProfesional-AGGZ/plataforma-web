import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, ChevronLeft } from 'lucide-react';
import { CreateDisciplinaForm } from '../../components/createDisciplinaForm/CreateDisciplinaForm';
import ConfirmDeleteModal from '../../components/confirmDeleteModal/ConfirmDeleteModal';
import { getDisciplinas, createDisciplina, pausarDisciplina, inscribirSocioADisciplina } from '../../services/disciplinasService';
import { getSocioByNroSocio } from '../../services/sociosService';
import { usePermiso } from '../../hooks/usePermiso';
import EstadoBadge from '../../components/badge/EstadoBadge';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import EmptyState from '../../components/feedback/EmptyState';
import { handleActivateKey } from '../../utils/a11y';
import { useTheme } from '../../hooks/useTheme';
import './DisciplinasPage.css';
import '../../styles/ListPage.css';
import '../../styles/PageTableHeader.css';
import '../../styles/ListDetailShared.css';

function mensajeError(err, fallback) {
  return err?.message === 'servicio-no-disponible'
    ? 'El servicio no está disponible. Intentá de nuevo más tarde.'
    : fallback;
}

function DisciplinasPage() {
  const { logoSocio: logo } = useTheme();
  const location = useLocation();
  const puedeVerDisciplinas = usePermiso('ver_disciplinas');
  const puedeCrearDisciplina = usePermiso('crear_disciplina');
  const puedeBorrarDisciplina = usePermiso('borrar_disciplina');

  const [vista, setVista] = useState('lista');
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaActual, setDisciplinaActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crearOpen, setCrearOpen] = useState(false);
  const [pausarOpen, setPausarOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nroSocioInscribir, setNroSocioInscribir] = useState('');
  const [inscribiendoLoading, setInscribiendoLoading] = useState(false);
  const [inscribiendoError, setInscribiendoError] = useState('');
  const [inscribiendoExito, setInscribiendoExito] = useState(false);

  function cargarDisciplinas() {
    setLoading(true);
    setError('');
    getDisciplinas()
      .then((data) => setDisciplinas(data))
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar las disciplinas.')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!puedeVerDisciplinas) return;
    cargarDisciplinas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!location.state?.disciplinaId || disciplinas.length === 0) return;
    const found = disciplinas.find((d) => d.id === location.state.disciplinaId);
    if (found) { setDisciplinaActual(found); setVista('detalle'); }
  }, [disciplinas]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!disciplinaActual) return;
    setNroSocioInscribir('');
    setInscribiendoError('');
    setInscribiendoExito(false);
  }, [disciplinaActual]);

  async function handleInscribirSocio(e) {
    e.preventDefault();
    const nro = nroSocioInscribir.trim();
    if (!nro) return;
    setInscribiendoLoading(true);
    setInscribiendoError('');
    setInscribiendoExito(false);
    try {
      const socio = await getSocioByNroSocio(nro);
      await inscribirSocioADisciplina(disciplinaActual.id, socio.id);
      setNroSocioInscribir('');
      setInscribiendoExito(true);
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

  async function handleDisciplinaCreada(data) {
    setCrearOpen(false);
    const tempId = `temp-${Date.now()}`;
    setDisciplinas((prev) => [...prev, { ...data, id: tempId, estado: { nombre: 'Activa' } }]);
    try {
      const created = await createDisciplina(data);
      setDisciplinas((prev) =>
        prev.map((d) => (d.id === tempId ? { ...data, ...created } : d))
      );
    } catch (err) {
      setDisciplinas((prev) => prev.filter((d) => d.id !== tempId));
      setError(mensajeError(err, 'No se pudo crear la disciplina.'));
    }
  }

  async function handlePausar() {
    if (guardando) return;
    setGuardando(true);
    const id = disciplinaActual.id;
    const estadoAnterior = disciplinaActual.estado ?? { nombre: 'Activa' };
    setDisciplinas((prev) =>
      prev.map((d) => (d.id === id ? { ...d, estado: { nombre: 'Pausada' } } : d))
    );
    setVista('lista');
    setDisciplinaActual(null);
    setPausarOpen(false);
    try {
      await pausarDisciplina(id);
    } catch (err) {
      setDisciplinas((prev) =>
        prev.map((d) => (d.id === id ? { ...d, estado: estadoAnterior } : d))
      );
      setError(mensajeError(err, 'No se pudo pausar la disciplina.'));
    } finally {
      setGuardando(false);
    }
  }

  function renderListaContenido() {
    if (loading) {
      return (
        <div className="list-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      );
    }
    if (error && disciplinas.length === 0) {
      return <ErrorBanner mensaje={error} onReintentar={cargarDisciplinas} />;
    }
    if (disciplinas.length === 0) {
      return <EmptyState mensaje="No hay disciplinas registradas." />;
    }
    return (
      <div className="disciplinas-table-wrapper">
        <table className="disciplinas-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría de socio</th>
              <th>Sede</th>
              <th>Cupo máximo</th>
              <th>Arancelada</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {disciplinas.map((d) => {
              const verDetalle = () => { setDisciplinaActual(d); setVista('detalle'); };
              return (
              <tr
                key={d.id}
                className="disciplinas-tr-clickable"
                tabIndex={0}
                role="button"
                aria-label={`Ver detalle de ${d.nombre}`}
                onClick={verDetalle}
                onKeyDown={handleActivateKey(verDetalle)}
              >
                <td>{d.nombre}</td>
                <td>{d.categoria_socio?.nombre ?? '—'}</td>
                <td>{d.sede?.nombre ?? '—'}</td>
                <td>{d.cupo_maximo != null ? `${d.cupo_maximo} personas` : 'Sin límite'}</td>
                <td>
                  <EstadoBadge variant={d.arancelada ? 'success' : 'neutral'}>
                    {d.arancelada ? 'Sí' : 'No'}
                  </EstadoBadge>
                </td>
                <td>
                  <EstadoBadge variant={d.estado?.nombre === 'Pausada' ? 'warning' : 'success'}>
                    {d.estado?.nombre ?? 'Activa'}
                  </EstadoBadge>
                </td>
              </tr>
              );
            })}
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

          {error && disciplinas.length > 0 && <ErrorBanner mensaje={error} />}
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
                { label: 'Categoría de socio', value: disciplinaActual.categoria_socio?.nombre ?? '—' },
                { label: 'Sede', value: disciplinaActual.sede?.nombre ?? '—' },
                {
                  label: 'Cupo máximo',
                  value: disciplinaActual.cupo_maximo != null ? `${disciplinaActual.cupo_maximo} personas` : 'Sin límite',
                },
                { label: 'Arancelada', value: disciplinaActual.arancelada ? 'Sí' : 'No' },
                ...(disciplinaActual.arancelada
                  ? [{ label: 'Concepto de cobro', value: disciplinaActual.concepto_cobro }]
                  : []),
                {
                  label: 'Estado',
                  value: disciplinaActual.estado?.nombre ?? 'Activa',
                  color: disciplinaActual.estado?.nombre === 'Pausada' ? 'var(--status-warning-border)' : 'var(--status-success-border)',
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

          {puedeCrearDisciplina && (
            <div className="disciplinas-socios-section">
              <h3 className="disciplinas-socios-title">Inscribir socio</h3>
              <p className="disciplinas-socios-hint">
                Para ver los socios inscriptos en esta disciplina, andá a la sección Socios y filtrá por disciplina.
              </p>

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
              {inscribiendoError && <p className="disciplinas-inscribir-error">{inscribiendoError}</p>}
              {inscribiendoExito && <p className="disciplinas-inscribir-exito">Socio inscripto correctamente.</p>}
            </div>
          )}

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
        guardando={guardando}
        onCancel={() => setPausarOpen(false)}
        labelConfirmar="Pausar"
      />
    </div>
  );
}

export default DisciplinasPage;
