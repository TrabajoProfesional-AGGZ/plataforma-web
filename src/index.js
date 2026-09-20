import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/archivo';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ClubProvider } from './context/ClubContext';
import { ThemeProvider } from './context/ThemeContext';

// Punto de entrada: monta la app dentro de ThemeProvider, ClubProvider y AuthProvider. El
// ClubProvider va por encima del de auth porque el club de este dominio existe antes de que haya
// sesión: es de donde sale la marca blanca de la pantalla de login.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ClubProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ClubProvider>
    </ThemeProvider>
  </React.StrictMode>
);
