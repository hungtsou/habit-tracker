import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../../../src/middleware/error';

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler', () => {
  const req = {} as Request;
  const next = jest.fn() as NextFunction;

  it('handles AppError with its own statusCode and message', () => {
    const res = mockRes();
    const err = new AppError('Not found', 404);
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found', statusCode: 404 });
  });

  it('falls back to 500 for unknown errors', () => {
    const res = mockRes();
    errorHandler(new Error('boom'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error', statusCode: 500 });
  });
});
