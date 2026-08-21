import {
  signInWithEmailAndPassword,
  signOut,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/** Inicia sesión con Firebase y valida el rol contra el backend; si el backend rechaza, cierra la sesión de Firebase y lanza 'unauthorized'. */
export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await user.getIdToken();

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ id_token: idToken }),
  });

  if (!response.ok) {
    await signOut(auth);
    throw new Error('unauthorized');
  }

  return response.json();
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
