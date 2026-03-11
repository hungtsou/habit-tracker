import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { register, login } from '../../../src/controllers/auth';
import * as userQueries from '../../../src/db/queries/users';

jest.mock('../../../src/db/queries/users');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockReq = (body: Record<string, unknown> = {}) => ({ body }) as Request;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('auth controller', () => {
  const next = jest.fn() as unknown as NextFunction;

  beforeEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('creates a user and returns 201 with token', async () => {
      (userQueries.findUserByEmail as jest.Mock).mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      (userQueries.createUser as jest.Mock).mockResolvedValue({
        id: 'uuid-1',
        email: 'new@example.com',
        name: 'New User',
      });
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const req = mockReq({ email: 'new@example.com', name: 'New User', password: 'password123' });
      const res = mockRes();

      await register(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userQueries.createUser).toHaveBeenCalledWith('new@example.com', 'New User', 'hashed-pw');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: { id: 'uuid-1', email: 'new@example.com', name: 'New User', token: 'mock-token' },
      });
    });

    it('calls next with 409 AppError if email already exists', async () => {
      (userQueries.findUserByEmail as jest.Mock).mockResolvedValue({ id: 'existing' });

      const req = mockReq({ email: 'taken@example.com', name: 'User', password: 'password123' });
      const res = mockRes();

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 409, message: 'Email already registered' }),
      );
    });

    it('calls next with error on unexpected failure', async () => {
      const err = new Error('db down');
      (userQueries.findUserByEmail as jest.Mock).mockRejectedValue(err);

      const req = mockReq({ email: 'a@b.com', name: 'Test', password: 'password123' });
      const res = mockRes();

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('login', () => {
    it('returns 200 with token for valid credentials', async () => {
      (userQueries.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'uuid-1',
        email: 'user@example.com',
        name: 'User',
        password: 'hashed-pw',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const req = mockReq({ email: 'user@example.com', password: 'password123' });
      const res = mockRes();

      await login(req, res, next);

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-pw');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { id: 'uuid-1', email: 'user@example.com', name: 'User', token: 'mock-token' },
      });
    });

    it('calls next with 401 AppError if user not found', async () => {
      (userQueries.findUserByEmail as jest.Mock).mockResolvedValue(undefined);

      const req = mockReq({ email: 'nobody@example.com', password: 'password123' });
      const res = mockRes();

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, message: 'Invalid email or password' }),
      );
    });

    it('calls next with 401 AppError if password does not match', async () => {
      (userQueries.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'uuid-1',
        email: 'user@example.com',
        name: 'User',
        password: 'hashed-pw',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const req = mockReq({ email: 'user@example.com', password: 'wrong' });
      const res = mockRes();

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, message: 'Invalid email or password' }),
      );
    });

    it('calls next with error on unexpected failure', async () => {
      const err = new Error('db down');
      (userQueries.findUserByEmail as jest.Mock).mockRejectedValue(err);

      const req = mockReq({ email: 'a@b.com', password: 'password123' });
      const res = mockRes();

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
