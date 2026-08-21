import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import logoSocioLight from '../assets/logo_socio.png';
import logoSocioDark from '../assets/logo_socio_oscuro.jpeg';
import logoTextoLight from '../assets/texto.png';
import logoTextoDark from '../assets/logo_socio_texto_oscuro.jpeg';
import logoSocioAltLight from '../assets/logo_socio_alt.png';
import logoSocioAltDark from '../assets/logo_socio_alt_oscuro.png';
import logoConTextoLight from '../assets/logo_con_texto.png';
import logoConTextoDark from '../assets/logo_con_texto_oscuro.png';

const THEME_STORAGE_KEY = 'theme';

const ThemeContext = createContext(null);

/**
 * Lee el tema guardado en `localStorage`; si no hay valor o es inválido, usa claro por defecto.
 * @returns {'light'|'dark'}
 */
function getInitialTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

/**
 * Provider de tema claro/oscuro: persiste la elección en `localStorage`, la refleja
 * en `document.documentElement.dataset.theme` y expone los logos correspondientes al tema activo.
 * @param {{ children: import('react').ReactNode }} props
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      logoSocio: theme === 'dark' ? logoSocioDark : logoSocioLight,
      logoTexto: theme === 'dark' ? logoTextoDark : logoTextoLight,
      logoSocioAlt: theme === 'dark' ? logoSocioAltDark : logoSocioAltLight,
      logoConTexto: theme === 'dark' ? logoConTextoDark : logoConTextoLight,
    }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook para consumir el `ThemeContext` (tema activo, toggle y logos theme-aware).
 * @returns {{ theme: 'light'|'dark', toggleTheme: () => void, logoSocio: string, logoTexto: string }}
 */
export function useThemeContext() {
  return useContext(ThemeContext);
}
