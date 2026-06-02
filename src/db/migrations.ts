import path from 'path';
import fs from 'fs/promises';
import { pool } from './pool';

const MIGRATIONS_FILE = path.join(__dirname, 'migrations', 'migrations.sql');

async function runMigrations(): Promise<void> {
  const sql = await fs.readFile(MIGRATIONS_FILE, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migrations applied.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
  }
  await pool.end();
}

void runMigrations();
