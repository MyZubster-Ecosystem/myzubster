import { render, screen } from '@testing-library/react';
import HowItWorksPage from './HowItWorksPage';

describe('HowItWorksPage', () => {
  test('explains the site workflow and evidence boundaries', () => {
    render(<HowItWorksPage />);

    expect(screen.getByRole('heading', { name: /dal dato reale a un risultato verificabile/i })).toBeInTheDocument();
    expect(screen.getByText(/16 entità AI/i)).toBeInTheDocument();
    expect(screen.getByText(/MYZ rappresenta contabilità interna/i)).toBeInTheDocument();
    expect(screen.getByText(/Una PR non prova un deploy/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Parla con le 16 entità/i })).toHaveAttribute('href', '/entities');
  });
});
