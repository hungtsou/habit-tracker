import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Express recognizes 4-arg middleware as error handlers. All 4 params are required.
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }
  sendError(res, 'Internal server error', 500);
};
