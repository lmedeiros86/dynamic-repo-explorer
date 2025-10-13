import { Request, Response, NextFunction } from 'express';
import { AppError, InternalServerError } from '../errors/appError';
import env from '../config/env';

interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: string | Record<string, unknown>;
    stack?: string;
  };
  status: number;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Default to internal server error
  let error: AppError;

  // Handle known error types
  if (err instanceof AppError) {
    error = err;
  } else {
    // Handle unexpected errors
    error = new InternalServerError(err.message);
  }

  // Log the error (in production, you'd want to use a proper logger)
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Prepare error response
  const response: ErrorResponse = {
    success: false,
    error: {
      code: error.constructor.name.replace('Error', '').toUpperCase(),
      message: error.message,
      ...(error.details && { details: error.details }),
      // Only include stack trace in development
      ...(env.isDev && { stack: error.stack }),
    },
    status: error.statusCode,
  };

  // Send response
  res.status(error.statusCode).json(response);
};

// Handle 404 Not Found
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
    status: 404,
  });
};
