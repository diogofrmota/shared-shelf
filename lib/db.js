import { sql } from '@vercel/postgres';

export const initializeDatabase = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_data (
        user_id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_data_updated_at ON user_data(updated_at)`;
    return true;
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    return false;
  }
};

export const getUserData = async (userId) => {
  const { rows } = await sql`
    SELECT data, updated_at FROM user_data WHERE user_id = ${userId}
  `;
  if (rows.length === 0) return null;
  return { data: rows[0].data, updatedAt: rows[0].updated_at };
};

export const saveUserData = async (userId, data) => {
  const result = await sql`
    INSERT INTO user_data (user_id, data, updated_at)
    VALUES (${userId}, ${JSON.stringify(data)}, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    RETURNING updated_at
  `;
  return { success: true, updatedAt: result.rows[0]?.updated_at };
};

export const deleteUserData = async (userId) => {
  await sql`DELETE FROM user_data WHERE user_id = ${userId}`;
  return true;
};

export const cleanupOldData = async (daysOld = 365) => {
  const { rowCount } = await sql`
    DELETE FROM user_data WHERE updated_at < NOW() - INTERVAL '1 day' * ${daysOld}
  `;
  return rowCount;
};

export const checkConnection = async () => {
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

export { sql };
