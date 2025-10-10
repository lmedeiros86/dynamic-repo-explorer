/**
 * Main application component for GitHub Repository Explorer.
 * Renders the application header and the AuthorRepos component
 * which displays repository information for a GitHub user.
 */

import React from 'react';
import AuthorRepos from './components/repos/AuthorRepos';
import './App.css';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>GitHub Repository Explorer</h1>
                <AuthorRepos />
            </header>
        </div>
    );
}

export default App;