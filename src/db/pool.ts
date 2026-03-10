import { Pool } from 'pg';
import { env } from '../config/env';

// Exported as a singleton. Import this in query files, never create new Pool instances.
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
