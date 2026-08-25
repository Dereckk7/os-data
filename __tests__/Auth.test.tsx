import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Login from '../src/pages/Login';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('Login Page', () => {
  test('affiche la page de connexion', () => {
    renderWithRouter(<Login />);

    expect(screen.getByText(/connexion/i)).toBeInTheDocument();
    expect(screen.getByText(/votre entreprise/i)).toBeInTheDocument();
  });
});
