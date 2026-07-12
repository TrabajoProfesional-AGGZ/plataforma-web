import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import logoSocioLight from '../assets/logo_socio.png';
import logoSocioDark from '../assets/logo_socio_oscuro.jpeg';
import logoTextoLight from '../assets/texto.png';
import logoTextoDark from '../assets/logo_socio_texto_oscuro.jpeg';

const THEME_STORAGE_KEY = 'theme';

const ThemeContext = createContext(null);

function getInitialTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

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
    }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
