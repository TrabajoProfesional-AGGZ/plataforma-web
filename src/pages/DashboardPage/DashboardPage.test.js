import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

jest.mock('../../firebase', () => ({ auth: {} }));

describe('DashboardPage', () => {
  test('renderiza sin errores', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
  });
});
