export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    watchers_count: number;
    forks_count: number;
    language:  string | null;
    updated_at: string;
    created_at: string;
    private: boolean;
    owner: {
        login: string;
        id: number;
        avatar_url: string;
        html_url: string;
    };
}

export interface RepoResponse {
    success: boolean;
    data?: {
        owner: string;
        repositories: GitHubRepo[];
        count: number;
    };
    error?: string;
}

export interface RepoStats {
    totalRepos: number;
    totalStars: number;
    totalForks: number;
    languages: string[];
}