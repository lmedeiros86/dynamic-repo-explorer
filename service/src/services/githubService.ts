import axios, { type AxiosResponse } from 'axios';
import { GitHubRepo, GitHubUser } from '@/types/github';

class GitHubService {
    private readonly BASE_URL = 'https://api.github.com';
    private readonly axiosInstance: ReturnType<typeof axios.create>;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: this.BASE_URL,
            timeout: 10000,
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'dynamic-repo-explorer',
            }
        });
    }

    /**
     * Fetches public repositories for a specified GitHub user
     * @param owner - GitHub username to fetch repositories for
     * @returns Promise resolving to an array of GitHubRepo objects
     * @throws {Error} Throws an error if user not found, rate limited, or other API errors occur
     * @example
     * const repos = await githubService.getUserRepos('username');
     */
    async getUserRepos(owner: string): Promise<GitHubRepo[]> {
        try {
            const response: AxiosResponse<GitHubRepo[]> = await this.axiosInstance.get(`/users/${owner}/repos`, {
                params: {
                    type: 'public',
                    sort: 'update',
                    per_page: 100
                }
            });

            return response.data;
        } catch (error: any) {
            if (error.response) {
                const status = error.response.status;
                if (status === 404) {
                    throw new Error('User not found');
                } else if (status === 403) {
                    throw new Error('API rate limit exceeded');
                } else {
                    throw new Error(error.response.data.message || 'Error fetching repositories');
                }
            } else if (error.request) {
                throw new Error('Network error - unable to reach GitHub API');
            } else {
                throw new Error('An unexpected error occurred');
            }
        }
    }

    /**
     * Fetches profile information for a specified GitHub user
     * @param owner - GitHub username to fetch profile for
     * @returns Promise resolving to a GitHubUser object
     * @throws {Error} Throws an error if user not found or other API errors occur
     * @example
     * const user = await githubService.getUserProfile('username');
     */
    async getUserProfile(owner: string): Promise<GitHubUser> {
        try {
            const response: AxiosResponse<GitHubUser> = await this.axiosInstance.get(`/users/${owner}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                throw new Error('User not found');
            }
            throw error;
        }
    }
}

export default new GitHubService();
