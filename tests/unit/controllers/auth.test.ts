import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import * as db from '../../../src/db/queries/users';
import { registerUser } from '../../../src/controllers/auth';
import { AppError } from '../../../src/middleware/error';
import { buildPublicUser } from '../../helpers/factories';

vi.mock('../../../src/db/queries/users');
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
  },
}));

const mockReq = (overrides = {}) =>
  ({ body: { email: 'user@example.com', password: 'password123' }, ...overrides }) as Request;

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('registerUser', () => {
  const next = vi.fn() as unknown as NextFunction;

  beforeEach(() => vi.clearAllMocks());

  it('should return 201 with user data when registration succeeds', async () => {
    const user = buildPublicUser({ email: 'user@example.com' });
    vi.mocked(db.findUserByEmail).mockResolvedValue(null);
    vi.mocked(db.createUser).mockResolvedValue(user);

    const req = mockReq();
    const res = mockRes();
    await registerUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ data: user });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with 409 AppError when email already exists', async () => {
    const existing = buildPublicUser();
    vi.mocked(db.findUserByEmail).mockResolvedValue({
      ...existing,
      password: 'hashed',
    });

    await registerUser(mockReq(), mockRes(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, message: 'Email already in use' }),
    );
  });

  it('should call next with error when db query fails', async () => {
    vi.mocked(db.findUserByEmail).mockRejectedValue(new Error('db error'));

    await registerUser(mockReq(), mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
