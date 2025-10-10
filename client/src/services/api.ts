/**
 * API service module for interacting with the repository-related backend endpoints.
 * Configures an axios instance with base URL from environment variables (falling back to localhost:5000).
 * Provides functions to make authenticated requests to the backend API.
 */

import axios from 'axios';
import { RepoResponse } from '../types/repo';

// Vite uses import.meta.env for environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({ // This creates an axios instance with custom config
    baseURL: API_BASE_URL,
    timeout: 10000,
});

export const getReposByOwner = async (owner: string): Promise<RepoResponse> => {
    try {
        const response = await api.get<RepoResponse>(`/api/repos/${owner}`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error || error.message || 'An error occurred'
        };
    }
};

export default api;