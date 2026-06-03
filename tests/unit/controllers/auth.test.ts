import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import * as db from '../../../src/db/queries/users';
import { registerUser, loginUser } from '../../../src/controllers/auth';
import { buildPublicUser } from '../../helpers/factories';

vi.mock('../../../src/db/queries/users');
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn(),
  },
}));
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-token'),
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

describe('loginUser', () => {
  const next = vi.fn() as unknown as NextFunction;

  beforeEach(() => vi.clearAllMocks());

  it('should return 200 with token when credentials are valid', async () => {
    const user = buildPublicUser({ email: 'user@example.com' });
    vi.mocked(db.findUserByEmail).mockResolvedValue({ ...user, password: 'hashed-password' });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const req = mockReq();
    const res = mockRes();
    await loginUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: { token: 'mock-token' } });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with 401 AppError when user is not found', async () => {
    vi.mocked(db.findUserByEmail).mockResolvedValue(null);

    await loginUser(mockReq(), mockRes(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, message: 'Invalid email or password' }),
    );
  });

  it('should call next with 401 AppError when password does not match', async () => {
    const user = buildPublicUser();
    vi.mocked(db.findUserByEmail).mockResolvedValue({ ...user, password: 'hashed-password' });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await loginUser(mockReq(), mockRes(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, message: 'Invalid email or password' }),
    );
  });

  it('should call next with error when db query fails', async () => {
    vi.mocked(db.findUserByEmail).mockRejectedValue(new Error('db error'));

    await loginUser(mockReq(), mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
