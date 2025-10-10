/**
 * API service module for interacting with the repository-related backend endpoints.
 * Configures an axios instance with base URL from environment variables (falling back to localhost:5000).
 * Provides functions to make authenticated requests to the backend API.
 */

import * as axios from 'axios';
import { RepoResponse } from '../types/repo';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
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