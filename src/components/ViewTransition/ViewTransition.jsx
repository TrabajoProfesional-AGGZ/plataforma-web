import { motion, AnimatePresence } from 'framer-motion';
import { SPRING } from '../../styles/motion';

const variants = {
  enter: { opacity: 0, y: 6 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
};

/**
 * Crossfade corto entre vistas hermanas (lista/detalle) de una misma página.
 * No usa el router: solo observa `screenKey` y remonta el contenido cuando
 * cambia. `popLayout` saca a la vista saliente del flujo para que la entrante
 * ocupe su lugar sin saltos; el wrapper `position: relative` es el ancla de
 * ese posicionamiento absoluto.
 */
export function ViewTransition({ screenKey, children }) {
  return (
    <div className="view-transition" style={{ position: 'relative' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={screenKey}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SPRING.quick}
          style={{ width: '100%' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Lleva el área de contenido del layout al tope. Se llama desde el handler que
 * abre un detalle (no desde un efecto) para que el usuario no aterrice a mitad
 * de la página nueva. No-op fuera del layout (tests, login).
 */
export function scrollAlInicio() {
  const contenido = document.querySelector('.app-content');
  if (contenido && typeof contenido.scrollTo === 'function') {
    contenido.scrollTo({ top: 0 });
  }
}

export default ViewTransition;
