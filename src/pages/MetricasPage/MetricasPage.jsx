import { useRef, useState } from 'react';
import ResumenTab from './ResumenTab';
import FinanzasTab from './FinanzasTab';
import MorosidadTab from './MorosidadTab';
import EventosTab from './EventosTab';
import TiendaTab from './TiendaTab';
import CajaTab from './CajaTab';
import './MetricasPage.css';

const TABS = [
  { id: 'resumen', label: 'Instalaciones', Component: ResumenTab },
  { id: 'finanzas', label: 'Finanzas', Component: FinanzasTab },
  { id: 'morosidad', label: 'Morosidad', Component: MorosidadTab },
  { id: 'eventos', label: 'Eventos', Component: EventosTab },
  { id: 'tienda', label: 'Tienda', Component: TiendaTab },
  { id: 'caja', label: 'Caja', Component: CajaTab },
];

/** Página de métricas con navegación por pestañas (patrón ARIA tablist) accesible por teclado. */
function MetricasPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([TABS[0].id]));
  const tabRefs = useRef({});

  /** Cambia de pestaña sin desmontar las ya visitadas, para no re-fetchear sus datos al volver. */
  function selectTab(id) {
    setActiveTab(id);
    setVisitedTabs((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }

  /** Navega entre pestañas con flechas/Home/End y mueve el foco a la pestaña activa. */
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
    selectTab(nextId);
    tabRefs.current[nextId]?.focus();
  }

  return (
    <div className="metricas-page">
      <h1 className="page-title">Métricas</h1>
      <p className="metricas-subtitle">Panel financiero, de uso y de riesgo del club</p>

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
            onClick={() => selectTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {TABS.map(({ id, Component }) => visitedTabs.has(id) && (
        <div
          key={id}
          role="tabpanel"
          id={`metricas-panel-${id}`}
          aria-labelledby={`metricas-tab-${id}`}
          hidden={activeTab !== id}
        >
          <Component />
        </div>
      ))}
    </div>
  );
}

export default MetricasPage;
