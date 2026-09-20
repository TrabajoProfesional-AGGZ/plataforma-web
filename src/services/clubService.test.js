import { resolverClub, clubEnMemoria, reiniciarClubResuelto } from './clubService';
import { fetchWithOutAuth } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchWithOutAuth: jest.fn(),
  // El escudo pasa por el filtro real del repo, que es parte de lo que este servicio promete.
  urlImagenSegura: jest.requireActual('../utils/utils').urlImagenSegura,
}));

jest.mock('../firebase', () => ({ auth: {} }));

const CLUB = {
  club_id: 'club-uno',
  slug: 'club-uno',
  nombre: 'Club Uno',
  colores: { primario: '#0A2A66', secundario: '#E8B400' },
  escudo: 'https://cdn.example.com/escudo.png',
};

function respuesta(status, cuerpo) {
  return { ok: status >= 200 && status < 300, status, json: async () => cuerpo };
}

describe('clubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reiniciarClubResuelto();
    delete process.env.REACT_APP_CLUB_ID;
  });

  test('resuelve el club por el hostname de la página', async () => {
    fetchWithOutAuth.mockResolvedValueOnce(respuesta(200, CLUB));
    const club = await resolverClub();

    expect(fetchWithOutAuth).toHaveBeenCalledWith(
      `/api/v1/clubes/publico/por-dominio/${window.location.hostname}`,
      'GET'
    );
    expect(club).toMatchObject({ club_id: 'club-uno', nombre: 'Club Uno' });
  });

  test('resuelve una sola vez por carga, aunque se lo pidan en paralelo', async () => {
    fetchWithOutAuth.mockResolvedValue(respuesta(200, CLUB));

    await Promise.all([resolverClub(), resolverClub()]);
    await resolverClub();

    expect(fetchWithOutAuth).toHaveBeenCalledTimes(1);
  });

  test('un dominio que el catálogo no reconoce falla con "club-desconocido", sin club por defecto', async () => {
    fetchWithOutAuth.mockResolvedValueOnce(respuesta(404, { detail: 'nada' }));

    await expect(resolverClub()).rejects.toThrow('club-desconocido');
    expect(clubEnMemoria()).toBeNull();
  });

  test('distingue el catálogo caído del dominio desconocido', async () => {
    fetchWithOutAuth.mockRejectedValueOnce(new Error('network'));
    await expect(resolverClub()).rejects.toThrow('servicio-no-disponible');

    reiniciarClubResuelto();
    fetchWithOutAuth.mockResolvedValueOnce(respuesta(503, {}));
    await expect(resolverClub()).rejects.toThrow('servicio-no-disponible');
  });

  test('descarta colores que no sean hexadecimales y escudos que no sean https', async () => {
    fetchWithOutAuth.mockResolvedValueOnce(
      respuesta(200, {
        ...CLUB,
        colores: { primario: 'red; background: url(javascript:alert(1))', secundario: '#ABC' },
        escudo: 'http://cdn.example.com/escudo.png',
      })
    );

    const club = await resolverClub();
    expect(club.colores.primario).toBeNull();
    expect(club.colores.secundario).toBe('#ABC');
    expect(club.escudo).toBeNull();
  });

  test('REACT_APP_CLUB_ID sólo entra cuando el lookup falla', async () => {
    process.env.REACT_APP_CLUB_ID = 'club-de-dev';
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    fetchWithOutAuth.mockResolvedValueOnce(respuesta(200, CLUB));
    expect((await resolverClub()).club_id).toBe('club-uno');

    reiniciarClubResuelto();
    fetchWithOutAuth.mockResolvedValueOnce(respuesta(404, {}));
    expect((await resolverClub()).club_id).toBe('club-de-dev');
    expect(console.warn).toHaveBeenCalled();

    console.warn.mockRestore();
  });
});
