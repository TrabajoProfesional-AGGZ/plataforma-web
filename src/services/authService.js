import {
  signInWithEmailAndPassword,
  signOut,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';
import { API_BASE_URL } from '../utils/utils';

// El signInWithEmailAndPassword de login() dispara el mismo onAuthStateChanged que escucha
// AuthContext, así que los dos terminaban pidiendo /api/v1/auth/login en paralelo para el mismo
// login: dos peticiones por un solo evento, y la de acá cerraba la sesión de Firebase apenas
// la SUYA no daba ok, sin importar si la otra iba a resolver bien. Compartir la promesa en
// curso es el mismo criterio que `promesaEnCurso` en clubService.js.
let loginEnCurso = null;

/**
 * POST /api/v1/auth/login, compartido entre `login()` y `AuthContext`: dos llamadas
 * concurrentes con el mismo idToken comparten esta única petición en vez de disparar dos.
 * @param {string} idToken
 * @returns {Promise<Object>} Datos de sesión: usuario, rol y permisos.
 * @throws {Error} 'unauthorized' si el backend rechaza al usuario.
 */
export function loginContraBackend(idToken) {
  if (loginEnCurso) return loginEnCurso;
  loginEnCurso = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id_token: idToken }),
      });
      if (!response.ok) throw new Error('unauthorized');
      return response.json();
    } finally {
      loginEnCurso = null;
    }
  })();
  return loginEnCurso;
}

/** Inicia sesión con Firebase y valida el rol contra el backend; si el backend rechaza, cierra la sesión de Firebase y lanza 'unauthorized'. */
export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await user.getIdToken();

  try {
    return await loginContraBackend(idToken);
  } catch (err) {
    await signOut(auth);
    throw err;
  }
}

/** Envía el email de restablecimiento de contraseña de Firebase. */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/** Cierra la sesión actual de Firebase. */
export async function logout() {
  await signOut(auth);
}

/** Reautentica al usuario actual con su contraseña vigente y la reemplaza por una nueva. */
export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('no-authenticated-user');
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
