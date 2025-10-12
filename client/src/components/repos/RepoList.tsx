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
    const [searchQuery, setSearchQuery] = useState('');
    const [repositories, setRepositories] = useState<GitHubRepo[]>(initialRepositories);
    const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>(initialRepositories);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimerRef = React.useRef<number | null>(null);
    
    // Cleanup function to clear any pending timeouts when component unmounts
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current !== null) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);
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

    // Handle search functionality
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        
        // If there's a search query, fetch new results, otherwise reset to initial repositories
        if (query.trim()) {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/repos/${owner}?q=${encodeURIComponent(query)}`);
                if (response.ok) {
                    const data = await response.json();
                    setRepositories(data.repositories);
                    setFilteredRepos(data.repositories);
                    // Reset to first page when searching
                    if (onPageChange) {
                        onPageChange(1, pagination.perPage);
                    }
                }
            } catch (error) {
                console.error('Error searching repositories:', error);
            } finally {
                setIsLoading(false);
            }
        } else {
            // If search is cleared, reset to initial repositories
            setFilteredRepos(repositories);
        }
    };

    // Debounced search
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        
        // Only trigger search if there's a query
        if (query.trim()) {
            debounceTimerRef.current = window.setTimeout(() => {
                handleSearch(query);
            }, 300);
        } else {
            // If query is empty, reset to initial repositories immediately
            setFilteredRepos(repositories);
        }
    };

    const sortedRepos = useMemo(() => {
        return [...filteredRepos].sort((a, b) => {
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
    }, [filteredRepos, sortBy]);


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
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-900/50 text-blue-300 border border-blue-700/50">
                    <span className="font-mono font-bold text-blue-200">{repositories.length}</span> {repositories.length === 1 ? 'Repository' : 'Repositories'}
                </span>
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
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search repositories..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const query = searchQuery.trim();
                                if (debounceTimerRef.current) {
                                    clearTimeout(debounceTimerRef.current);
                                    debounceTimerRef.current = null;
                                }
                                if (query) {
                                    handleSearch(query);
                                } else {
                                    setFilteredRepos(repositories);
                                }
                            }
                        }}
                        aria-label="Search repositories"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    {searchQuery && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setSearchQuery('');
                                setFilteredRepos(repositories);
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            aria-label="Clear search"
                            type="button"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            {/* Add loading spinner or skeleton here */}
                        </div>
                    ) : (
                        sortedRepos.map((repo) => <RepoItem key={repo.id} repo={repo} />)
                    )}
                </div>
            </div>
        </div>
    );
};

export default RepoList;