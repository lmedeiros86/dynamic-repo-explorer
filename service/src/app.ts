import express from 'express';
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();

export { app };

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Service is running' });
});

// Repos routes
app.get('/api/repos/:owner', (req: Request, res: Response) => {
  const { owner } = req.params;
  
  if (!owner) {
    return res.status(400).json({ success: false, error: 'Owner parameter is required' });
  }
  
  // Mock response - in a real app, this would query GitHub's API
  if (owner === 'octocat') {
    return res.status(200).json({
      success: true,
      data: {
        owner: 'octocat',
        repositories: []
      }
    });
  }
  
  return res.status(404).json({ success: false, error: 'User not found' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});
