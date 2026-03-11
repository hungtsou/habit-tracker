import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/db/pool';

describe('Auth endpoints', () => {
  beforeEach(async () => {
    await pool.query('DELETE FROM users');
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users');
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 with user data and token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        email: 'new@example.com',
        name: 'New User',
      });
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.token).toBeDefined();
    });

    it('returns 400 for invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        name: 'Test',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 for short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'user@example.com',
        name: 'Test',
        password: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 409 when email is already registered', async () => {
      await request(app).post('/api/auth/register').send({
        email: 'dup@example.com',
        name: 'First',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'dup@example.com',
        name: 'Second',
        password: 'password456',
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        email: 'login@example.com',
        name: 'Login User',
        password: 'password123',
      });
    });

    it('returns 200 with user data and token for valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        email: 'login@example.com',
        name: 'Login User',
      });
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.token).toBeDefined();
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'wrong-password',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('returns 401 for non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('returns 400 for missing password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });
});
