import { pool } from '../pool';
import type { UserRow, PublicUser } from '../types';

export async function createUser(email: string, passwordHash: string): Promise<PublicUser> {
  const { rows } = await pool.query<PublicUser>(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, passwordHash],
  );
  return rows[0];
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<PublicUser | null> {
  const { rows } = await pool.query<PublicUser>(
    'SELECT id, email, created_at FROM users WHERE id = $1',
    [id],
  );
  return rows[0] ?? null;
}
