import axios, {
    type AxiosResponse,
    type AxiosError,
    type AxiosRequestConfig,
    type AxiosInstance,
} from 'axios';
import NodeCache from 'node-cache';

// Define types directly in the service file
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

interface GitHubHeaders {
    'x-ratelimit-limit'?: string;
    'x-ratelimit-remaining'?: string;
    'x-ratelimit-reset'?: string;
    'x-ratelimit-used'?: string;
    [key: string]: any;
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

// Cache with 5 minute TTL
const cache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

// Rate limit tracking
let rateLimit: GitHubRateLimit = {
    limit: 60,
    remaining: 60,
    reset: 0,
    used: 0
};

// Interface for GitHubService to ensure proper typing
interface IGitHubService {
    getReposByOwner(owner: string): Promise<GitHubRepo[]>;
    getInitialRepos(): Promise<GitHubRepo[]>;
    getUserProfile(owner: string): Promise<GitHubUser>;
    getRepoStats(owner: string): Promise<RepoStats>;
}

class GitHubService implements IGitHubService {
    private readonly BASE_URL = 'https://api.github.com'; // Fixed URL
    private readonly axiosInstance: AxiosInstance;
    private readonly maxRetries = 3;
    private readonly retryDelay = 1000; // 1 second

    constructor() {
        // Get GitHub token from environment variables
        const githubToken = process.env.GITHUB_TOKEN;

        if (!githubToken) {
            console.error('GitHub token is not set. Please set GITHUB_TOKEN in your .env file');
            // Don't throw here, but the requests will likely fail with 401
        }

        this.axiosInstance = axios.create({
            baseURL: this.BASE_URL,
            timeout: 10000,
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'dynamic-repo-explorer',
                'X-GitHub-Api-Version': '2022-11-28',
                ...(githubToken && { 'Authorization': `token ${githubToken}` })
            }
        });

        // Add response interceptor to handle rate limiting
        this.axiosInstance.interceptors.response.use(
            this.handleResponse.bind(this),
            this.handleError.bind(this)
        );
    }

    /**
     * Validates a GitHub username format
     * @param username The username to validate
     * @throws {GitHubError} If the username is invalid
     */
    private validateUsername(username: string): void {
        if (!username || typeof username !== 'string' || !/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
            const error: GitHubError = {
                code: 'INVALID_INPUT',
                message: 'Invalid GitHub username format',
                status: 400
            };
            throw error;
        }
    }

    /**
     * Makes a request to the GitHub API with retry logic
     */
    private async makeRequest<T>(
        config: AxiosRequestConfig,
        retryCount = 0
    ): Promise<T> {
        try {
            const cacheKey = JSON.stringify(config);
            const cached = cache.get<T>(cacheKey);
            if (cached) {
                return cached;
            }

            const response = await this.axiosInstance.request<T>(config);

            // Cache successful responses
            if (response.status === 200) {
                cache.set(cacheKey, response.data);
            }

            return response.data;
        } catch (error: unknown) {
            if (retryCount >= this.maxRetries) {
                throw this.normalizeError(error);
            }

            // Don't retry for client errors (4xx) except 429 (Too Many Requests)
            if (axios.isAxiosError(error) && error.response?.status &&
                error.response.status >= 400 &&
                error.response.status < 500 &&
                error.response.status !== 429) {
                throw this.normalizeError(error);
            }

            // Exponential backoff with jitter
            const jitter = Math.random() * 1000; // Add up to 1s jitter
            const delay = this.retryDelay * Math.pow(2, retryCount) + jitter;
            await new Promise(resolve => setTimeout(resolve, delay));

            return this.makeRequest<T>(config, retryCount + 1);
        }
    }

    /**
     * Handles successful responses and updates rate limit info
     */
    private handleResponse<T>(response: AxiosResponse<T>): AxiosResponse<T> {
        // Correctly type the headers
        const headers = response.headers as GitHubHeaders;
        this.updateRateLimit(headers);
        return response;
    }

