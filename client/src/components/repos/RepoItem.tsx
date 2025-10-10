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
        <div className="repo-card">
            <h3>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                    {repo.name}
                </a>
            </h3>
            <p className="repo-description">
                {repo.description || 'No description provided'}
            </p>
            <div className="repo-stats">
                <span className="stat">
                    {repo.stargazers_count}
                </span>
                <span className="stat">
                    {repo.forks_count}
                </span>
                <span className="stat">
                    {repo.watchers_count}
                </span>
                <span className="stat">
                    {repo.language || 'No language'}
                </span>
            </div>
            <p className="repo-updated">
                Updated: {new Date(repo.updated_at).toLocaleDateString()}
            </p>
        </div>
    );
};

export default RepoItem;