import githubService from './services/githubService';

describe('GitHubService', () => {
  describe('getUserProfile', () => {
    it('should fetch user profile for an existing user', async () => {
      // Test with a known GitHub username
      const username = 'github';
      const user = await githubService.getUserProfile(username);
      
      expect(user).toBeDefined();
      expect(user.login).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.avatar_url).toBeDefined();
    });

    it('should throw an error for a non-existing user', async () => {
      const nonExistingUser = 'thisusernamedoesnotexist123456789';
      await expect(githubService.getUserProfile(nonExistingUser))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('getUserRepos', () => {
    it('should fetch repositories for an existing user', async () => {
      const username = 'github';
      const repos = await githubService.getUserRepos(username);
      
      expect(Array.isArray(repos)).toBe(true);
      if (repos.length > 0) {
        const repo = repos[0];
        expect(repo.id).toBeDefined();
        expect(repo.name).toBeDefined();
        expect(repo.full_name).toContain('/');
      }
    });

    it('should throw an error for a non-existing user', async () => {
      const nonExistingUser = 'thisusernamedoesnotexist123456789';
      await expect(githubService.getUserRepos(nonExistingUser))
        .rejects
        .toThrow('User not found');
    });
  });
});
