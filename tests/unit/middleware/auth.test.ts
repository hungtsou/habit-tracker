import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../src/config/env';
import { authenticate } from '../../../src/middleware/auth';

const mockReq = (authHeader?: string) =>
  ({ headers: { authorization: authHeader } }) as Request;

const mockRes = () => ({}) as Response;

describe('authenticate middleware', () => {
  const next = jest.fn() as unknown as NextFunction;

  beforeEach(() => jest.clearAllMocks());

  it('calls next with AppError 401 if no Authorization header', () => {
    authenticate(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with AppError 401 if header does not start with Bearer', () => {
    authenticate(mockReq('Token abc123'), mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('attaches decoded payload to req.user and calls next() on valid token', () => {
    const token = jwt.sign({ userId: 'user-1' }, env.JWT_SECRET);
    const req = mockReq(`Bearer ${token}`);
    authenticate(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual(expect.objectContaining({ userId: 'user-1' }));
  });

  it('calls next with AppError 401 if token is invalid', () => {
    authenticate(mockReq('Bearer bad.token.here'), mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
