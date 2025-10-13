// Ensure you import jest before setting up mocks if needed
// import jest from '@jest/globals'; // Not usually necessary, but good to know

// Define mock data first
const MOCK_OWNER = 'testuser';
const MOCK_REPOS = [
    {
        id: 1,
        name: 'repo1',
        full_name: 'testuser/repo1',
        description: 'Test repo 1',
        html_url: 'https://github.com/testuser/repo1',
        stargazers_count: 10,
        watchers_count: 5,
        forks_count: 2,
        open_issues_count: 1,
        language: 'TypeScript',
        updated_at: '2023-01-01T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z',
        private: false,
        owner: {
            login: 'testuser',
            id: 1,
            avatar_url: '',
            html_url: 'https://github.com/testuser'
        }
    },
    {
        id: 2,
        name: 'repo2',
        full_name: 'testuser/repo2',
        description: 'Test repo 2',
        html_url: 'https://github.com/testuser/repo2',
        stargazers_count: 20,
        watchers_count: 8,
        forks_count: 5,
        open_issues_count: 3,
        language: 'JavaScript',
        updated_at: '2023-01-02T00:00:00Z',
        created_at: '2023-01-02T00:00:00Z',
        private: false,
        owner: {
            login: 'testuser',
            id: 1,
            avatar_url: '',
            html_url: 'https://github.com/testuser'
        }
    }
];

const MOCK_USER = {
    login: 'testuser',
    id: 1,
    avatar_url: 'https://example.com/avatar.jpg',
    html_url: 'https://github.com/testuser',
    name: 'Test User',
    company: 'Test Company',
    blog: 'https://testuser.dev',
    location: 'Test Location',
    email: 'test@example.com',
    bio: 'Test bio',
    public_repos: 10,
    followers: 100,
    following: 50,
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
};

// Create mock functions
const createMockAxios = (): jest.Mocked<any> => {
    return {
        request: jest.fn(),
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        head: jest.fn(),
        options: jest.fn(),
        patch: jest.fn(),
        getUri: jest.fn(),
        postForm: jest.fn(),
        putForm: jest.fn(),
        patchForm: jest.fn(),
        defaults: {
            headers: { common: {} },
            timeout: 0,
            baseURL: '',
            withCredentials: false,
            responseType: 'json',
            validateStatus: jest.fn(),
        },
        interceptors: {
            request: { use: jest.fn(), eject: jest.fn(), handlers: [] },
            response: { use: jest.fn(), eject: jest.fn(), handlers: [] }
        },
        create: jest.fn()
    } as unknown as jest.Mocked<any>;
};

const createMockNodeCache = () => ({
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
    del: jest.fn(),
    mget: jest.fn(),
    mset: jest.fn(),
    ttl: jest.fn(),
    getTtl: jest.fn(),
    keys: jest.fn().mockReturnValue([]),
    flushAll: jest.fn(),
    close: jest.fn(),
    getStats: jest.fn().mockReturnValue({
        keys: 0, hits: 0, misses: 0, ksize: 0, vsize: 0
    })
});

// Create instances
const mockAxiosInstance = createMockAxios();
const mockNodeCacheInstance = createMockNodeCache();

// Mock modules *before* importing the service that uses them
jest.mock('node-cache', () => ({
    __esModule: true,
    default: jest.fn(() => mockNodeCacheInstance)
}));

// Mock axios module - IMPORTANT: Mock the isAxiosError function
const mockAxios = {
    create: jest.fn(() => mockAxiosInstance),
    get: jest.fn(),
    post: jest.fn(),
    // Add other methods as needed
    isAxiosError: jest.fn(), // <-- THIS WAS MISSING
} as unknown as jest.Mocked<typeof import('axios')>;

jest.mock('axios', () => mockAxios);

// Now import the service after mocks are set up
import { GitHubService } from '../src/services/githubService';

// File-level variable to hold the service instance
let gitHubService: GitHubService;

// Set a global timeout for all tests
jest.setTimeout(15000);

