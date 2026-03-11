import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE users (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email      VARCHAR(255) UNIQUE NOT NULL,
      name       VARCHAR(100) NOT NULL,
      password   VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `);
  await pool.query('CREATE UNIQUE INDEX idx_users_email ON users (email)');
}

export async function down(pool: Pool): Promise<void> {
  await pool.query('DROP TABLE IF EXISTS users');
}
