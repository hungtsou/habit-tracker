import { pool } from './pool';

interface Migration {
  name: string;
  up: (client: typeof pool) => Promise<void>;
  down: (client: typeof pool) => Promise<void>;
}

const migrations: Migration[] = [];

async function loadMigrations(): Promise<void> {
  const mod = await import('./migrations/001_create_users');
  migrations.push({ name: '001_create_users', ...mod });
}

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function getAppliedMigrations(): Promise<string[]> {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map((row: { name: string }) => row.name);
}

async function migrate(): Promise<void> {
  try {
    await loadMigrations();
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();

    for (const migration of migrations) {
      if (applied.includes(migration.name)) {
        console.log(`[migrate] Skipping ${migration.name} (already applied)`);
        continue;
      }
      console.log(`[migrate] Applying ${migration.name}...`);
      await migration.up(pool);
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
      console.log(`[migrate] Applied ${migration.name}`);
    }

    console.log('[migrate] All migrations applied');
  } catch (err) {
    console.error('[migrate] Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
