/**
 * API service module for interacting with the repository-related backend endpoints.
 */
import axios from 'axios';
import type { RepoResponse } from '../types/repo';

// Use relative URL to work with Vite's proxy
const api = axios.create({
    baseURL: '/api', // This will be proxied to http://localhost:3001
    timeout: 10000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

export interface ApiError {
    message: string;
    status?: number;
    data?: any;
}

// Helper function to create consistent error responses
const createErrorResponse = (
    error: unknown, 
    defaultData: { owner: string; repositories: any[]; count: number } = { owner: '', repositories: [], count: 0 }
): RepoResponse => {
    let errorMessage = 'An unknown error occurred';
    
    if (axios.isAxiosError(error)) {
        errorMessage = (error.response?.data as any)?.error || error.message || 'Failed to fetch repositories';
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    return {
        success: false,
        error: errorMessage,
        data: defaultData
    };
};

export const getReposByOwner = async (owner: string): Promise<RepoResponse> => {
    if (!owner.trim()) {
        return createErrorResponse({
            message: 'Invalid owner name provided',
            status: 400,
            data: {
                owner: '',
                repositories: [],
                count: 0
            }
        });
    }

    try {
        console.log(`[API] Fetching repositories for owner: ${owner}`);
        const response = await api.get<RepoResponse>(`/repos/${encodeURIComponent(owner)}`);
        
        // Validate response structure
        if (!response.data || typeof response.data !== 'object') {
            return createErrorResponse('Invalid response format from server', {
                owner,
                repositories: [],
                count: 0
            });
        }

        // If the response is successful, return the data
        if (response.data.success && response.data.data) {
            return {
                success: true,
                data: {
                    owner: response.data.data.owner,
                    repositories: Array.isArray(response.data.data.repositories) 
                        ? response.data.data.repositories 
                        : [],
                    count: response.data.data.count || 0
                }
            };
        }

        // Handle error response from server
        return {
            success: false,
            error: (response.data as any).error || 'Failed to fetch repositories',
            data: {
                repositories: [],
                owner,
                count: 0
            }
        };
    } catch (error: unknown) {
        console.error('API Error:', error);
        return createErrorResponse(error, { owner, repositories: [], count: 0 });
    }
};

export default api;