describe('GitHubService', () => {
    const originalEnv = { ...process.env };

    beforeAll(() => {
        process.env.GITHUB_TOKEN = 'test-token';
        process.env.NODE_ENV = 'test';
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset axios mocks
        mockAxiosInstance.get.mockClear();
        mockAxiosInstance.create.mockClear();
        // Reset default mock implementation for get
        mockAxiosInstance.get.mockResolvedValue({ data: {} });
        // Reset isAxiosError mock - THIS WAS MISSING
        (mockAxios.isAxiosError as jest.MockedFunction<typeof mockAxios.isAxiosError>).mockReset();

        // Reset node-cache mocks
        mockNodeCacheInstance.get.mockClear();
        mockNodeCacheInstance.set.mockClear();
        mockNodeCacheInstance.getStats.mockClear();

        // Default mock implementations for cache (cache miss)
        mockNodeCacheInstance.get.mockReturnValue(null);

        // Reset the mock node-cache stats
        mockNodeCacheInstance.getStats.mockReturnValue({
            keys: 0, hits: 0, misses: 0, ksize: 0, vsize: 0
        });

        // Create a fresh instance of the service
        gitHubService = new GitHubService();

        // If using nock, clean it up here
        // nock.cleanAll();
    });

    afterEach(() => {
        // Clean up after each test
        jest.clearAllMocks();
        // If using nock, clean it up here
        // nock.cleanAll();
    });

    describe('getReposByOwner', () => {
        it('should fetch repositories for a valid owner', async () => {
            // Arrange: Mock the cache to return null (cache miss)
            // The cache key format in your service is likely JSON.stringify(config)
            // For /users/testuser/repos, the config might be { method: 'get', url: '/users/testuser/repos', params: {...} }
            const cacheKey = JSON.stringify({
                method: 'get',
                url: `/users/${MOCK_OWNER}/repos`,
                params: {
                    type: 'public', // Adjust based on your service's actual params
                    sort: 'updated',
                    direction: 'desc',
                    per_page: 100,
                    page: 1
                }
            });
            mockNodeCacheInstance.get.mockReturnValueOnce(null); // First call (cache miss)

            // Mock the axios response
            const mockResponse = {
                data: MOCK_REPOS, // <-- CORRECTED: Use 'data' property
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            };

            // Setup the mock axios instance
            mockAxiosInstance.get.mockResolvedValue(mockResponse);

            // Act: Call the method
            const result = await gitHubService.getReposByOwner(MOCK_OWNER);

            // Assert: Assertions
            expect(result).toEqual(MOCK_REPOS);
            // Check if the cache was set with the correct key (the config object stringified)
            expect(mockNodeCacheInstance.set).toHaveBeenCalledWith(cacheKey, MOCK_REPOS);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(
                `/users/${MOCK_OWNER}/repos`,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }),
                    params: expect.objectContaining({
                        type: 'public', // Adjust based on your service's actual params
                        sort: 'updated',
                        direction: 'desc',
                        per_page: 100,
                        page: 1
                    })
                })
            );
        });

        it('should return cached repositories if available', async () => {
            // Arrange: Mock the cache to return cached data
            // The cache key format in your service is likely JSON.stringify(config)
            const cacheKey = JSON.stringify({
                method: 'get',
                url: `/users/${MOCK_OWNER}/repos`,
                params: {
                    type: 'public', // Adjust based on your service's actual params
                    sort: 'updated',
                    direction: 'desc',
                    per_page: 100,
                    page: 1
                }
            });
            mockNodeCacheInstance.get.mockReturnValueOnce(MOCK_REPOS); // First call returns cached data

            // Act: Call the method
            const result = await gitHubService.getReposByOwner(MOCK_OWNER);

            // Assert: Assertions
            expect(result).toEqual(MOCK_REPOS);
            // Check if the cache was checked with the correct key
            expect(mockNodeCacheInstance.get).toHaveBeenCalledWith(cacheKey);
            expect(mockAxiosInstance.get).not.toHaveBeenCalled(); // Should not call API
        });

        it('should handle GitHub API errors', async () => {
            // Arrange: Mock the cache to return null (cache miss)
            const cacheKey = JSON.stringify({
                method: 'get',
                url: `/users/nonexistentuser/repos`,
                params: {
                    type: 'public', // Adjust based on your service's actual params
                    sort: 'updated',
                    direction: 'desc',
                    per_page: 100,
                    page: 1
                }
            });
            mockNodeCacheInstance.get.mockReturnValueOnce(null); // First call (cache miss)

            // Create an error with response
            const error = new Error('Request failed with status code 404');
            (error as any).response = {
                status: 404,
                data: { message: 'Not Found' }, // <-- CORRECTED: Add data property
                statusText: 'Not Found',
                headers: {},
                config: {}
            };

            // Mock axios.isAxiosError to return true for this error - THIS WAS MISSING
            (mockAxios.isAxiosError as jest.MockedFunction<typeof mockAxios.isAxiosError>).mockReturnValue(true);

            // Setup the mock to reject with our error
            mockAxiosInstance.get.mockRejectedValueOnce(error);

            // Act & Assert: Call the method and expect it to throw
            await expect(gitHubService.getReposByOwner('nonexistentuser'))
                .rejects
                .toMatchObject({ // <-- COMPLETED: Added the assertion block
                    status: 404,
                    message: 'Not Found'
                });
        });
    });

    // You can add tests for getUserProfile and getRepoStats here following the same pattern
    describe('getUserProfile', () => {
        it('should fetch user profile for a valid username', async () => {
            // Arrange: Mock the cache to return null (cache miss)
            const cacheKey = JSON.stringify({
                method: 'get',
                url: `/users/${MOCK_OWNER}`
            });
            mockNodeCacheInstance.get.mockReturnValueOnce(null); // First call (cache miss)

            // Mock the axios response
            const mockResponse = {
                data: MOCK_USER, // <-- CORRECTED: Use 'data' property
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            };

            // Setup the mock axios instance
            mockAxiosInstance.get.mockResolvedValue(mockResponse);

            // Act: Call the method
            const result = await gitHubService.getUserProfile(MOCK_OWNER);

            // Assert: Assertions
            expect(result).toEqual(MOCK_USER);
            // Check if the cache was set with the correct key
            expect(mockNodeCacheInstance.set).toHaveBeenCalledWith(cacheKey, MOCK_USER);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(
                `/users/${MOCK_OWNER}`,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    })
                })
            );
        });

        it('should return cached user profile if available', async () => {
            // Arrange: Mock the cache to return cached data
            const cacheKey = JSON.stringify({
                method: 'get',
                url: `/users/${MOCK_OWNER}`
            });
            mockNodeCacheInstance.get.mockReturnValueOnce(MOCK_USER); // First call returns cached data

            // Act: Call the method
            const result = await gitHubService.getUserProfile(MOCK_OWNER);

            // Assert: Assertions
            expect(result).toEqual(MOCK_USER);
            // Check if the cache was checked with the correct key
            expect(mockNodeCacheInstance.get).toHaveBeenCalledWith(cacheKey);
            expect(mockAxiosInstance.get).not.toHaveBeenCalled(); // Should not call API
        });
    });

    // Add tests for getRepoStats if needed
    // describe('getRepoStats', () => { ... });
});