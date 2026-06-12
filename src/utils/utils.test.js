import { fetchTo } from './utils';

jest.mock('../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: async () => 'mock-token',
    },
  },
}));

global.fetch = jest.fn();

describe('fetchTo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockResolvedValue({ ok: true, status: 200 });
  });

  test('llama a fetch con la URL correcta', async () => {
    await fetchTo('/api/v1/socios', 'GET');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/socios'),
      expect.any(Object)
    );
  });

  test('incluye el header Authorization con el token', async () => {
    await fetchTo('/api/v1/socios', 'GET');

    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer mock-token');
  });

  test('incluye Content-Type application/json', async () => {
    await fetchTo('/api/v1/socios', 'GET');

    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  test('serializa el body como JSON cuando se provee', async () => {
    const body = { nombre: 'Juan' };
    await fetchTo('/api/v1/socios', 'POST', body);

    const [, options] = global.fetch.mock.calls[0];
    expect(options.body).toBe(JSON.stringify(body));
    expect(options.method).toBe('POST');
  });

  test('envía body null cuando no se provee', async () => {
    await fetchTo('/api/v1/socios', 'GET');

    const [, options] = global.fetch.mock.calls[0];
    expect(options.body).toBeNull();
  });

  test('devuelve la respuesta de fetch', async () => {
    const mockResponse = { ok: true, status: 200 };
    global.fetch.mockResolvedValueOnce(mockResponse);

    const result = await fetchTo('/api/v1/socios', 'GET');

    expect(result).toBe(mockResponse);
  });
});
