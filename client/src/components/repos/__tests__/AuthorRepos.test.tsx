import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthorRepos from '../AuthorRepos';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';

// Mock the API endpoint
const server = setupServer(
  http.get('http://localhost:3001/api/repos/:owner', async ({ params }) => {
    const { owner } = params;
    if (owner === 'testuser') {
      return HttpResponse.json({
        success: true,
        data: {
          owner: 'testuser',
          repositories: [
            {
              id: 1,
              name: 'test-repo',
              html_url: 'https://github.com/testuser/test-repo',
              description: 'A test repository',
              stargazers_count: 5,
              forks_count: 2,
              watchers_count: 5,
              language: 'JavaScript',
              updated_at: '2023-01-01T00:00:00Z'
            }
          ],
          count: 1
        }
      });
    } else if (owner === 'notfound') {
      return new HttpResponse(
        JSON.stringify({ 
          success: false,
          error: 'User not found' 
        }),
        { status: 500 }
      );
    }
    return HttpResponse.json({ success: true, data: { owner, repositories: [], count: 0 } });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AuthorRepos', () => {
  it('renders the search form', () => {
    render(<AuthorRepos />);
    
    const input = screen.getByPlaceholderText('Enter GitHub username');
    const button = screen.getByText('Search Repositories');
    
    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  it('displays repositories when search is successful', async () => {
    // Mock a successful API response
    server.use(
      http.get('http://localhost:3001/api/repos/testuser', () => {
        return HttpResponse.json({
          success: true,
          data: {
            owner: 'testuser',
            repositories: [
              {
                id: 1,
                name: 'test-repo',
                html_url: 'https://github.com/testuser/test-repo',
                description: 'A test repository',
                stargazers_count: 5,
                forks_count: 2,
                watchers_count: 5,
                language: 'JavaScript',
                updated_at: '2023-01-01T00:00:00Z'
              }
            ],
            count: 1
          }
        });
      })
    );

    render(<AuthorRepos />);
    
    const input = screen.getByPlaceholderText('Enter GitHub username');
    const button = screen.getByText('Search Repositories');
    
    fireEvent.change(input, { target: { value: 'testuser' } });
    fireEvent.click(button);
    
    // Wait for the loading state to appear
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
    
    // Wait for the repository details to appear
    await waitFor(() => {
      expect(screen.getByText('test-repo')).toBeInTheDocument();
      expect(screen.getByText('A test repository')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays error when user is not found', async () => {
    // Mock an error response
    server.use(
      http.get('http://localhost:3001/api/repos/notfound', () => {
        return new HttpResponse(
          JSON.stringify({ 
            success: false,
            error: 'User not found' 
          }),
          { status: 404 }
        );
      })
    );

    render(<AuthorRepos />);
    
    const input = screen.getByPlaceholderText('Enter GitHub username');
    const button = screen.getByText('Search Repositories');
    
    fireEvent.change(input, { target: { value: 'notfound' } });
    fireEvent.click(button);
    
    // Wait for the loading state to appear
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Error: User not found/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
