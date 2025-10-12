import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RepoList from '../components/repos/RepoList';

// Mock data for testing
const mockRepos = [
  {
    id: 1,
    name: 'test-repo-1',
    full_name: 'testuser/test-repo-1',
    owner: {
      login: 'testuser',
      id: 12345,
      avatar_url: 'https://example.com/avatar.jpg',
      html_url: 'https://github.com/testuser',
    },
    stargazers_count: 42,
    watchers_count: 10,
    language: 'TypeScript',
    description: 'A test repository',
    html_url: 'https://github.com/testuser/test-repo-1',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    forks_count: 5,
    open_issues_count: 2,
    private: false,
  },
  {
    id: 2,
    name: 'another-repo',
    full_name: 'testuser/another-repo',
    owner: {
      login: 'testuser',
      id: 12345,
      avatar_url: 'https://example.com/avatar.jpg',
      html_url: 'https://github.com/testuser',
    },
    stargazers_count: 10,
    watchers_count: 5,
    language: 'JavaScript',
    description: 'Another test repository',
    html_url: 'https://github.com/testuser/another-repo',
    created_at: '2023-02-01T00:00:00Z',
    updated_at: '2023-02-02T00:00:00Z',
    forks_count: 1,
    open_issues_count: 0,
    private: true,
  },
];

describe('RepoList', () => {
  it('renders repository list with correct data', () => {
    render(<RepoList initialRepositories={mockRepos} owner="testuser" />);
    
    // Check if repository names are rendered
    expect(screen.getByText('test-repo-1')).toBeInTheDocument();
    expect(screen.getByText('another-repo')).toBeInTheDocument();
    
    // Check if star counts are displayed
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    
    // Check if languages are displayed
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('shows loading state when no initial repositories', () => {
    render(<RepoList initialRepositories={[]} owner="testuser" />);
    expect(screen.getByText('Loading repositories...')).toBeInTheDocument();
  });

  it('shows empty state when no repositories are found', async () => {
    render(<RepoList initialRepositories={[]} owner="testuser" />);
    
    // Wait for the loading to complete
    await screen.findByText('No repositories found for testuser.');
  });
});
