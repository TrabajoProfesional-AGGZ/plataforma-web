import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PERMISO_LABELS, PERMISO_MODULO, moduloDePermiso } from '../../utils/permisoLabels';
import { SocioSubModal } from '../socioAccionesExtra/SocioSubModal';
import { usePaginacion } from '../../hooks/usePaginacion';
import { Paginacion } from '../paginacion/Paginacion';
import './PermisosModal.css';

const MODULOS_POR_PAGINA = 4;

/** Agrupa las claves de permiso por módulo, preservando el orden de primera aparición. */
function agruparPorModulo(permisos) {
  const grupos = {};
  permisos.forEach((p) => {
    const modulo = moduloDePermiso(p);
    if (!grupos[modulo]) grupos[modulo] = [];
    grupos[modulo].push(p);
  });
  return grupos;
}

/**
 * Modal con la lista de permisos de un usuario, agrupada por módulo. Cada
 * módulo es una fila que se expande al hacer click (una sola a la vez, las
 * demás se contraen), paginada de a `MODULOS_POR_PAGINA` para no mostrar
 * más de 4 filas juntas.
 */
function PermisosModal({ permisos, onClose }) {
  const grupos = agruparPorModulo(permisos);
  const modulos = Object.keys(grupos);
  const { pagina, totalPaginas, listaPaginada, irAPagina } = usePaginacion(modulos, MODULOS_POR_PAGINA);
  const [expandido, setExpandido] = useState(modulos[0] ?? null);

  /** Al cambiar de página, expande la primera fila de la página nueva (mismo criterio que el estado inicial). */
  function cambiarPagina(n) {
    irAPagina(n);
    const destino = Math.min(Math.max(n, 1), totalPaginas);
    const inicio = (destino - 1) * MODULOS_POR_PAGINA;
    setExpandido(modulos[inicio] ?? null);
  }

  function toggle(modulo) {
    setExpandido((prev) => (prev === modulo ? null : modulo));
  }

  return (
    <SocioSubModal titulo="Permisos" wrapperClass="permisos-modal-wrapper" onClose={onClose}>
      <div className="permisos-lista-modulos">
        {listaPaginada.map((modulo) => {
          const items = grupos[modulo];
          const abierto = expandido === modulo;
          const headerId = `permisos-fila-${modulo}`;
          const panelId = `permisos-panel-${modulo}`;
          return (
            <div className="permisos-fila" key={modulo}>
              <h3 className="permisos-fila-h">
                <button
                  type="button"
                  id={headerId}
                  className="permisos-fila-header"
                  aria-expanded={abierto}
                  aria-controls={panelId}
                  onClick={() => toggle(modulo)}
                >
                  <span className="permisos-fila-titulo">{PERMISO_MODULO[modulo] ?? modulo}</span>
                  <span className="permisos-fila-count">{items.length}</span>
                  <ChevronDown size={16} strokeWidth={2} className="permisos-fila-chevron" />
                </button>
              </h3>
              {/* Acordeón de altura variable (cantidad de permisos por módulo, desconocida
                  de antemano): a diferencia de las barras de B5, no hay un ancho/alto fijo
                  al que reducir con scale, así que anima `height` como excepción documentada
                  */}
              <AnimatePresence initial={false}>
                {abierto && (
                  <motion.ul
                    id={panelId}
                    role="region"
                    aria-labelledby={headerId}
                    className="permisos-lista-scroll"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {items.map((p) => (
                      <li key={p} className="permisos-lista-item">
                        {PERMISO_LABELS[p] ?? p}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiarPagina={cambiarPagina} />
    </SocioSubModal>
  );
}

PermisosModal.propTypes = {
  permisos: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClose: PropTypes.func.isRequired,
};

export { PermisosModal };
