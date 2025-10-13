import { Response } from 'express';
import { ApiResponse } from '../controllers/reposController';

interface ErrorWithStatus extends Error {
    status?: number;
    code?: string;
    response?: {
        status?: number;
        data?: any;
        headers?: any;
    };
    details?: any;
    documentation_url?: string;
}

/**
 * Handles errors consistently across the application
 * @param res - Express response object
 * @param error - The error object
 * @param context - Context where the error occurred (e.g., 'getReposByOwner')
 * @returns Express response with error details
 */
export function handleError(res: Response, error: unknown, context: string): Response<ApiResponse<null>> {
    console.error(`[${new Date().toISOString()}] Error in ${context}:`, error);

    // Default error response
    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details = 'Please try again later';

    // Handle different types of errors
    if (error instanceof Error) {
        const err = error as ErrorWithStatus;
        
        // Check if this is a GitHubError (has status and code properties)
        if (err.status && err.code) {
            statusCode = err.status;
            errorCode = err.code;
            message = err.message || 'GitHub API error';
            details = err.details || 'An error occurred while fetching data from GitHub';
        }
        // Handle HTTP errors from axios responses
        else if (err.response?.status) {
            statusCode = err.response.status;
            
            switch (statusCode) {
                case 401:
                    errorCode = 'UNAUTHORIZED';
                    message = 'Authentication failed';
                    details = 'Invalid or missing authentication credentials';
                    break;
                case 403:
                    errorCode = 'FORBIDDEN';
                    message = 'Access denied';
                    details = 'You do not have permission to access this resource';
                    break;
                case 404:
                    errorCode = 'NOT_FOUND';
                    message = 'Resource not found';
                    details = 'The requested resource could not be found';
                    break;
                case 429:
                    errorCode = 'RATE_LIMIT_EXCEEDED';
                    message = 'Rate limit exceeded';
                    details = 'Too many requests, please try again later';
                    break;
            }
        }
        // Handle custom error codes
        else if (err.code === 'ENOTFOUND') {
            errorCode = 'NETWORK_ERROR';
            message = 'Network error';
            details = 'Could not connect to the server';
        }
        // For other errors, use the error message if available
        else if (err.message) {
            message = err.message;
        }
        
        // Add details if available
        if (err.details) {
            details = typeof err.details === 'string' ? err.details : JSON.stringify(err.details);
        }
    }

    // Log the full error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error details:', error);
    }

    return res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message,
            details,
            status: statusCode
        }
    });
}
