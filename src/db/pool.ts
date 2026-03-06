import { Pool } from 'pg';

// Exported as a singleton. Import this in query files, never create new Pool instances.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
