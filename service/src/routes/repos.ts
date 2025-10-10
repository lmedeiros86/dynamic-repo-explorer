/**
 * This router handles all API requests related to GitHub repositories.
 * It exposes two endpoints:
 *   - GET /api/repos/:owner: Fetches all public repositories for a specified GitHub user.
 *   - GET /api/repos/:owner/stats: Retrieves statistics about a specified GitHub user's repositories.
 */
import { Router } from 'express';
import { getReposByOwner, getRepoStats } from "@/controllers/reposController";

const router = Router();

// GET /api/repos/:owner - Fetch all public repositories for a user
// This endpoint takes an 'owner' parameter which is the GitHub username of the user whose repositories we want to fetch.
// It returns an array of GitHubRepo objects.
router.get('/:owner', getReposByOwner);

// GET /api/repos/:owner/stats - Get repository statistics
router.get('/:owner/stats', getRepoStats);

export default router;