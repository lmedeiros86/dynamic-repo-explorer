/**
 * RepoList Component
 * 
 * Displays a list of GitHub repositories for a given owner.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {GitHubRepo[]} props.repositories - Array of repository objects to display
 * @param {string} props.owner - Name of the repository owner
 * @returns {JSX.Element} Renders a list of repositories or a message if none found
 * 
 * Features:
 * - Shows owner name and repository count in the header
 * - Renders individual RepoItem components for each repository
 * - Displays a friendly message when no repositories are found
 * - Uses TypeScript for type safety
 */
import React, { useState, useMemo, ReactElement, useEffect } from 'react';
import { GitHubRepo } from '../../types/repo';
import RepoItem from './RepoItem';
import { FaSpinner } from 'react-icons/fa';

type SortOption = 'stars-asc' | 'stars-desc' | 'name-asc' | 'name-desc';

interface PaginationInfo {
    currentPage: number;
    perPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalCount: number;
}

interface RepoListProps {
    initialRepositories: GitHubRepo[];
    owner: string;
    initialPagination?: PaginationInfo;
    onPageChange?: (page: number, perPage: number) => void;
}

const RepoList = ({ 
    initialRepositories, 
    owner, 
    initialPagination, 
    onPageChange 
}: RepoListProps): ReactElement => {
    const [sortBy, setSortBy] = useState<SortOption>('stars-desc');
    const [repositories, setRepositories] = useState<GitHubRepo[]>(initialRepositories);
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState<PaginationInfo>(initialPagination || {
        currentPage: 1,
        perPage: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        totalCount: 0
    });

    const fetchRepositories = async (page: number, perPage: number) => {
        try {
            setIsLoading(true);
            
            if (onPageChange) {
                // If parent component handles pagination, call the callback
                onPageChange(page, perPage);
            } else {
                // Fallback to direct API call if no callback provided
                const response = await fetch(`/api/repos/${owner}?page=${page}&per_page=${perPage}`);
                const data = await response.json();
                
                if (!response.ok) {
                    console.error('Failed to fetch repositories:', data);
                    setRepositories([]);
                    return;
                }
                
                // Handle both array and object responses
                const repos = Array.isArray(data) ? data : data.repositories || data.data || [];
                
                setRepositories(repos);
                
                // Update pagination if available in response, otherwise use defaults
                setPagination({
                    currentPage: page,
                    perPage,
                    hasNextPage: data.pagination?.hasNextPage || data.hasNextPage || false,
                    hasPreviousPage: page > 1,
                    totalCount: data.pagination?.totalCount || data.totalCount || repos.length
                });
            }
        } catch (error) {
            console.error('Error fetching repositories:', error);
            setRepositories([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch initial data if initialRepositories is empty
    useEffect(() => {
        if (initialRepositories.length === 0) {
            fetchRepositories(1, pagination.perPage);
        }
    }, [owner, pagination.perPage, initialRepositories.length]);

    // Update repositories when initialRepositories changes
    useEffect(() => {
        if (initialRepositories && initialRepositories.length > 0) {
            setRepositories(initialRepositories);
        }
    }, [initialRepositories]);

    const sortedRepos = useMemo(() => {
        return [...repositories].sort((a, b) => {
            switch (sortBy) {
                case 'stars-asc':
                    return (a.stargazers_count || 0) - (b.stargazers_count || 0);
                case 'stars-desc':
                    return (b.stargazers_count || 0) - (a.stargazers_count || 0);
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                default:
                    return 0;
            }
        });
    }, [repositories, sortBy]);


    if (isLoading && repositories.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-blue-500 text-2xl" />
                <span className="ml-2 text-gray-300">Loading repositories...</span>
            </div>
        );
    }

    if (repositories.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">No repositories found for {owner}.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">
                    Repositories for{' '}
                    <a 
                        href={`https://github.com/${owner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                    >
                        {owner}
                    </a>
                </h2>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-900/50 text-blue-300 border border-blue-700/50">
                        <span className="font-mono font-bold text-blue-200">{repositories.length}</span> {repositories.length === 1 ? 'Repository' : 'Repositories'}
                    </span>
                </div>
            </div>
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-300">All Repositories</h3>
                    <select 
                        className="px-4 py-2 border rounded-md bg-gray-800 text-white border-gray-600"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                    >
                        <option value="stars-desc">Most Stars</option>
                        <option value="stars-asc">Fewest Stars</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                    </select>
                </div>
                <div className="space-y-4 mb-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <FaSpinner className="animate-spin text-blue-500 text-2xl" />
                        </div>
                    ) : (
                        <>
                            {sortedRepos.map((repo) => (
                                <RepoItem key={repo.id} repo={repo} />
                            ))}
                            
                            {/* Pagination Controls */}
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 space-y-4 sm:space-y-0">
                                <div className="text-sm text-gray-400">
                                    Showing all {repositories.length} repositories
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RepoList;