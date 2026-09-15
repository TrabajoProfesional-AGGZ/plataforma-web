// Agrega matchers de jest-dom (ej. toBeInTheDocument) a todos los tests.
import '@testing-library/jest-dom';

// jsdom no implementa matchMedia — mock mínimo para código que lo usa (ej. LoginPage
// tratando pantallas ≤768px como shouldReduceMotion).
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = function matchMedia(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
}
