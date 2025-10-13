import { Request, Response } from 'express';
import githubService, { GitHubService } from '../services/githubService';
import { handleError } from '../utils/errorHandler';

// Define types directly in the controller file to avoid import issues
interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    watchers_count: number;
    forks_count: number;
    language: string | null;
    updated_at: string;
    created_at: string;
    private: boolean;
    owner: {
        login: string;
        id: number;
        avatar_url: string;
        html_url: string;
    };
}

interface GitHubUser {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    name: string | null;
    company: string | null;
    blog: string | null;
    location: string | null;
    email: string | null;
    bio: string | null;
    public_repos: number;
    followers: number;
    following: number;
}

interface GitHubRateLimit {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
}

interface GitHubError {
    code: string;
    message: string;
    status: number;
    details?: any;
    documentation_url?: string;
}

interface RepoStats {
    owner: string;
    repo: string;
    totalCommits: number;
    totalBranches: number;
    totalTags: number;
    totalContributors: number;
    lastUpdated: string;
    totalForks: number;
    totalWatchers: number;
    languages: Record<string, number>;
    repoList: Array<{
        name: string;
        stars: number;
        forks: number;
        watchers: number;
        language: string;
        url: string;
    }>;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details: string;
        status: number;
        retryAfter?: string;
    };
    status: number;
}

// Cache duration in seconds
const CACHE_DURATION = {
    SHORT: 60,          // 1 minute
    MEDIUM: 300,        // 5 minutes
    LONG: 3600,         // 1 hour
    VERY_LONG: 86400    // 24 hours
};

// Type for GitHub API error responses
interface ApiError extends Error {
    response?: {
        status?: number;
        headers?: Record<string, string>;
    };
    status?: number;
    code?: string;
    details?: string;
    message: string;
}

const ERROR_CODES = {
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    MISSING_OWNER: 'MISSING_OWNER',
    INVALID_USERNAME: 'INVALID_USERNAME',
    USER_NOT_FOUND: 'USER_NOT_FOUND'
} as const;

// Service Instance
// ===============
const typedGithubService: GitHubService = githubService;

// Utility Functions
// ================

/**
 * Creates a standardized error response
 */
const createErrorResponse = ({
                                 code,
                                 message,
                                 details,
                                 status,
                                 retryAfter
                             }: {
    code: string;
    message: string;
    details: string;
    status: number;
    retryAfter?: string;
}): ApiResponse<null> => ({
    success: false,
    error: { code, message, details, status, ...(retryAfter ? { retryAfter } : {}) },
    status
});

/**
 * Creates a standardized success response
 */
const createSuccessResponse = <T>(data: T, status = 200): ApiResponse<T> => ({
    success: true,
    data,
    status
});

/**
 * Handles errors consistently across the application
const handleError = (res: Response, error: unknown, context: string): Response => {
    console.error(`Error in ${context}:`, error);

    // Handle different error types
    if (error && typeof error === 'object') {
        const apiError = error as Record<string, any>;
        
        // Extract response data if it exists
        const response = apiError.response || {};
        const headers = response.headers || {};
        const data = response.data || {};
        
        // Handle GitHub API errors
        if (data.message && data.documentation_url) {
            // This is a GitHub API error
            if (response.status === 404) {
                return res.status(404).json(
                    createErrorResponse({
                        code: 'NOT_FOUND',
                        message: 'Resource not found',
                        details: data.message,
                        status: 404
                    })
                );
            }
            
            // Handle rate limiting
            if (response.status === 403 && data.message.includes('API rate limit exceeded')) {
                const resetTime = headers['x-ratelimit-reset'] 
                    ? new Date(parseInt(headers['x-ratelimit-reset']) * 1000).toISOString() 
                    : 'unknown';
                
                return res.status(429).json(
                    createErrorResponse({
                        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                        message: 'GitHub API rate limit exceeded',
                        details: data.message,
                        status: 429,
                        retryAfter: resetTime
                    })
                );
            }
        }
        
        // Handle our custom error format
        if (apiError.code && apiError.status) {
            return res.status(apiError.status).json(
                createErrorResponse({
                    code: apiError.code,
                    message: apiError.message || 'An error occurred',
                    details: apiError.details || 'No additional details available',
                    status: apiError.status
                })
            );
        }

        // Handle validation errors
        if (apiError.code === ERROR_CODES.VALIDATION_ERROR) {
            return res.status(400).json(
                createErrorResponse({
                    code: ERROR_CODES.VALIDATION_ERROR,
                    message: apiError.message || 'Validation failed',
                    details: 'details' in apiError && typeof apiError.details === 'string'
                        ? apiError.details
                        : 'Invalid input provided.',
                    status: 400
                })
            );
        }
    }

    // Default error response
    let errorMessage = 'An unknown error occurred';

    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
    }
    return res.status(500).json(
        createErrorResponse({
            code: ERROR_CODES.INTERNAL_SERVER_ERROR,
            message: 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'production'
                ? 'Please try again later.'
                : String(errorMessage),
            status: 500,
        })
    );
};

/**
 * Calculates statistics for a list of repositories
 */
