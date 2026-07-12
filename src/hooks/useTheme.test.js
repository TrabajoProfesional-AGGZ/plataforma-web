import React from 'react';
import { renderHook } from '@testing-library/react';
import { useTheme } from './useTheme';
import { ThemeProvider } from '../context/ThemeContext';

describe('useTheme', () => {
  test('retorna theme, toggleTheme, logoSocio y logoTexto del contexto', () => {
    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current).toHaveProperty('theme');
    expect(result.current).toHaveProperty('toggleTheme');
    expect(result.current).toHaveProperty('logoSocio');
    expect(result.current).toHaveProperty('logoTexto');
  });
});
