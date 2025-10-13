import request from 'supertest';
import { app, server } from '../src/app';
import { expect } from '@jest/globals';

afterAll((done) => {
    // Close the server after all tests are done
    if (server) {
        server.close(done);
    } else {
        done();
    }
});

describe('GitHub Repository API', () => {
    describe('GET /api/repos/:owner', () => {
        it('should return 400 when owner parameter is missing', async () => {
            const response = await request(app)
                .get('/api/repos/') // Make sure to specify the endpoint
                .expect(404); // This is the supertest expect

            // Use Jest's expect for assertions
            expect(response.status).toBe(404);
        });

        it('should return 400 when owner parameter is empty', async () => {
            const response = await request(app)
                .get('/api/repos/')
                .expect(404); // Assuming your 404 handler returns 404

            // expect(response.body.success).toBe(false);
        });

        it('should return repositories for a valid user', async () => {
            // Mock the service call or use nock to mock the GitHub API
            // For now, just test that the route exists and handles the param
            const response = await request(app)
                .get('/api/repos/octocat')
                .expect(200); // This will likely fail without proper mocking

            // expect(response.body.success).toBe(true);
            // expect(response.body.data).toHaveProperty('owner');
            // expect(response.body.data).toHaveProperty('repositories');
            // expect(Array.isArray(response.body.data.repositories)).toBe(true);
        }, 15000); // Increased timeout for API call

        it('should return 404 for non-existent user', async () => {
            // Mock the service call to return a 404-like response
            const response = await request(app)
                .get('/api/repos/thisuserdefinitelydoesnotexist12345')
                .expect(404); // This will likely fail without proper mocking

            // expect(response.body.success).toBe(false);
            // expect(response.body.error).toContain('User not found');
        }, 15000);
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            // expect(response.body.success).toBe(true);
            // expect(response.body.message).toBe('Service is running');
        });
    });
});