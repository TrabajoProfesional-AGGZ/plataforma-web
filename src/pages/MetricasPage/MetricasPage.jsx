import { useRef, useState } from 'react';
import { usePermiso } from '../../hooks/usePermiso';
import ResumenTab from './ResumenTab';
import FinanzasTab from './FinanzasTab';
import MorosidadTab from './MorosidadTab';
import './MetricasPage.css';

const TABS = [
  { id: 'resumen', label: 'Instalaciones', Component: ResumenTab },
  { id: 'finanzas', label: 'Finanzas', Component: FinanzasTab },
  { id: 'morosidad', label: 'Morosidad', Component: MorosidadTab },
];

function MetricasPage() {
  const puedeVerMetricas = usePermiso('ver_metricas');
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const tabRefs = useRef({});

  function handleKeyDown(e) {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    let nextIdx = null;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = TABS.length - 1;

    if (nextIdx === null) return;
    e.preventDefault();
    const nextId = TABS[nextIdx].id;
    setActiveTab(nextId);
    tabRefs.current[nextId]?.focus();
  }

  const ActiveComponent = TABS.find((t) => t.id === activeTab).Component;

  return (
    <div className="metricas-page">
      <h1 className="metricas-title">Métricas</h1>
      <p className="metricas-subtitle">Panel financiero, de uso y de riesgo del club</p>

      {!puedeVerMetricas ? (
        <p className="metricas-error" style={{ marginTop: 'var(--space-6)' }}>
          No tenés los permisos necesarios para acceder a las métricas del club.
        </p>
      ) : (
        <>
          <div
            className="metricas-tablist"
            role="tablist"
            aria-label="Secciones de métricas"
            onKeyDown={handleKeyDown}
          >
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                ref={(el) => { tabRefs.current[id] = el; }}
                type="button"
                role="tab"
                id={`metricas-tab-${id}`}
                aria-selected={activeTab === id}
                aria-controls={`metricas-panel-${id}`}
                tabIndex={activeTab === id ? 0 : -1}
                className="metricas-tab"
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            className="metricas-panel"
            role="tabpanel"
            id={`metricas-panel-${activeTab}`}
            aria-labelledby={`metricas-tab-${activeTab}`}
          >
            <ActiveComponent />
          </div>
        </>
      )}
    </div>
  );
}

export default MetricasPage;
