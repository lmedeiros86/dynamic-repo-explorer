/**
 * Main application component for GitHub Repository Explorer.
 * Renders the application header and the AuthorRepos component
 * which displays repository information for a GitHub user.
 */

import React from 'react';
import AuthorRepos from './components/repos/AuthorRepos';

function App() {
    return (<div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 py-6 shadow-lg">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold">GitHub Repository Explorer</h1>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                <AuthorRepos />
            </main>
        </div>
    );
}

export default App;