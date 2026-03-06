import { Response } from 'express';
import { ApiSuccess, ApiError } from '../types';

export const sendSuccess = <T>(res: Response, data: T, status = 200): void => {
  res.status(status).json({ data } satisfies ApiSuccess<T>);
};

export const sendError = (res: Response, error: string, statusCode: number): void => {
  res.status(statusCode).json({ error, statusCode } satisfies ApiError);
};
