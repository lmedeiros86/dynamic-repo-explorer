import request from 'supertest';
import { app } from '../src/app';

describe('GitHub Repository API', () => {
    describe('GET /api/repos/:owner', () => {
        it('should return 404 when owner parameter is missing', async () => {
            await request(app)
                .get('/api/repos')
                .expect(404);
        });

        it('should return 404 when owner parameter is empty', async () => {
            await request(app)
                .get('/api/repos/')
                .expect(404);
        });

        it('should return 200 and mock data for valid owner', async () => {
            const response = await request(app)
                .get('/api/repos/octocat')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.owner).toBe('octocat');
            expect(Array.isArray(response.body.data.repositories)).toBe(true);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .get('/api/repos/thisuserdefinitelydoesnotexist12345')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('User not found');
        }, 15000);
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Service is running');
        });
    });
});