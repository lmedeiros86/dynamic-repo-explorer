/**
 * Main Express Application Configuration
 * 
 * This file sets up the core Express server with:
 * - Middleware (CORS, JSON parsing, URL encoding)
 * - API routes (mounted under /api/repos)
 * - Health check endpoint (/health)
 * - Global error handling (404 and 500 errors)
 * 
 * The application serves as the backend service for the GitHub repository explorer,
 * providing endpoints to fetch repository data and statistics.
 */
import express, { Application, Request, Response } from "express";
import cors from 'cors';
import reposRouter from './routes/repos';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/repos', reposRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Service is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Global error handler
app.use((err: any, req: Request, res: Response) => {
    console.error('Global error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

export default app;