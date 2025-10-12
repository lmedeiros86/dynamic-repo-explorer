import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock the AuthorRepos component since we're testing App in isolation
vi.mock('./components/repos/AuthorRepos', () => ({
  default: () => <div data-testid="mock-author-repos">Mock AuthorRepos Component</div>
}));

describe('App', () => {
  it('renders the header', () => {
    render(<App />);
    const headerElement = screen.getByRole('heading', { name: /GitHub Repository Explorer/i });
    expect(headerElement).toBeInTheDocument();
  });

  it('renders the AuthorRepos component', () => {
    render(<App />);
    const authorReposElement = screen.getByTestId('mock-author-repos');
    expect(authorReposElement).toBeInTheDocument();
  });
});
