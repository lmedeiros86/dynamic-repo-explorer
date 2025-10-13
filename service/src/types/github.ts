// GitHub API Headers
export interface GitHubHeaders {
    'x-ratelimit-limit'?: string;
    'x-ratelimit-remaining'?: string;
    'x-ratelimit-reset'?: string;
    'x-ratelimit-used'?: string;
    'x-ratelimit-resource'?: string;
    'retry-after'?: string;
    'x-github-request-id'?: string;
    'x-github-token-expired'?: string;
    'x-oauth-scopes'?: string;
    'link'?: string;
    [key: string]: string | undefined;
}

// Core GitHub API Types
export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
    fork: boolean;
    url: string;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    git_url: string;
    ssh_url: string;
    clone_url: string;
    stargazers_count: number;
    watchers_count: number;
    forks_count: number;
    language: string | null;
    default_branch: string;
    owner: GitHubUserBasic;
    license?: {
        key: string;
        name: string;
        spdx_id: string;
        url: string | null;
        node_id: string;
    } | null;
    size: number;
    archived: boolean;
    disabled: boolean;
    open_issues_count: number;
    topics?: string[];
    visibility?: 'public' | 'private' | 'internal';
    permissions?: {
        admin: boolean;
        push: boolean;
        pull: boolean;
    };
}

export interface GitHubUserBasic {
    login: string;
    id: number;
    avatar_url: string;
    url: string;
    html_url: string;
    type?: 'User' | 'Organization';
    site_admin?: boolean;
}

export interface GitHubUser extends GitHubUserBasic {
    name: string | null;
    company: string | null;
    blog: string | null;
    location: string | null;
    email: string | null;
    bio: string | null;
    twitter_username: string | null;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
    hireable?: boolean;
    node_id?: string;
    gravatar_id?: string | null;
    organizations_url?: string;
    repos_url?: string;
    events_url?: string;
    received_events_url?: string;
    site_admin?: boolean;
}

// Rate Limit Types
export interface GitHubRateLimit {
    limit: number;
    remaining: number;
    reset: number; // Unix timestamp in seconds
    used: number;
}

// Error Handling Types
export interface GitHubError {
    code: string;
    message: string;
    status: number;
    details?: any;
    documentation_url?: string;
    retryAfter?: string | number;
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    status?: number;
    data?: T;
    error?: string | GitHubError;
    meta?: {
        total?: number;
        page?: number;
        per_page?: number;
        total_pages?: number;
    };
}

// Request Parameter Types
export interface RepoListParams {
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
}

// Webhook and Event Types
export interface GitHubEvent {
    id: string;
    type: string;
    actor: GitHubUserBasic;
    repo: {
        id: number;
        name: string;
        url: string;
    };
    payload: Record<string, any>;
    public: boolean;
    created_at: string;
}

// Repository Statistics
export interface RepoStats {
    owner: string;
    repo: string;
    totalCommits: number;
    totalBranches: number;
    totalTags: number;
    totalContributors: number;
    totalForks: number;
    totalWatchers: number;
    languages: Record<string, number>;
    lastUpdated: string;
    repoList: Array<{
        name: string;
        stars: number;
        forks: number;
        watchers: number;
        language: string;
        url: string;
    }>;
}

// Search Results
export interface SearchResults<T> {
    total_count: number;
    incomplete_results: boolean;
    items: T[];
}
