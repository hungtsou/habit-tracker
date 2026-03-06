import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../../src/middleware/validate';

const mockReq = (body: unknown) => ({ body }) as Request;
const mockRes = () => ({}) as Response;

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

describe('validate middleware', () => {
  const next = jest.fn() as unknown as NextFunction;

  beforeEach(() => jest.clearAllMocks());

  it('calls next() with no args when body is valid', () => {
    validate(schema)(mockReq({ email: 'a@b.com', password: '12345678' }), mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next with AppError 400 when body fails validation', () => {
    validate(schema)(mockReq({ email: 'not-an-email', password: '123' }), mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('passes the first Zod error message to AppError', () => {
    validate(schema)(mockReq({}), mockRes(), next);
    const error = (next as jest.Mock).mock.calls[0][0] as Error & { statusCode: number };
    expect(error.message).toBeTruthy();
    expect(error.statusCode).toBe(400);
  });
});