const calculateRepoStats = (repos: GitHubRepo[]): {
    totalRepos: number;
    totalStars: number;
    totalForks: number;
    totalWatchers: number;
    avgStars: number;
    avgForks: number;
    languages: Record<string, number>;
    mostStarred: GitHubRepo | null;
    mostForked: GitHubRepo | null;
} => {
    const totalRepos = repos.length;
    const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
    const totalWatchers = repos.reduce((sum, repo) => sum + (repo.watchers_count || 0), 0);

    // Calculate averages
    const avgStars = totalRepos > 0 ? totalStars / totalRepos : 0;
    const avgForks = totalRepos > 0 ? totalForks / totalRepos : 0;

    // Get unique languages with count
    const languages: Record<string, number> = {};
    repos.forEach(repo => {
        if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
    });

    // Find most starred and forked repositories
    const mostStarred = repos.length > 0
        ? repos.reduce((prev, current) =>
            (prev.stargazers_count || 0) > (current.stargazers_count || 0) ? prev : current
        )
        : null;

    const mostForked = repos.length > 0
        ? repos.reduce((prev, current) =>
            (prev.forks_count || 0) > (current.forks_count || 0) ? prev : current
        )
        : null;

    return {
        totalRepos,
        totalStars,
        totalForks,
        totalWatchers,
        avgStars,
        avgForks,
        languages,
        mostStarred,
        mostForked
    };
};

// Controller Methods
// =================

/**
 * Handles GET request to fetch GitHub repositories for a specific owner.
 *
 * @route GET /api/repos/:owner
 * @param req - Express request object containing the owner parameter
 * @param res - Express response object for sending the API response
 * @returns A promise that resolves to an Express response with repository data
 *
 * Fetches repositories for the specified GitHub user and returns the results. Handles various error cases including invalid input and GitHub API errors.
 */
export const getReposByOwner = async (req: Request, res: Response) => {
    try {
        const { owner } = req.params;

        // Validate username
        if (!owner) {
            return res.status(400).json(createErrorResponse({
                code: ERROR_CODES.MISSING_OWNER,
                message: 'Username is required',
                details: 'The owner parameter is required in the request URL',
                status: 400
            }));
        }

        // Rate limiting headers
        res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute

        // Fetch repositories for the specified owner
        // Ensure the method name matches the one in your GitHubService
        const repositories = await typedGithubService.getReposByOwner(owner);

        res.json({
            success: true,
            data: {
                owner,
                repositories,
                count: repositories.length,
                ...(repositories.length === 0 && { message: 'No public repositories found for this user' })
            },
            status: 200
        } as ApiResponse<{
            owner: string;
            repositories: GitHubRepo[];
            count: number;
            message?: string
        }>);

    } catch (error) {
        return handleError(res, error, 'getReposByOwner');
    }
};

/**
 * Handles GET request to fetch the initial set of public repositories from GitHub
 *
 * @route GET /api/repos/initial
 * @param req - Express request object
 * @param res - Express response object for sending the API response
 * @returns A promise that resolves to an Express response with repository data
 *
 * This endpoint fetches the most recently updated public repositories from GitHub,
 * limited to 20 repositories for performance and rate limiting considerations.
 */
