import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CobrosPage from './CobrosPage';
import { getEstadoMercadoPago, getUrlAutorizacionMercadoPago } from '../../services/cobrosService';

jest.mock('../../services/cobrosService', () => ({
  getEstadoMercadoPago: jest.fn(),
  getUrlAutorizacionMercadoPago: jest.fn(),
}));

const CONECTADA = {
  club_id: 'club-uno',
  slug: 'club-uno',
  estado: 'conectado',
  conectado: true,
  mp_user_id: '9001',
  expira_el: '2026-03-18T12:00:00Z',
};

const SIN_CONECTAR = {
  club_id: 'club-uno',
  slug: 'club-uno',
  estado: 'sin_conectar',
  conectado: false,
  mp_user_id: null,
  expira_el: null,
};

function renderPagina(ruta = '/cobros') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <CobrosPage />
    </MemoryRouter>
  );
}

describe('CobrosPage', () => {
  const asignar = jest.fn();

  beforeAll(() => {
    // `window.location.assign` no está implementado en jsdom y salir de la página rompería el test.
    delete window.location;
    window.location = { assign: asignar, href: 'http://localhost/cobros' };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('con la cuenta conectada muestra la cuenta, el vencimiento y ofrece reconectar', async () => {
    getEstadoMercadoPago.mockResolvedValue(CONECTADA);
    renderPagina();

    expect(await screen.findByText('Conectada')).toBeInTheDocument();
    expect(screen.getByText('9001')).toBeInTheDocument();
    expect(screen.getByText('18/03/2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reconectar la cuenta/i })).toBeInTheDocument();
  });

  test('sin cuenta conectada ofrece conectarla', async () => {
    getEstadoMercadoPago.mockResolvedValue(SIN_CONECTAR);
    renderPagina();

    expect(await screen.findByText('Sin conectar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /conectar mercado pago/i })).toBeInTheDocument();
  });

  test('una cuenta desvinculada se distingue de una que nunca se conectó', async () => {
    getEstadoMercadoPago.mockResolvedValue({ ...SIN_CONECTAR, estado: 'desvinculado', mp_user_id: '9001' });
    renderPagina();

    expect(await screen.findByText('Desvinculada')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/revocada desde Mercado Pago/i);
  });

  test('al conectar manda al admin al dominio de Mercado Pago', async () => {
    getEstadoMercadoPago.mockResolvedValue(SIN_CONECTAR);
    getUrlAutorizacionMercadoPago.mockResolvedValue('https://auth.mercadopago.com/authorization?x=1');
    renderPagina();

    await userEvent.click(await screen.findByRole('button', { name: /conectar mercado pago/i }));

    await waitFor(() =>
      expect(asignar).toHaveBeenCalledWith('https://auth.mercadopago.com/authorization?x=1')
    );
  });

  test('si no se puede armar la URL no se sale del panel y se explica por qué', async () => {
    getEstadoMercadoPago.mockResolvedValue(SIN_CONECTAR);
    getUrlAutorizacionMercadoPago.mockRejectedValue(new Error('oauth-no-configurado'));
    renderPagina();

    await userEvent.click(await screen.findByRole('button', { name: /conectar mercado pago/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no está configurada en el servidor/i);
    expect(asignar).not.toHaveBeenCalled();
  });

  test('un error al consultar el estado se puede reintentar', async () => {
    getEstadoMercadoPago.mockRejectedValueOnce(new Error('servicio-no-disponible'));
    renderPagina();

    expect(await screen.findByRole('alert')).toHaveTextContent(/No pudimos consultar/i);

    getEstadoMercadoPago.mockResolvedValueOnce(CONECTADA);
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    expect(await screen.findByText('Conectada')).toBeInTheDocument();
  });

  test('la vuelta de Mercado Pago confirma la conexión y no deja el parámetro en la URL', async () => {
    getEstadoMercadoPago.mockResolvedValue(CONECTADA);
    renderPagina('/cobros?mp=conectado');

    expect(await screen.findByRole('status')).toHaveTextContent(/ya cobra con su cuenta/i);
  });

  test('sin ese parámetro no se muestra ninguna confirmación', async () => {
    getEstadoMercadoPago.mockResolvedValue(CONECTADA);
    renderPagina();

    await screen.findByText('Conectada');
    expect(screen.queryByText(/ya cobra con su cuenta/i)).not.toBeInTheDocument();
  });
});
