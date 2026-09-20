import { render, screen, waitFor } from '@testing-library/react';
import { ClubProvider, useClubContext } from './ClubContext';
import { resolverClub } from '../services/clubService';

jest.mock('../services/clubService', () => ({
  resolverClub: jest.fn(),
  clubEnMemoria: jest.fn(() => null),
}));

const CLUB = {
  club_id: 'club-uno',
  slug: 'club-uno',
  nombre: 'Club Uno',
  colores: { primario: '#0A2A66', secundario: '#E8B400' },
  escudo: null,
};

function TestConsumer() {
  const { club, cargandoClub, clubError } = useClubContext();
  return (
    <div>
      <span data-testid="club">{club ? club.nombre : 'sin-club'}</span>
      <span data-testid="cargando">{cargandoClub ? 'si' : 'no'}</span>
      <span data-testid="error">{clubError ?? 'sin-error'}</span>
    </div>
  );
}

function renderProvider() {
  return render(
    <ClubProvider>
      <TestConsumer />
    </ClubProvider>
  );
}

describe('ClubContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.style.removeProperty('--club-color-primario');
    document.documentElement.style.removeProperty('--club-color-secundario');
  });

  test('expone el club del dominio y publica sus colores como custom properties', async () => {
    resolverClub.mockResolvedValue(CLUB);
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('cargando')).toHaveTextContent('no'));
    expect(screen.getByTestId('club')).toHaveTextContent('Club Uno');
    expect(document.documentElement.style.getPropertyValue('--club-color-primario')).toBe('#0A2A66');
    expect(document.documentElement.style.getPropertyValue('--club-color-secundario')).toBe('#E8B400');
  });

  test('si el dominio no tiene club, expone el error y no pinta ningún color', async () => {
    resolverClub.mockRejectedValue(new Error('club-desconocido'));
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('club-desconocido'));
    expect(screen.getByTestId('club')).toHaveTextContent('sin-club');
    expect(document.documentElement.style.getPropertyValue('--club-color-primario')).toBe('');
  });

  test('un club sin branding no rompe nada', async () => {
    resolverClub.mockResolvedValue({ ...CLUB, colores: { primario: null, secundario: null } });
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('club')).toHaveTextContent('Club Uno'));
    expect(document.documentElement.style.getPropertyValue('--club-color-primario')).toBe('');
  });
});
