import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/db/pool';

beforeEach(async () => {
  await pool.query('DELETE FROM users');
});

describe('POST /api/auth/register', () => {
  const validBody = { email: 'user@example.com', password: 'password123' };

  it('should return 201 with user data on successful registration', async () => {
    const res = await request(app).post('/api/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      email: 'user@example.com',
    });
    expect(res.body.data).not.toHaveProperty('password');
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('created_at');
  });

  it('should lowercase and trim the email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: '  USER@Example.COM  ', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('user@example.com');
  });

  it('should return 409 when email already exists', async () => {
    await request(app).post('/api/auth/register').send(validBody);
    const res = await request(app).post('/api/auth/register').send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already in use');
  });

  it('should return 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@example.com', password: 'short' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).toBe(400);
  });
});
