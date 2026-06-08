import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const VALID_ROLES = ['dirigencia', 'tesoreria'];

export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const tokenResult = await user.getIdTokenResult();
  if (!VALID_ROLES.includes(tokenResult.claims.role)) {
    await signOut(auth);
    throw new Error('unauthorized');
  }
  return user;
}

export async function logout() {
  await signOut(auth);
}