export const getInitialRepos = async (req: Request, res: Response) => {
    try {
        // Rate limiting headers
        res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute

        // Fetch initial repositories
        // Ensure the method name matches the one in your GitHubService
        const repositories = await typedGithubService.getInitialRepos();

        res.json({
            success: true,
            data: {
                repositories,
                count: repositories.length,
                ...(repositories.length === 0 && { message: 'No public repositories found' })
            },
            status: 200
        } as ApiResponse<{
            repositories: GitHubRepo[];
            count: number;
            message?: string
        }>);

    } catch (error) {
        return handleError(res, error, 'getInitialRepos');
    }
};

/**
 * Retrieves statistics about a GitHub user's repositories.
 *
 * @route GET /api/repos/:owner/stats
 * @param req - Express request object containing the owner parameter
 * @param res - Express response object for sending the API response
 * @returns A promise that resolves to an Express response with repository statistics
 *
 * This endpoint provides aggregated statistics for all repositories owned by the specified GitHub user,
 * including total count, stars, forks, and a list of unique programming languages used across repositories.
 */
export const getRepoStats = async (req: Request, res: Response) => {
    try {
        const { owner } = req.params;

        // Validate username
        if (!owner) {
            return handleError(res, {
                code: ERROR_CODES.MISSING_OWNER,
                message: 'Username is required',
                status: 400
            }, 'getRepoStats:validation');
        }

        // Rate limiting headers
        res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

        // Get repositories for the user
        // Ensure the method name matches the one in your GitHubService
        const repos = await typedGithubService.getReposByOwner(owner);

        // Calculate statistics
        const totalRepos = repos.length;
        const totalStars = repos.reduce((sum: number, repo: GitHubRepo) => sum + (repo.stargazers_count || 0), 0);
        const totalForks = repos.reduce((sum: number, repo: GitHubRepo) => sum + (repo.forks_count || 0), 0);
        const totalWatchers = repos.reduce((sum: number, repo: GitHubRepo) => sum + (repo.watchers_count || 0), 0);

        // Calculate average stats
        const avgStars = totalRepos > 0 ? Math.round((totalStars / totalRepos) * 100) / 100 : 0;
        const avgForks = totalRepos > 0 ? Math.round((totalForks / totalRepos) * 100) / 100 : 0;

        // Get unique languages with count
        const languageStats = repos.reduce((acc: Record<string, number>, repo: GitHubRepo) => {
            if (repo.language) {
                acc[repo.language] = (acc[repo.language] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        // Convert to array and sort by count (descending)
        const languages = Object.entries(languageStats)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([language, count]) => ({ language, count }));

        // Get most starred repository
        const mostStarred = repos.length > 0
            ? repos.reduce((prev, current) =>
                (prev.stargazers_count || 0) > (current.stargazers_count || 0) ? prev : current
            )
            : null;

        // Get most forked repository
        const mostForked = repos.length > 0
            ? repos.reduce((prev, current) =>
                (prev.forks_count || 0) > (current.forks_count || 0) ? prev : current
            )
            : null;

        return res.json({
            success: true,
            data: {
                owner,
                totalRepos,
                totalStars,
                totalForks,
                totalWatchers,
                avgStars,
                avgForks,
                languages,
                mostStarred: mostStarred ? {
                    name: mostStarred.name,
                    stars: mostStarred.stargazers_count || 0,
                    url: mostStarred.html_url
                } : null,
                mostForked: mostForked ? {
                    name: mostForked.name,
                    forks: mostForked.forks_count || 0,
                    url: mostForked.html_url
                } : null,
                updatedAt: new Date().toISOString()
            },
            status: 200
        } as ApiResponse<{
            owner: string;
            totalRepos: number;
            totalStars: number;
            totalForks: number;
            totalWatchers: number;
            avgStars: number;
            avgForks: number;
            languages: Array<{ language: string; count: number }>;
            mostStarred: { name: string; stars: number; url: string } | null;
            mostForked: { name: string; forks: number; url: string } | null;
            updatedAt: string;
        }>);
    } catch (error) {
        return handleError(res, error, 'getRepoStats');
    }
};