import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useThemeContext } from './ThemeContext';

function TestConsumer() {
  const { theme, toggleTheme, logoSocio, logoTexto } = useThemeContext();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="logoSocio">{logoSocio}</span>
      <span data-testid="logoTexto">{logoTexto}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <ThemeProvider>
      <TestConsumer />
    </ThemeProvider>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  test('arranca en modo claro por defecto', () => {
    renderProvider();
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('lee el tema guardado en localStorage al montar', () => {
    localStorage.setItem('theme', 'dark');
    renderProvider();
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('ignora un valor inválido en localStorage y usa claro', () => {
    localStorage.setItem('theme', 'sepia');
    renderProvider();
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  test('toggleTheme alterna entre claro y oscuro y persiste en localStorage', () => {
    renderProvider();

    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('cambia los logos según el tema', () => {
    renderProvider();
    const logoSocioClaro = screen.getByTestId('logoSocio').textContent;
    const logoTextoClaro = screen.getByTestId('logoTexto').textContent;

    fireEvent.click(screen.getByText('toggle'));

    expect(screen.getByTestId('logoSocio').textContent).not.toBe(logoSocioClaro);
    expect(screen.getByTestId('logoTexto').textContent).not.toBe(logoTextoClaro);
  });
});