    /**
     * Handles errors and rate limiting
     */
    private handleError(error: AxiosError): Promise<never> {
        if (error.response) {
            // Correctly type the headers
            const headers = error.response.headers as GitHubHeaders;
            this.updateRateLimit(headers);

            // If we hit rate limit, calculate when to retry
            if (error.response.status === 403 && headers['x-ratelimit-remaining'] === '0') {
                const resetTime = parseInt(headers['x-ratelimit-reset'] || '0', 10) * 1000;
                const retryAfter = Math.max(0, resetTime - Date.now());
                error.message = `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`;
            }
        }
        return Promise.reject(this.normalizeError(error));
    }

    /**
     * Normalizes different error types into a consistent format
     */
    private normalizeError(error: any): GitHubError {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                return {
                    code: error.response.status.toString(),
                    message: error.response.data?.message || 'GitHub API error',
                    status: error.response.status,
                    details: error.response.data?.errors,
                    documentation_url: error.response.data?.documentation_url
                };
            } else if (error.request) {
                // The request was made but no response was received
                return {
                    code: 'NETWORK_ERROR',
                    message: 'Network error - unable to reach GitHub API',
                    status: 0
                };
            }
        }

        // Unknown error type
        return {
            code: 'UNKNOWN_ERROR',
            message: error.message || 'An unknown error occurred',
            status: 500
        };
    }

    /**
     * Updates rate limit information from response headers
     */
    private updateRateLimit(headers: GitHubHeaders): void {
        const limit = headers['x-ratelimit-limit'];
        if (limit) {
            rateLimit = {
                limit: parseInt(limit, 10),
                remaining: parseInt(headers['x-ratelimit-remaining'] || '0', 10),
                reset: parseInt(headers['x-ratelimit-reset'] || '0', 10) * 1000, // Convert to milliseconds
                used: parseInt(headers['x-ratelimit-used'] || '0', 10)
            };
        }
    }

    /**
     * Gets the current rate limit status
     */
    public getRateLimit(): GitHubRateLimit {
        return { ...rateLimit };
    }

    /**
     * Fetches a list of initial repositories to display when the app loads
     * @returns A promise that resolves to an array of featured GitHub repositories
     */
    async getInitialRepos(): Promise<GitHubRepo[]> {
        try {
            // You can customize this to return trending or featured repositories
            // For now, we'll return some popular repositories as an example
            const response = await this.makeRequest<{ items: GitHubRepo[] }>({
                method: 'get',
                url: '/search/repositories',
                params: {
                    q: 'stars:>10000',
                    sort: 'stars',
                    order: 'desc',
                    per_page: 10,
                    page: 1
                }
            });

            return response.items || [];
        } catch (error: unknown) {
            console.error('Error fetching initial repositories:', error);
            // Return an empty array in case of error to prevent app from breaking
            return [];
        }
    }

    /**
     * Fetches public repositories for a specified GitHub user
     * @param owner The GitHub username or organization name
     * @returns A promise that resolves to an array of GitHub repositories
     * @throws {GitHubError} If the request fails or the user is not found
     */
    async getReposByOwner(owner: string): Promise<GitHubRepo[]> {
        this.validateUsername(owner);
        
        const cacheKey = `repos:${owner}`;
        const cachedRepos = cache.get<GitHubRepo[]>(cacheKey);
        if (cachedRepos) {
            return cachedRepos;
        }

        try {
            // First, try to get the user profile to verify the user exists
            try {
                await this.getUserProfile(owner);
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    const notFoundError: GitHubError = {
                        code: 'USER_NOT_FOUND',
                        message: `User '${owner}' not found`,
                        status: 404,
                        details: error.response?.data
                    };
                    throw notFoundError;
                }
                // If it's not a 404, continue to try getting repos
            }

            // If we get here, the user exists, now get their repos
            const userRepos = await this.makeRequest<GitHubRepo[]>({
                method: 'get',
                url: `/users/${owner}/repos`,
                params: {
                    type: 'public',
                    sort: 'updated',
                    direction: 'desc',
                    per_page: 100,
                    page: 1
                }
            });

            const publicRepos = Array.isArray(userRepos) ? userRepos.filter(repo => !repo.private) : [];
            
            // Cache the result for 5 minutes, even if it's an empty array
            cache.set(cacheKey, publicRepos, 300);
            
            return publicRepos;
            
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                // If we already have a 404 error from getUserProfile, rethrow it
                if (error.response?.status === 404) {
                    throw error;
                }
                
                // Handle rate limiting
                if (error.response?.status === 403 && 
                    error.response?.headers['x-ratelimit-remaining'] === '0') {
                    const rateLimitError: GitHubError = {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'GitHub API rate limit exceeded',
                        status: 403,
                        details: error.response?.data
                    };
                    throw rateLimitError;
                }
            }
            
            // Re-throw the error with proper typing
            throw this.normalizeError(error);
        }
    }

    /**
     * Fetches profile information for a specified GitHub user
     * @param owner The GitHub username
     * @returns A promise that resolves to the user's profile information
     * @throws {GitHubError} If the request fails or the user is not found
     */
    async getUserProfile(owner: string): Promise<GitHubUser> {
        this.validateUsername(owner);

        try {
            return await this.makeRequest<GitHubUser>({
                method: 'get',
                url: `/users/${owner}`
            });
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                const notFoundError: GitHubError = {
                    code: 'USER_NOT_FOUND',
                    message: `User '${owner}' not found`,
                    status: 404
                };
                throw notFoundError;
            }
            throw this.normalizeError(error);
        }
    }

    /**
     * Gets statistics for a user's repositories
     * @param owner The GitHub username
     * @returns A promise that resolves to the repository statistics
     * @throws {GitHubError} If the request fails or the user is not found
     */
    async getRepoStats(owner: string): Promise<RepoStats> {
        this.validateUsername(owner);

        try {
            // First get all the user's repositories
            const repos = await this.getReposByOwner(owner);

            // Get the most recently updated repo for lastUpdated
            const lastUpdatedRepo = repos.sort((a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )[0];

            // Calculate statistics
            const stats: RepoStats = {
                owner,
                repo: lastUpdatedRepo?.name || '', // Use the name of the most recently updated repo
                totalCommits: 0, // This would require additional API calls to get actual commit count
                totalBranches: 0, // This would require additional API calls
                totalTags: 0, // This would require additional API calls
                totalContributors: 0, // This would require additional API calls
                lastUpdated: lastUpdatedRepo?.updated_at || new Date().toISOString(),
                totalForks: repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0),
                totalWatchers: repos.reduce((sum, repo) => sum + (repo.watchers_count || 0), 0),
                languages: repos
                    .map(repo => repo.language)
                    .filter((lang): lang is string => Boolean(lang)) // Type guard to filter out null/undefined
                    .reduce((acc, lang) => {
                        acc[lang] = (acc[lang] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>),
                repoList: repos.map(repo => ({
                    name: repo.name,
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    watchers: repo.watchers_count,
                    language: repo.language || 'Unknown',
                    url: repo.html_url
                }))
            };

            return stats;
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                const notFoundError: GitHubError = {
                    code: 'USER_NOT_FOUND',
                    message: `User '${owner}' not found`,
                    status: 404
                };
                throw notFoundError;
            }
            throw this.normalizeError(error);
        }
    }
}

// Export types and interfaces
export { 
  IGitHubService,
  GitHubRepo,
  GitHubUser,
  GitHubRateLimit,
  GitHubError,
  RepoStats 
};

// Export the class
export { GitHubService };

// Export a singleton instance
const githubService = new GitHubService();

export default githubService;