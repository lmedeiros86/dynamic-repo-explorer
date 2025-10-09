import { Request, Response } from 'express';
import githubService from '../services/githubService';
import { ApiResponse, GitHubRepo } from '../types/github';

/**
 * Handles GET request to fetch GitHub repositories for a specific owner.
 * 
 * @route GET /api/repos/:owner
 * @param {Request} req - Express request object containing the owner parameter
 * @param {Response} res - Express response object for sending the API response
 * @returns {Promise<Response>} Returns a JSON response containing:
 *   - On success: { success: true, data: { owner: string, repositories: GitHubRepo[], count: number } }
 *   - On error: { success: false, error: string } with appropriate status code
 * 
 * The function validates the owner parameter, fetches repositories using githubService,
 * and returns the results. Handles various error cases including invalid input and GitHub API errors.
 */
export const getReposByOwner = async (req: Request, res: Response) => {
    try {
        const { owner } = req.params;

        // Validate input
        if (!owner || owner.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Owner parameter is required and must be a non-empty string'
            } as ApiResponse<null>);
        }

        // Fetch repositories
        const repositories = await githubService.getUserRepos(owner.trim());

        return res.json({
            success: true,
            data: {
                owner: owner.trim(),
                repositories,
                count: repositories.length
            }
        } as ApiResponse<{ owner: string; repositories: GitHubRepo[]; count: number }>);

    } catch (error: any) {
        console.error('Error in getReposByOwner:', error.message);

        const statusCode = error.response?.status || 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Internal server error'
        } as ApiResponse<null>);
    }
};

/**
 * Retrieves statistics about a GitHub user's repositories.
 * 
 * @route GET /api/repos/:owner/stats
 * @param {Request} req - Express request object containing the owner parameter
 * @param {Response} res - Express response object for sending the API response
 * @returns {Promise<Response>} Returns a JSON response containing:
 *   - On success: { 
 *       success: true, 
 *       data: {
 *         totalRepos: number,
 *         totalStars: number,
 *         totalForks: number,
 *         languages: string[]
 *       }
 *     }
 *   - On error: { success: false, error: string } with appropriate status code
 * 
 * This endpoint provides aggregated statistics for all repositories owned by the specified GitHub user,
 * including total count, stars, forks, and a list of unique programming languages used across repositories.
 */
export const getReposStats = async (req: Request, res: Response) => {
    try {
        const { owner } = req.params;

        if (!owner || owner.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Owner parameter is required and must be a non-empty string'
            } as ApiResponse<null>);
        }

        const repositories = await githubService.getUserRepos(owner.trim());
        
        // Get unique languages (filter out null/undefined and empty strings)
        const languages = Array.from(
            new Set(
                repositories
                    .map(repo => repo.language)
                    .filter((lang): lang is string => Boolean(lang))
            )
        );

        const stats = {
            totalRepos: repositories.length,
            totalStars: repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0),
            totalForks: repositories.reduce((sum, repo) => sum + (repo.forks_count || 0), 0),
            languages
        };
        
        return res.json({
            success: true,
            data: stats
        } as ApiResponse<typeof stats>);
            
    } catch (error: any) {
        console.error('Error in getReposStats:', error.message);
        
        const statusCode = error.response?.status || 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Internal server error'
        } as ApiResponse<null>);
    }
};
