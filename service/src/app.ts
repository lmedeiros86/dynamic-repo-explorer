import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { json, urlencoded } from 'express';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import reposRouter from './routes/repos';

// Import environment configuration (this will validate and load .env)
import env from './config/env';

// Debug: Log environment variables (remove in production)
console.log('Environment:', process.env.NODE_ENV);
console.log('GitHub Token:', process.env.GITHUB_TOKEN ? '***' : 'Not found');

const app = express();

// ======================
// Security Middleware
// ======================

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later.' },
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// Security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (env.ALLOWED_ORIGINS.includes(origin) || env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Reject requests from other origins
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  credentials: true,
  maxAge: 600, // 10 minutes
  optionsSuccessStatus: 204,
}));

// Request parsing with size limit
app.use(json({ limit: '10kb' }));
app.use(urlencoded({ extended: true, limit: '10kb' }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// ======================
// ======================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Service is running',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version
    }
  });
});

// API Routes
app.use('/api/repos', reposRouter);
// ======================
// Error Handling
// ======================

// Handle 404 - Must be after all other routes
app.use(notFoundHandler);

// Global error handler - Must be the last middleware
app.use(errorHandler);

// ======================
// Create and export the server
// ======================
const server = app.listen(0); // 0 means use a random available port for testing

// ======================
// Export the app and server
// ======================

export { app, server };
