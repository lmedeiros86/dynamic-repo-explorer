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

import React, { useState } from 'react';
import { getReposByOwner } from "../../services/api";
import { RepoResponse } from '../../types/repo';
import RepoList from './RepoList';

const AuthorRepos: React.FC = () => {
    const [owner, setOwner] = useState('');
    const [response, setResponse] = useState<RepoResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        hasNextPage: false,
        hasPreviousPage: false,
        totalCount: 0
    });

    const fetchRepositories = async (page: number, perPage: number) => {
        const trimmedOwner = owner.trim();
        if (!trimmedOwner) {
            setError('Please enter a GitHub username');
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
            setResponse({
                ...result,
                data: {
                    owner: result.data?.owner || trimmedOwner,
                    repositories: result.data?.repositories || [],
                    count: result.data?.count || 0,
                    pagination: newPagination
                }
            });
            
            // Handle error states
            if (!result.success) {
                setError(result.error || 'Failed to fetch repositories');
            } else if (!result.data?.repositories?.length) {
                setError('No repositories found for this user');
            }
            
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
            setError(`Error: ${errorMessage}`);
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
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await fetchRepositories(1, pagination.perPage);
    };

    const handlePageChange = async (page: number) => {
        await fetchRepositories(page, pagination.perPage);
    };

    return (
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
                        placeholder="Enter GitHub username"
                        className="w-full px-4 py-3 rounded border-2 border-gray-600 bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 rounded ${
                            loading 
                                ? 'bg-gray-600 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                    >
                        {loading ? 'Loading...' : 'Search'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500 text-white p-3 rounded-md my-4">
                    <p>Error: {error}</p>
                </div>
            )}

            {!loading && response?.data && (
                <div className="mt-6">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        {response.data.count} {response.data.count === 1 ? 'repository' : 'repositories'} found for {response.data.owner}
                    </h2>
                    {response.data.repositories.length > 0 ? (
                        <RepoList
                            initialRepositories={response.data.repositories}
                            owner={response.data.owner}
                            initialPagination={pagination}
                            onPageChange={handlePageChange}
                        />
                    ) : !error && (
                        <div className="text-gray-400 text-center py-8">
                            No repositories found for this user.
                        </div>
                    )}
                </div>
            )}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}
        </div>
    );
};

export default AuthorRepos;