import { initializeApp } from 'firebase/app';
import { getAuth, browserSessionPersistence, setPersistence } from 'firebase/auth';

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

// A-05 (`AUDITORIA_SEGURIDAD.md`): panel de administración de escritorio, sin caso de uso
// offline — a diferencia de `aplicacion`/`control-de-acceso`, acá la sesión debe expirar
// al cerrar la pestaña/navegador en vez de persistir indefinidamente (default de Firebase).
setPersistence(auth, browserSessionPersistence);
