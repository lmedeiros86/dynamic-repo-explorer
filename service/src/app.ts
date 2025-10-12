import express from 'express';
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables with debug
const result = dotenv.config({ debug: true });

// Log environment variables (except sensitive ones)
console.log('Environment variables loaded:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN ? '*** (token exists)' : 'NOT FOUND',
    dotenvConfig: {
        parsed: result.parsed ? Object.keys(result.parsed) : 'No .env file found',
        error: result.error
    }
});

// Define the GitHub repository interface
interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    // Add other properties you need from the GitHub API response
}

// Load environment variables from .env file
dotenv.config();

const app = express();

// Enable CORS - Simple configuration
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'Service is running' });
});

// Get initial set of public repositories with pagination
app.get('/api/repos/initial', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const perPage = Math.min(parseInt(req.query.per_page as string) || 10, 100); // Max 100 per page, default 10
        
        console.log(`Fetching page ${page} of initial repositories (${perPage} per page)`);
        
        // Call GitHub API to get public repositories, sorted by most recently updated
        const githubResponse = await axios.get<GitHubRepo[]>('https://api.github.com/repositories', {
            params: {
                since: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, // Last 30 days
                sort: 'updated',
                per_page: perPage,
                page: page
            },
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'dynamic-repo-explorer'
            }
        });

        const repositories = githubResponse.data;
        const linkHeader = githubResponse.headers.link;
        let hasNextPage = false;
        let hasPreviousPage = page > 1;
        
        // Parse the Link header to check for next page
        if (linkHeader) {
            hasNextPage = linkHeader.includes('rel="next"');
        }

        const response = {
            success: true,
            data: {
                repositories: repositories,
                pagination: {
                    currentPage: page,
                    perPage: perPage,
                    hasNextPage: hasNextPage,
                    hasPreviousPage: hasPreviousPage,
                    totalCount: 0 // GitHub doesn't provide total count in this endpoint
                }
            }
        };

        console.log(`Fetched ${repositories.length} repositories for page ${page}`);
        res.status(200).json(response);

    } catch (error: any) {
        console.error('Error fetching initial repositories:', error.message);
        
        if (error.response) {
            res.status(error.response.status).json({
                success: false,
                error: error.response.data.message || 'Error fetching repositories from GitHub'
            });
        } else {
            res.status(500).json({
                success: false,
                error: error.message || 'An unexpected error occurred'
            });
        }
    }
});

// Get repositories for a specific owner
app.get('/api/repos/:owner', async (req: Request, res: Response) => {
    const { owner } = req.params;
    
    console.log('Fetching repositories for owner:', owner);

    if (!owner) {
        const error = 'No owner parameter provided';
        console.error(error);
        return res.status(400).json({ success: false, error });
    }

    try {
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'dynamic-repo-explorer'
        };

        // Add GitHub token if available
        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        let allRepositories: GitHubRepo[] = [];
        let page = 1;
        let hasMore = true;
        const perPage = 100; // Maximum allowed by GitHub API

        while (hasMore) {
            const githubResponse = await axios.get<GitHubRepo[]>(
                `https://api.github.com/users/${owner}/repos`,
                {
                    headers,
                    params: {
                        per_page: perPage,
                        page: page,
                        sort: 'updated',
                        direction: 'desc'
                    },
                    validateStatus: (status) => status < 500
                }
            );

            if (githubResponse.status === 200) {
                const repositories = githubResponse.data || [];
                allRepositories = [...allRepositories, ...repositories];
                
                // Check if we've received fewer items than requested, which means we've reached the end
                if (repositories.length < perPage) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
                
                // If it's the first page and we got an error, return the error
                if (page === 1) {
                    // Type assertion for error response
                const errorResponse = githubResponse.data as { message?: string };
                return res.status(githubResponse.status).json({
                    success: false,
                    error: errorResponse.message || 'Error fetching repositories from GitHub',
                    data: {
                        owner,
                        repositories: [],
                        count: 0
                    }
                });
                }
                // If it's not the first page, we'll return what we have so far
            }
        }

        // If we have repositories, return them
        if (allRepositories.length > 0) {
            return res.status(200).json({
                success: true,
                data: {
                    owner,
                    repositories: allRepositories,
                    count: allRepositories.length
                }
            });
        }

        // If we got here, there was an error and no repositories were fetched
        return res.status(404).json({
            success: false,
            error: `No repositories found for user '${owner}'`,
            data: {
                owner,
                repositories: [],
                count: 0
            }
        });
    } catch (error: any) {
        console.error('Error fetching from GitHub API:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            stack: error.stack
        });

        // Handle different types of errors
        if (error.response) {
            // GitHub API returned an error
            if (error.response.status === 403) {
                return res.status(403).json({
                    success: false,
                    error: 'GitHub API rate limit exceeded. Please try again later or add a GitHub token.',
                    data: {
                        owner,
                        repositories: [],
                        count: 0
                    }
                });
            }
            
            if (error.response.status === 404) {
                return res.status(404).json({
                    success: false,
                    error: `User '${owner}' not found on GitHub`,
                    data: {
                        owner,
                        repositories: [],
                        count: 0
                    }
                });
            } else if (error.response.status === 403) {
                const rateLimitReset = error.response.headers['x-ratelimit-reset'];
                const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString() : 'later';
                
                return res.status(403).json({
                    success: false,
                    error: `GitHub API rate limit exceeded. Try again after ${resetTime} or add a GitHub token for higher limits.`,
                    data: {
                        owner,
                        repositories: [],
                        count: 0
                    }
                });
            } else {
                return res.status(error.response.status).json({
                    success: false,
                    error: error.response.data?.message || `GitHub API error: ${error.response.status} ${error.response.statusText}`,
                    data: {
                        owner,
                        repositories: [],
                        count: 0
                    },
                    details: process.env.NODE_ENV === 'development' ? error.response.data : undefined
                });
            }
        } else if (error.request) {
            // Network error
            console.error('Network error details:', error.request);
            return res.status(503).json({
                success: false,
                error: 'Unable to connect to GitHub API. Please check your internet connection.',
                data: {
                    owner,
                    repositories: [],
                    count: 0
                }
            });
        } else {
            // Other error
            console.error('Unexpected error:', error);
            return res.status(500).json({
                success: false,
                error: 'An unexpected error occurred',
                data: {
                    owner,
                    repositories: [],
                    count: 0
                },
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Something went wrong!' });
});

export { app };
