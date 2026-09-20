import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clubEnMemoria, resolverClub } from '../services/clubService';

const ClubContext = createContext({ club: null, cargandoClub: true, clubError: null });

/**
 * Provider del club de este dominio, con su marca blanca. Va **por encima del AuthProvider**: el
 * club existe antes de que haya sesión, y es lo que le da a la pantalla de login la identidad del
 * club en vez de la del producto.
 *
 * **No bloquea el render**, a propósito. Acá el club es cosmético —toda llamada del panel resuelve
 * su tenant con el claim del token, que el gateway propaga solo—, así que una pantalla de espera
 * dejaría a un administrador sin poder entrar porque el catálogo de clubes tardó en responder.
 * @param {{ children: import('react').ReactNode }} props
 */
export function ClubProvider({ children }) {
  const [club, setClub] = useState(clubEnMemoria);
  const [cargandoClub, setCargandoClub] = useState(true);
  const [clubError, setClubError] = useState(null);

  useEffect(() => {
    let vigente = true;

    resolverClub()
      .then((resuelto) => {
        if (!vigente) return;
        setClub(resuelto);
        setClubError(null);
      })
      .catch((fallo) => {
        if (!vigente) return;
        setClub(null);
        setClubError(fallo.message);
      })
      .finally(() => {
        if (vigente) setCargandoClub(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  // Los colores del club se publican como custom properties en `:root` para que el CSS existente
  // pueda irse enganchando a la marca blanca sin que este provider sepa nada de estilos. El
  // servicio ya filtró todo lo que no sea un hexadecimal.
  useEffect(() => {
    const raiz = document.documentElement;
    const { primario, secundario } = club?.colores ?? {};

    if (primario) raiz.style.setProperty('--club-color-primario', primario);
    else raiz.style.removeProperty('--club-color-primario');

    if (secundario) raiz.style.setProperty('--club-color-secundario', secundario);
    else raiz.style.removeProperty('--club-color-secundario');
  }, [club]);

  const value = useMemo(() => ({ club, cargandoClub, clubError }), [club, cargandoClub, clubError]);

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}

/**
 * Hook para consumir el `ClubContext` (club del dominio, su branding y el estado de la resolución).
 * @returns {{ club: object|null, cargandoClub: boolean, clubError: string|null }}
 */
export function useClubContext() {
  return useContext(ClubContext);
}
