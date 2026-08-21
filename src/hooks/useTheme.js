import { useThemeContext } from '../context/ThemeContext';

/**
 * Hook de acceso al tema activo (claro/oscuro), su toggle y los logos theme-aware.
 * @returns {{ theme: 'light'|'dark', toggleTheme: () => void, logoSocio: string, logoTexto: string }}
 */
export function useTheme() {
  return useThemeContext();
}
