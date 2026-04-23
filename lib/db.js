import { sql } from '@vercel/postgres';

export const initializeDatabase = async () => {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        display_name TEXT NOT NULL,
        google_id TEXT UNIQUE,
        apple_id TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Shelves table
    await sql`
      CREATE TABLE IF NOT EXISTS shelves (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Shelf members
    await sql`
      CREATE TABLE IF NOT EXISTS shelf_members (
        shelf_id TEXT REFERENCES shelves(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (shelf_id, user_id)
      )
    `;

    // Join codes
    await sql`
      CREATE TABLE IF NOT EXISTS shelf_join_codes (
        id SERIAL PRIMARY KEY,
        shelf_id TEXT REFERENCES shelves(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        is_used BOOLEAN DEFAULT false,
        expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Shelf data
    await sql`
      CREATE TABLE IF NOT EXISTS shelf_data (
        shelf_id TEXT PRIMARY KEY REFERENCES shelves(id) ON DELETE CASCADE,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Password reset tokens (one active token per user)
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shelf_members_user ON shelf_members(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shelf_join_codes_code ON shelf_join_codes(code)`;

    // Old user_data table (keep for backward compatibility if needed)
    await sql`
      CREATE TABLE IF NOT EXISTS user_data (
        user_id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    return true;
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    return false;
  }
};

// Keep existing functions for compatibility
export const getUserData = async (userId) => {
  const { rows } = await sql`SELECT data, updated_at FROM user_data WHERE user_id = ${userId}`;
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
  const { rowCount } = await sql`DELETE FROM user_data WHERE updated_at < NOW() - INTERVAL '1 day' * ${daysOld}`;
  return rowCount;
};

export const checkConnection = async () => {
  try {
    await sql`SELECT 1`;
    return true;
  } catch { return false; }
};

export { sql };