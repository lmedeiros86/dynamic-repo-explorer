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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!owner.trim()) {
            setError('Please enter a GitHub username')
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const result = await getReposByOwner(owner);
            setResponse(result);

            if (!result.success) {
                setError(result.error || 'Failed to fetch repositories');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <form 
                onSubmit={handleSubmit} 
                className="bg-gray-800 p-5 rounded-lg shadow-md my-5"
            >
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        placeholder="Enter GitHub username"
                        className="px-4 py-3 rounded border-2 border-gray-600 bg-gray-700 text-white focus:outline-none focus:border-blue-500 flex-grow"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-3 rounded font-medium transition-colors ${
                            loading 
                                ? 'bg-gray-600 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                    >
                        {loading ? 'Loading...' : 'Search Repositories'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="bg-red-500 text-white p-3 rounded-md my-4">
                    <p>Error: {error}</p>
                </div>
            )}

            {response?.success && response.data && (
                <RepoList
                    repositories={response.data.repositories}
                    owner={response.data.owner}
                />
            )}
        </div>
    );
};

export default AuthorRepos;