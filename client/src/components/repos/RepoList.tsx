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
import React from 'react';
import { GitHubRepo } from '../../types/repo';
import RepoItem from './RepoItem';

interface RepoListProps {
    repositories: GitHubRepo[];
    owner: string;
}

const RepoList: React.FC<RepoListProps> = ({ repositories, owner }) => {
    if (repositories.length === 0) {
        return (
            <div className="text-center p-10 text-gray-400">
                <p>No repositories found for {owner}</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto py-4">
            <h2 className="text-2xl font-semibold mb-6 text-white">
                Repositories for {owner} 
                <span className="text-gray-400 ml-2">({repositories.length})</span>
            </h2>
            <div className="space-y-4">
                {repositories.map((repo) => (
                    <RepoItem key={repo.id} repo={repo} />
                ))}
            </div>
        </div>
    );
};

export default RepoList;