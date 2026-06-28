import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the Sonara landing page', () => {
    render(<Home />);
    expect(screen.getByText(/L’IA vocale pour l’Afrique francophone/i)).toBeDefined();
  });
});
