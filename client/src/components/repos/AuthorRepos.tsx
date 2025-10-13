import ErrorBoundary from '../common/ErrorBoundary';

/**
 * AuthorRepos Component
 * 
 * A React component that allows users to search for and display GitHub repositories by username.
 * 
 * Features:
 * - Input field to enter a GitHub username
 * - Fetches and displays repositories using the GitHub API
 * - Handles loading states and error messages
 * - Displays repository list using the RepoList component
 * - Responsive error handling for API failures and empty inputs
 * 
 * State Management:
 * - owner: Tracks the GitHub username input
 * - response: Stores the API response with repository data
 * - loading: Tracks API request status
 * - error: Stores error messages for display
 */

import React, { useState, useCallback } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { getReposByOwner } from '../../services/api';
import { RepoResponse } from '../../types/repo';
import RepoList from './RepoList';

const AuthorRepos: React.FC = () => {
    const [owner, setOwner] = useState('');
    const [response, setResponse] = useState<RepoResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        hasNextPage: false,
        hasPreviousPage: false,
        totalCount: 0
    });

    // Define fetchRepositories with useCallback at the top level of the component
    const fetchRepositories = useCallback(async (page: number, perPage: number) => {
        const trimmedOwner = owner.trim();
        if (!trimmedOwner) {
            setError('Please enter a GitHub username');
            setIsInitialLoad(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await getReposByOwner(trimmedOwner);
            
            // Update pagination first to ensure it's always in sync
            const newPagination = {
                currentPage: page,
                perPage,
                hasNextPage: result.data?.pagination?.hasNextPage || false,
                hasPreviousPage: page > 1,
                totalCount: result.data?.pagination?.totalCount || result.data?.count || 0
            };
            setPagination(newPagination);
            
            // Update the response state
            const updatedResponse = {
                ...result,
                data: {
                    owner: result.data?.owner || trimmedOwner,
                    repositories: result.data?.repositories || [],
                    count: result.data?.count || 0,
                    pagination: newPagination
                }
            };
            
            setResponse(updatedResponse);
            
            // Handle error states
            if (!result.success) {
                const errorMsg = result.error || 'Failed to fetch repositories';
                setError(errorMsg);
                console.error('API Error:', errorMsg);
            } else if (!result.data?.repositories?.length) {
                setError('No repositories found for this user');
            }
            
            return updatedResponse;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
            const formattedError = `Error: ${errorMessage}`;
            setError(formattedError);
            console.error('API Error:', err);
            
            // Reset the response on error
            setResponse(null);
            setPagination(prev => ({
                ...prev,
                currentPage: 1,
                hasNextPage: false,
                hasPreviousPage: false,
                totalCount: 0
            }));
            throw err; // Re-throw to be caught by error boundary
        } finally {
            setLoading(false);
            setIsInitialLoad(false);
        }
    }, [owner, pagination.perPage]); // Add dependency array, [owner, pagination.perPage]);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetchRepositories(1, pagination.perPage);
        } catch (error) {
            // Error is already handled in fetchRepositories
            console.error('Error in handleSubmit:', error);
        }
    };

    const handlePageChange = async (page: number) => {
        try {
            await fetchRepositories(page, pagination.perPage);
            // Smooth scroll to top on page change
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            // Error is already handled in fetchRepositories
            console.error('Error in handlePageChange:', error);
        }
    };

    // Render loading state
    if (loading && isInitialLoad) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <ErrorBoundary
            fallback={
                <div className="bg-red-900/20 border border-red-500 text-red-200 p-4 rounded-lg my-4">
                    <h3 className="font-bold text-lg mb-2">Something went wrong</h3>
                    <p className="mb-3">We're having trouble loading the repositories. Please try again later.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
                    >
                        Reload Page
                    </button>
                </div>
            }
        >
            <div className="w-full max-w-4xl mx-auto p-4">
                <div className="bg-gray-800 p-5 rounded-lg shadow-md my-5">
                    <div className="relative">
                        <input
                            type="text"
                            name="github-username"
                            autoComplete="off"
                            data-form-type="other"
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Enter GitHub username"
                            className="w-full px-4 py-3 rounded border-2 border-gray-600 bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                            disabled={loading}
                            aria-label="GitHub username"
                        />
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || !owner.trim()}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 rounded ${
                                loading || !owner.trim()
                                    ? 'bg-gray-600 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            } text-white transition-colors`}
                            aria-label={loading ? 'Loading...' : 'Search repositories'}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Searching...
                                </span>
                            ) : (
                                'Search'
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div 
                        className="bg-red-900/20 border border-red-500 text-red-200 p-4 rounded-lg my-4"
                        role="alert"
                        aria-live="assertive"
                    >
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {!loading && response?.data ? (
                    <div className="mt-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {response.data.count} {response.data.count === 1 ? 'repository' : 'repositories'} found for {response.data.owner}
                        </h2>
                        
                        <ErrorBoundary
                            fallback={
                                <div className="bg-red-900/20 border border-red-500 text-red-200 p-4 rounded-lg my-4">
                                    <p>Failed to load repository list. Please try again.</p>
                                </div>
                            }
                        >
                            {response.data.repositories.length > 0 ? (
                                <RepoList
                                    initialRepositories={response.data.repositories}
                                    owner={response.data.owner}
                                    initialPagination={pagination}
                                    onPageChange={handlePageChange}
                                />
                            ) : !error && (
                                <div className="bg-gray-800/50 border border-gray-700 text-gray-400 p-8 text-center rounded-lg">
                                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-white mb-1">No repositories found</h3>
                                    <p>This user doesn't have any public repositories yet.</p>
                                </div>
                            )}
                        </ErrorBoundary>
                    </div>
                ) : null}

                {loading && !isInitialLoad && (
                    <div className="flex justify-center items-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default AuthorRepos;