export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Ensure the error stack is captured for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: Record<string, unknown>) {
    super(message, 400, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: Record<string, unknown>) {
    super(message, 401, true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: Record<string, unknown>) {
    super(message, 403, true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found', details?: Record<string, unknown>) {
    super(message, 404, true, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', details?: Record<string, unknown>) {
    super(message, 500, false, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too Many Requests', retryAfter?: string | number) {
    const headers: Record<string, string> = {};
    if (retryAfter) {
      headers['Retry-After'] = String(retryAfter);
    }
    
    super(message, 429, true, { retryAfter });
  }
}
