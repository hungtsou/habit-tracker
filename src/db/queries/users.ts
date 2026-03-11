import { pool } from '../pool';

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export async function createUser(
  email: string,
  name: string,
  hashedPassword: string,
): Promise<UserRow> {
  const result = await pool.query(
    'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING *',
    [email, name, hashedPassword],
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}
