import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

/**
 * Envía el idToken de Firebase al backend para obtener rol, permisos y datos del usuario.
 * @param {import('firebase/auth').User} currentUser - Usuario autenticado en Firebase.
 * @returns {Promise<Object>} Datos de sesión devueltos por `/api/v1/auth/login`.
 * @throws {Error} Si el backend rechaza al usuario (sin acceso al sistema).
 */
async function fetchLoginData(currentUser) {
  const idToken = await currentUser.getIdToken();
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
}

/**
 * Provider de autenticación: escucha el estado de Firebase Auth y sincroniza
 * rol, permisos y datos del usuario contra el backend en cada cambio.
 * @param {{ children: import('react').ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const data = await fetchLoginData(currentUser);
          setRole(data.rol);
          setPermisos(data.permisos);
          setUserData({
            usuario_id: data.usuario_id,
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
          });
          setLoading(false);
        } catch {
          // Usuario autenticado en Firebase pero sin acceso en el sistema
          await signOut(auth);
          // onAuthStateChanged volverá a dispararse con null
        }
      } else {
        setRole(null);
        setPermisos([]);
        setUserData(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role, permisos, userData }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para consumir el `AuthContext` (usuario, rol, permisos, estado de carga).
 * @returns {{ user: object|null, loading: boolean, role: string|null, permisos: string[], userData: object|null }}
 */
export function useAuthContext() {
  return useContext(AuthContext);
}
