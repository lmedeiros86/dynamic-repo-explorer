/**
 * This router handles all API requests related to GitHub repositories.
 * It exposes the following endpoints:
 *   - GET /api/repos/initial: Fetches the most recently updated public repositories from GitHub
 *   - GET /api/repos/:owner: Fetches all public repositories for a specified GitHub user
 *   - GET /api/repos/:owner/stats: Retrieves statistics about a specified GitHub user's repositories
 */
import { Router } from 'express';
import { z } from 'zod';
import { getInitialRepos, getReposByOwner, getRepoStats } from "@/controllers/reposController";
import { validateRequest } from '@/utils/validation';

const router = Router();

// Common validation schemas
const paginationSchema = z.object({
  query: z.object({
    page: z.preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().int().positive().default(1)
    ),
    limit: z.preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().int().positive().max(100).default(10)
    ),
  })
});

const usernameSchema = z.object({
  params: z.object({
    owner: z.string()
      .min(1, 'Owner username is required')
      .max(39, 'Username cannot exceed 39 characters')
      .regex(
        /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i,
        'Invalid GitHub username format'
      )
  })
});

const repoQuerySchema = z.object({
  query: z.object({
    type: z.enum(['all', 'owner', 'member']).optional(),
    sort: z.enum(['created', 'updated', 'pushed', 'full_name']).optional(),
    direction: z.enum(['asc', 'desc']).optional(),
    per_page: z.preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().int().positive().max(100).default(30)
    ).optional(),
    page: z.preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().int().positive().default(1)
    ).optional()
  })
});

// GET /api/repos/initial - Fetch initial set of public repositories
// This endpoint returns the most recently updated public repositories from GitHub
// It's limited to 20 repositories for performance and rate limiting considerations.
router.get(
  '/initial',
  validateRequest(paginationSchema),
  getInitialRepos
);

// GET /api/repos/:owner - Fetch all public repositories for a user
// This endpoint takes an 'owner' parameter which is the GitHub username of the user whose repositories we want to fetch.
// It returns an array of GitHubRepo objects.
// Combined schema for owner repositories route
const ownerReposSchema = z.object({
  params: z.object({
    owner: z.string().min(1, 'Owner username is required')
  }),
  query: repoQuerySchema.shape.query.optional()
});

router.get(
  '/:owner',
  validateRequest(ownerReposSchema),
  getReposByOwner
);

// GET /api/repos/:owner/stats - Get repository statistics for a user
// This endpoint provides aggregated statistics for all repositories owned by the specified GitHub user.
// It includes total count, stars, forks, and a list of unique programming languages used across repositories.
router.get(
  '/:owner/stats',
  validateRequest(usernameSchema),
  getRepoStats
);

export default router;