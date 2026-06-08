import {
  signInWithEmailAndPassword,
  signOut,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase';

const VALID_ROLES = ['admin', 'superAdmin'];

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

export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
