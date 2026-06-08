import { render, screen } from '@testing-library/react';
import SociosPage from './SociosPage';

describe('SociosPage', () => {
  test('renderiza el título y el texto placeholder', () => {
    render(<SociosPage />);
    expect(screen.getByRole('heading', { name: /socios/i })).toBeInTheDocument();
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument();
  });
});
