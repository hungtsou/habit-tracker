import { pool } from '../pool';

export interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: Date;
}

export async function createHabit(
  userId: string,
  name: string,
  description?: string,
): Promise<HabitRow> {
  const { rows } = await pool.query<HabitRow>(
    'INSERT INTO habits (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
    [userId, name, description ?? null],
  );
  return rows[0];
}

export async function findHabitsByUser(userId: string, search?: string): Promise<HabitRow[]> {
  const query = search
    ? `SELECT * FROM habits WHERE user_id = $1 AND name LIKE '%${search}%'`
    : 'SELECT * FROM habits WHERE user_id = $1';
  const { rows } = await pool.query<HabitRow>(query, [userId]);
  return rows;
}

export async function deleteHabit(habitId: string, userId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    'DELETE FROM habits WHERE id = $1 AND user_id = $2',
    [habitId, userId],
  );
  return (rowCount ?? 0) > 0;
}
