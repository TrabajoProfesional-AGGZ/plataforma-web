import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Configuración leída de variables de entorno (ver .env.local en el README/CLAUDE.md).
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Instancia de Firebase Auth usada en toda la app (AuthContext, authService, tests).
export const auth = getAuth(app);
