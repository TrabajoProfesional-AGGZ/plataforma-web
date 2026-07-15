import { getTramitesPorSocio, getTramite, revisarTramite } from './tramitesService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

const TRAMITE_MOCK = {
  id: 't-1',
  id_socio: 's-1',
  tipo_tramite: { id: 1, nombre: 'Apto médico', requiere_vencimiento: true },
  archivo_url: 'https://res.cloudinary.com/demo/tramites/s-1/archivo.pdf',
  estado: 'en_revision',
  fecha_carga: '2026-07-10T00:00:00Z',
  fecha_vencimiento: '2027-07-10',
  observaciones: null,
  revisado_en: null,
};

describe('tramitesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTramitesPorSocio', () => {
    test('llama al endpoint por-socio con el id codificado', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [TRAMITE_MOCK] });
      const result = await getTramitesPorSocio('s 1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/tramites/por-socio/s%201', 'GET');
      expect(result).toHaveLength(1);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getTramitesPorSocio('s-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getTramitesPorSocio('s-1')).rejects.toThrow('Error al obtener los trámites');
    });
  });

  describe('getTramite', () => {
    test('llama al endpoint correcto con el id del trámite', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => TRAMITE_MOCK });
      const result = await getTramite('t-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/tramites/t-1', 'GET');
      expect(result).toEqual(TRAMITE_MOCK);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getTramite('t-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getTramite('t-1')).rejects.toThrow('Error al obtener el trámite');
    });
  });

  describe('revisarTramite', () => {
    test('llama a PATCH /revisar con el body correcto', async () => {
      const actualizado = { ...TRAMITE_MOCK, estado: 'aprobado' };
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => actualizado });
      const body = { estado: 'aprobado', observaciones: 'Todo en orden' };
      const result = await revisarTramite('t-1', body);
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/tramites/t-1/revisar', 'PATCH', body);
      expect(result.estado).toBe('aprobado');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(revisarTramite('t-1', { estado: 'aprobado' })).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(revisarTramite('t-1', { estado: 'aprobado' })).rejects.toThrow('Error al revisar el trámite');
    });
  });
});
