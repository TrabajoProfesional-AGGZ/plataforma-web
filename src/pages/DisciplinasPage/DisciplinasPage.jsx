import { useState, useEffect } from 'react';
import { Plus, ChevronLeft } from 'lucide-react';
import { CreateDisciplinaForm } from '../../components/createDisciplinaForm/CreateDisciplinaForm';
import ConfirmDeleteModal from '../../components/confirmDeleteModal/ConfirmDeleteModal';
import { getDisciplinas, createDisciplina, pausarDisciplina, getSociosByDisciplina } from '../../services/disciplinasService';
import { usePermiso } from '../../hooks/usePermiso';
import logo from '../../assets/logo_socio.png';
import './DisciplinasPage.css';
import '../../styles/ListPage.css';
import '../../styles/PageTableHeader.css';
import '../../styles/ListDetailShared.css';

function DisciplinasPage() {
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

  useEffect(() => {
    if (!puedeVerDisciplinas) return;
    setLoading(true);
    getDisciplinas()
      .then((data) => setDisciplinas(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pausarOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setPausarOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pausarOpen]);

  useEffect(() => {
    if (!disciplinaActual) {
      setSociosDisciplina([]);
      return;
    }
    setLoadingSociosDisciplina(true);
    getSociosByDisciplina(disciplinaActual.id)
      .then((data) => setSociosDisciplina(data))
      .catch(() => setSociosDisciplina([]))
      .finally(() => setLoadingSociosDisciplina(false));
  }, [disciplinaActual]); // eslint-disable-line react-hooks/exhaustive-deps

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
                  <span className={`disciplinas-badge ${d.arancelada ? 'badge-arancelada' : 'badge-no-arancelada'}`}>
                    {d.arancelada ? 'Sí' : 'No'}
                  </span>
                </td>
                <td>
                  <span className={`disciplinas-badge ${d.estado === 'Pausada' ? 'badge-pausada' : 'badge-activa'}`}>
                    {d.estado ?? 'Activa'}
                  </span>
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
                  color: disciplinaActual.estado === 'Pausada' ? '#9A6200' : '#155724',
                },
              ].map((field, i, arr) => (
                <div
                  key={field.label}
                  className="disciplinas-detalle-row"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none' }}
                >
                  <span className="disciplinas-detalle-row-label">{field.label}</span>
                  <span
                    className="disciplinas-detalle-row-value"
                    style={{ color: field.color ?? '#111111' }}
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
            {loadingSociosDisciplina ? (
              <div className="disciplinas-loading">
                <img src={logo} alt="" className="loading-logo" />
              </div>
            ) : sociosDisciplina.length === 0 ? (
              <p className="disciplinas-empty">No hay socios inscriptos en esta disciplina.</p>
            ) : (
              <div className="disciplinas-table-wrapper">
                <table className="disciplinas-tabla">
                  <thead>
                    <tr>
                      <th>N° Socio</th>
                      <th>Apellido y nombre</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sociosDisciplina.map((s) => (
                      <tr key={s.id}>
                        <td>{s.nro_socio}</td>
                        <td>{s.apellido} {s.nombre}</td>
                        <td>
                          <span className={`disciplinas-badge ${s.estado?.nombre === 'Activo' || s.estado === 'Activo' ? 'badge-activa' : 'badge-pausada'}`}>
                            {s.estado?.nombre ?? s.estado ?? '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
    </div>
  );
}

export default DisciplinasPage;
