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
            <h3 className="mb-2 flex items-center">
                <a 
                    href={repo.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xl font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center"
                >
                    {repo.name}
                    <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
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
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                    Updated: {new Date(repo.updated_at).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    })}
                </p>
                <a 
                    href={`https://github.com/${repo.owner.login}?tab=repositories`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    View All Repos →
                </a>
            </div>
        </div>
    );
};

export default RepoItem;