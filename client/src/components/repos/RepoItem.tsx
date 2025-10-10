/**
 * RepoItem Component
 * 
 * Renders a single GitHub repository card with its details.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {GitHubRepo} props.repo - Repository data object containing repository details
 * @returns {JSX.Element} A card displaying repository information
 * 
 * Features:
 * - Displays repository name as a clickable link to the GitHub repository
 * - Shows repository description (or a default message if none exists)
 * - Displays key statistics: stars, forks, and watchers count
 * - Shows the primary programming language used in the repository
 * - Shows the last updated date in a localized format
 * - Responsive design with appropriate styling classes
 */
import React from 'react';
import { GitHubRepo } from '../../types/repo';

interface RepoItemProps {
    repo: GitHubRepo;
}

const RepoItem: React.FC<RepoItemProps> = ({ repo }) => {
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 transition-all hover:border-gray-600">
            <h3 className="mb-2">
                <a 
                    href={repo.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xl font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                >
                    {repo.name}
                </a>
            </h3>
            <p className="text-gray-300 mb-3 leading-relaxed">
                {repo.description || 'No description provided'}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded">
                    ⭐ {repo.stargazers_count.toLocaleString()}
                </span>
                <span className="bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded">
                    🍴 {repo.forks_count.toLocaleString()}
                </span>
                <span className="bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded">
                    👁️ {repo.watchers_count.toLocaleString()}
                </span>
                {repo.language && (
                    <span className="bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded">
                        {repo.language}
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
                Updated: {new Date(repo.updated_at).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                })}
            </p>
        </div>
    );
};

export default RepoItem;