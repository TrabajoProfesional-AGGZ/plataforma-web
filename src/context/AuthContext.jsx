import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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
          setTimeout(() => setLoading(false), 1500);
        } catch {
          // Usuario autenticado en Firebase pero sin acceso en el sistema
          await signOut(auth);
          // onAuthStateChanged volverá a dispararse con null
        }
      } else {
        setRole(null);
        setPermisos([]);
        setUserData(null);
        setTimeout(() => setLoading(false), 1500);
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

export function useAuthContext() {
  return useContext(AuthContext);
}
