import { sql } from '@vercel/postgres';

export const DEFAULT_DASHBOARD_DATA = {
  calendarEvents: [],
  tasks: [],
  dates: [],
  trips: [],
  recipes: [],
  watchlist: [],
  profile: { users: [] }
};

export const DEFAULT_DASHBOARD_SECTIONS = ['calendar', 'tasks', 'dates', 'trips', 'recipes', 'watchlist'];

const LEGACY_SECTION_MAP = { locations: 'dates', expenses: 'trips' };
const remapLegacySection = (section) => LEGACY_SECTION_MAP[section] || section;

const asArray = (value) => Array.isArray(value) ? value : [];
const asObject = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const asString = (value) => value == null ? '' : String(value);

const sanitizeHttpUrl = (value) => {
  const raw = asString(value).trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
};

const sanitizeImageUrl = (value) => {
  const raw = asString(value).trim();
  if (!raw) return '';
  if (/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(raw)) return raw;
  return sanitizeHttpUrl(raw);
};

const finiteNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
};

const getRelationKind = async (relationName) => {
  const result = await sql`
    SELECT c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = ${relationName}
    LIMIT 1
  `;

  return result.rows[0]?.relkind || null;
};

export const normalizeDashboardSections = (sections) => {
  const allowed = new Set(DEFAULT_DASHBOARD_SECTIONS);
  const normalized = asArray(sections)
    .map(remapLegacySection)
    .filter((section) => allowed.has(section));
  return normalized.length ? Array.from(new Set(normalized)) : [...DEFAULT_DASHBOARD_SECTIONS];
};

const normalizeMediaCategory = (item = {}, fallbackCategory = '') => {
  const category = String(item.category || fallbackCategory || '').toLowerCase();
  const type = String(item.type || '').toLowerCase();

  if (category === 'books' || type === 'book') return 'books';
  if (category === 'movies' || type === 'movie') return 'movies';
  return 'tvshows';
};

const normalizeWatchlistStatus = (item = {}, category) => {
  const status = item.status;
  if (category === 'books') {
    if (status === 'toRead' || status === 'plan-to-read') return 'plan-to-read';
    if (status === 'reading') return 'reading';
    if (status === 'read' || status === 'completed') return 'read';
    return 'plan-to-read';
  }

  if (status === 'toWatch' || status === 'plan-to-watch') return 'plan-to-watch';
  if (status === 'watching') return 'watching';
  if (status === 'watched' || status === 'completed' || status === 'read') return 'completed';
  return 'plan-to-watch';
};

const normalizeWatchlistItem = (item, fallbackCategory) => {
  const value = asObject(item);
  const category = normalizeMediaCategory(value, fallbackCategory);
  const typeByCategory = {
    movies: 'Movie',
    tvshows: 'Tv Show',
    books: 'Book'
  };

  return {
    ...value,
    title: asString(value.title || value.name),
    thumbnail: sanitizeImageUrl(value.thumbnail || value.image || value.photo),
    category,
    type: typeByCategory[category],
    status: normalizeWatchlistStatus(value, category)
  };
};

const normalizeTaskRecurrence = (task = {}) => {
  const frequency = task.recurrence?.frequency || task.recurrence || task.repeat || task.recurrenceFrequency || 'none';
  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) return null;
  return { frequency };
};

const VALID_TASK_PRIORITIES = new Set(['low', 'medium', 'high']);
const normalizeTaskPriority = (value) => {
  const raw = asString(value).toLowerCase();
  return VALID_TASK_PRIORITIES.has(raw) ? raw : null;
};

const normalizeCompletionHistoryServer = (history = []) => (
  Array.isArray(history)
    ? history.map(entry => ({
      completedAt: asString(entry?.completedAt),
      completedBy: entry?.completedBy || null,
      completedByName: asString(entry?.completedByName)
    })).filter(entry => entry.completedAt)
    : []
);

const normalizeTask = (task = {}) => {
  const item = asObject(task);
  const recurrence = normalizeTaskRecurrence(item);

  return {
    ...item,
    title: asString(item.title),
    description: asString(item.description),
    assignedTo: item.assignedTo || null,
    dueDate: item.dueDate || null,
    priority: normalizeTaskPriority(item.priority),
    completed: recurrence ? false : Boolean(item.completed),
    recurrence,
    lastCompletedAt: item.lastCompletedAt || null,
    completionCount: Number(item.completionCount || 0),
    completedAt: item.completedAt || null,
    completionHistory: normalizeCompletionHistoryServer(item.completionHistory),
    listType: item.listType === 'shared-checklist' ? 'shared-checklist' : 'task',
    subtasks: Array.isArray(item.subtasks) ? item.subtasks.map((subtask, idx) => ({ id: subtask?.id || `subtask-${idx}`, title: asString(subtask?.title), completed: Boolean(subtask?.completed) })).filter(subtask => subtask.title) : []
  };
};

const normalizeCalendarEvent = (event = {}) => {
  const item = asObject(event);
  const startDate = item.startDate || item.date || '';
  const endDate = item.endDate || startDate;
  const frequency = item.recurrence?.frequency || item.recurrence || item.repeat || 'none';
  const recurrence = ['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)
    ? {
      frequency,
      until: item.recurrence?.until || item.recurrenceUntil || ''
    }
    : null;

  return {
    ...item,
    date: startDate,
    startDate,
    endDate,
    recurrence
  };
};

const VALID_DATE_STATUSES = new Set(['want-to-go', 'visited']);

const normalizeDateStatus = (place = {}) => {
  const raw = asString(place?.status || place?.dateStatus).toLowerCase();
  if (VALID_DATE_STATUSES.has(raw)) return raw;
  if (place?.beenThere === true) return 'visited';
  return 'want-to-go';
};

const normalizeDatePlace = (place = {}) => {
  const item = asObject(place);
  const status = normalizeDateStatus(item);
  return {
    ...item,
    name: asString(item.name),
    address: asString(item.address),
    notes: asString(item.notes),
    category: asString(item.category) || 'restaurant',
    link: sanitizeHttpUrl(item.link || item.url),
    photo: sanitizeImageUrl(item.photo),
    geocodingStatus: asString(item.geocodingStatus),
    geocodingError: asString(item.geocodingError),
    geocodedAddress: asString(item.geocodedAddress),
    geocodedAt: asString(item.geocodedAt),
    lat: finiteNumberOrNull(item.lat),
    lng: finiteNumberOrNull(item.lng),
    status,
    beenThere: status === 'visited',
    isFavourite: Boolean(item.isFavourite),
    starRating: finiteNumberOrNull(item.starRating) || 0
  };
};

const normalizeChecklistEntries = (items = []) => (
  Array.isArray(items)
    ? items.map((item, idx) => ({
      id: item?.id || `entry-${idx}`,
      title: asString(item?.title || item?.name).trim(),
      notes: asString(item?.notes),
      completed: Boolean(item?.completed)
    })).filter(item => item.title)
    : []
);

const normalizeItineraryEntries = (items = []) => (
  Array.isArray(items)
    ? items.map((item, idx) => ({
      id: item?.id || `day-${idx}`,
      day: Number.isFinite(Number(item?.day)) ? Number(item.day) : idx + 1,
      date: asString(item?.date),
      title: asString(item?.title).trim(),
      notes: asString(item?.notes)
    }))
    : []
);

const normalizeTrip = (trip = {}) => {
  const item = asObject(trip);
  return {
    ...item,
    destination: asString(item.destination || item.title).trim(),
    startDate: asString(item.startDate || item.dateStart),
    endDate: asString(item.endDate || item.dateEnd),
    flights: asString(item.flights),
    hotel: asString(item.hotel),
    budget: finiteNumberOrNull(item.budget),
    itinerary: normalizeItineraryEntries(item.itinerary),
    packingList: normalizeChecklistEntries(item.packingList),
    placesToVisit: normalizeChecklistEntries(item.placesToVisit),
    restaurants: normalizeChecklistEntries(item.restaurants),
    documents: asString(item.documents),
    notes: asString(item.notes)
  };
};

const normalizeRecipe = (recipe = {}) => {
  const item = asObject(recipe);
  return {
    ...item,
    name: asString(item.name),
    photo: sanitizeImageUrl(item.photo),
    link: sanitizeHttpUrl(item.link || item.url),
    ingredients: asString(item.ingredients),
    instructions: asString(item.instructions)
  };
};

const normalizeProfile = (profile = {}) => {
  const value = asObject(profile);
  return {
    ...value,
    users: asArray(value.users).map((user) => {
      const item = asObject(user);
      return {
        ...item,
        name: asString(item.name),
        avatar: sanitizeImageUrl(item.avatar)
      };
    })
  };
};

export const normalizeDashboardData = (data = {}) => {
  const raw = data && typeof data === 'object' ? data : {};
  const watchlistByKey = new Map();
  const addWatchlistItems = (items, fallbackCategory) => {
    asArray(items).forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const normalized = normalizeWatchlistItem(item, fallbackCategory);
      const key = `${normalized.category}:${normalized.id || normalized.title || watchlistByKey.size}`;
      watchlistByKey.set(key, normalized);
    });
  };

  addWatchlistItems(raw.watchlist, '');
  addWatchlistItems(raw.movies, 'movies');
  addWatchlistItems(raw.tvshows, 'tvshows');
  addWatchlistItems(raw.anime, 'tvshows');
  addWatchlistItems(raw.books, 'books');

  const datesSource = asArray(raw.dates).length ? asArray(raw.dates) : asArray(raw.locations);
  return {
    calendarEvents: asArray(raw.calendarEvents).map(normalizeCalendarEvent),
    tasks: asArray(raw.tasks).map(normalizeTask),
    dates: datesSource.map(normalizeDatePlace),
    trips: asArray(raw.trips).map(normalizeTrip),
    recipes: asArray(raw.recipes).map(normalizeRecipe),
    watchlist: Array.from(watchlistByKey.values()),
    profile: raw.profile && typeof raw.profile === 'object' ? normalizeProfile(raw.profile) : DEFAULT_DASHBOARD_DATA.profile
  };
};

export const initializeDatabase = async () => {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        display_name TEXT NOT NULL,
        username TEXT,
        email_verified BOOLEAN DEFAULT false NOT NULL,
        failed_login_count INTEGER DEFAULT 0 NOT NULL,
        last_failed_login_at TIMESTAMP,
        login_locked_until TIMESTAMP,
        google_id TEXT UNIQUE,
        apple_id TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS username TEXT
    `;

    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN
    `;

    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0 NOT NULL
    `;

    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP
    `;

    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS login_locked_until TIMESTAMP
    `;

    await sql`
      UPDATE users
      SET email_verified = true
      WHERE email_verified IS NULL
    `;

    await sql`
      ALTER TABLE users
      ALTER COLUMN email_verified SET DEFAULT false
    `;

    await sql`
      ALTER TABLE users
      ALTER COLUMN email_verified SET NOT NULL
    `;

    await sql`
      WITH ranked_users AS (
        SELECT
          id,
          COALESCE(NULLIF(username, ''), display_name) AS base_username,
          ROW_NUMBER() OVER (
            PARTITION BY LOWER(COALESCE(NULLIF(username, ''), display_name))
            ORDER BY created_at, id
          ) AS duplicate_rank
        FROM users
      )
      UPDATE users
      SET username = CASE
        WHEN ranked_users.duplicate_rank = 1 THEN ranked_users.base_username
        ELSE ranked_users.base_username || '-' || LEFT(users.id, 6)
      END
      FROM ranked_users
      WHERE users.id = ranked_users.id
        AND (
          users.username IS NULL
          OR users.username = ''
          OR ranked_users.duplicate_rank > 1
        )
    `;

    // Migrate previous table names to the dashboard naming convention.
    const shelvesRelationKind = await getRelationKind('shelves');
    const shelfIdRelationKind = await getRelationKind('shelf_id');
    const spacesRelationKind = await getRelationKind('spaces');
    const DashboardsRelationKind = await getRelationKind('dashboards');

    if (spacesRelationKind === 'r' && !DashboardsRelationKind) {
      await sql`ALTER TABLE spaces RENAME TO dashboards`;
    } else if (shelvesRelationKind === 'r' && !shelfIdRelationKind && !DashboardsRelationKind) {
      await sql`ALTER TABLE shelves RENAME TO dashboards`;
    } else if (shelfIdRelationKind === 'r' && !DashboardsRelationKind) {
      await sql`ALTER TABLE shelf_id RENAME TO dashboards`;
    }

    const DashboardMembersRelationKind = await getRelationKind('dashboard_members');
    const spaceMembersRelationKind = await getRelationKind('space_members');
    const shelfMembersRelationKind = await getRelationKind('shelf_members');
    if (spaceMembersRelationKind === 'r' && !DashboardMembersRelationKind) {
      await sql`ALTER TABLE space_members RENAME TO dashboard_members`;
    } else if (shelfMembersRelationKind === 'r' && !DashboardMembersRelationKind) {
      await sql`ALTER TABLE shelf_members RENAME TO dashboard_members`;
    }

    const DashboardJoinCodesRelationKind = await getRelationKind('dashboard_join_codes');
    const spaceJoinCodesRelationKind = await getRelationKind('space_join_codes');
    const shelfJoinCodesRelationKind = await getRelationKind('shelf_join_codes');
    if (spaceJoinCodesRelationKind === 'r' && !DashboardJoinCodesRelationKind) {
      await sql`ALTER TABLE space_join_codes RENAME TO dashboard_join_codes`;
    } else if (shelfJoinCodesRelationKind === 'r' && !DashboardJoinCodesRelationKind) {
      await sql`ALTER TABLE shelf_join_codes RENAME TO dashboard_join_codes`;
    }

    const DashboardDataRelationKind = await getRelationKind('dashboard_data');
    const spaceDataRelationKind = await getRelationKind('space_data');
    const shelfDataRelationKind = await getRelationKind('shelf_data');
    if (spaceDataRelationKind === 'r' && !DashboardDataRelationKind) {
      await sql`ALTER TABLE space_data RENAME TO dashboard_data`;
    } else if (shelfDataRelationKind === 'r' && !DashboardDataRelationKind) {
      await sql`ALTER TABLE shelf_data RENAME TO dashboard_data`;
    }

    // Migrate previous id column names to dashboard_id across junction tables.
    const hasSpaceIdInMembers = await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'dashboard_members' AND column_name = 'space_id'
      LIMIT 1
    `;
    if (hasSpaceIdInMembers.rows.length > 0) {
      await sql`ALTER TABLE dashboard_members RENAME COLUMN space_id TO dashboard_id`;
    }

    const hasShelfIdInMembers = await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'dashboard_members' AND column_name = 'shelf_id'
      LIMIT 1
    `;
    if (hasShelfIdInMembers.rows.length > 0) {
      await sql`ALTER TABLE dashboard_members RENAME COLUMN shelf_id TO dashboard_id`;
    }

    const hasSpaceIdInJoinCodes = await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'dashboard_join_codes' AND column_name = 'space_id'
      LIMIT 1
    `;
    if (hasSpaceIdInJoinCodes.rows.length > 0) {
      await sql`ALTER TABLE dashboard_join_codes RENAME COLUMN space_id TO dashboard_id`;
    }

    const hasShelfIdInJoinCodes = await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'dashboard_join_codes' AND column_name = 'shelf_id'
      LIMIT 1
    `;
    if (hasShelfIdInJoinCodes.rows.length > 0) {
      await sql`ALTER TABLE dashboard_join_codes RENAME COLUMN shelf_id TO dashboard_id`;
    }

    const hasSpaceIdInData = await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'dashboard_data' AND column_name = 'space_id'
      LIMIT 1
    `;
    if (hasSpaceIdInData.rows.length > 0) {
      await sql`ALTER TABLE dashboard_data RENAME COLUMN space_id TO dashboard_id`;
    }

    const hasShelfIdInData = await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'dashboard_data' AND column_name = 'shelf_id'
      LIMIT 1
    `;
    if (hasShelfIdInData.rows.length > 0) {
      await sql`ALTER TABLE dashboard_data RENAME COLUMN shelf_id TO dashboard_id`;
    }

    // dashboard metadata table (formerly shelf_id)
    await sql`
      CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      ALTER TABLE dashboards
      ADD COLUMN IF NOT EXISTS logo_url TEXT
    `;

    await sql`
      ALTER TABLE dashboards
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `;

    await sql`
      ALTER TABLE dashboards
      ADD COLUMN IF NOT EXISTS enabled_sections JSONB NOT NULL DEFAULT '["calendar","tasks","dates","trips","recipes","watchlist"]'::jsonb
    `;

    await sql`
      ALTER TABLE dashboards
      ALTER COLUMN enabled_sections SET DEFAULT '["calendar","tasks","dates","trips","recipes","watchlist"]'::jsonb
    `;

    const currentShelvesRelationKind = await getRelationKind('shelves');
    if (!currentShelvesRelationKind || currentShelvesRelationKind === 'v') {
      await sql`
        CREATE OR REPLACE VIEW shelves AS
        SELECT id, name, created_by, logo_url, enabled_sections, created_at, updated_at
        FROM dashboards
      `;
    }

    const currentSpacesRelationKind = await getRelationKind('spaces');
    if (!currentSpacesRelationKind || currentSpacesRelationKind === 'v') {
      await sql`
        CREATE OR REPLACE VIEW spaces AS
        SELECT id, name, created_by, logo_url, enabled_sections, created_at, updated_at
        FROM dashboards
      `;
    }

    // dashboard members
    await sql`
      CREATE TABLE IF NOT EXISTS dashboard_members (
        dashboard_id TEXT REFERENCES dashboards(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (dashboard_id, user_id)
      )
    `;

    // Join codes
    await sql`
      CREATE TABLE IF NOT EXISTS dashboard_join_codes (
        id SERIAL PRIMARY KEY,
        dashboard_id TEXT REFERENCES dashboards(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        is_used BOOLEAN DEFAULT false,
        expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // dashboard data
    await sql`
      CREATE TABLE IF NOT EXISTS dashboard_data (
        dashboard_id TEXT PRIMARY KEY REFERENCES dashboards(id) ON DELETE CASCADE,
        data JSONB NOT NULL DEFAULT '{"calendarEvents":[],"tasks":[],"dates":[],"trips":[],"recipes":[],"watchlist":[],"profile":{"users":[]}}'::jsonb,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      ALTER TABLE dashboard_data
      ALTER COLUMN data SET DEFAULT '{"calendarEvents":[],"tasks":[],"dates":[],"trips":[],"recipes":[],"watchlist":[],"profile":{"users":[]}}'::jsonb
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

    // Email verification tokens (one active token per user)
    await sql`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Generic request counters for serverless-compatible abuse protection.
    await sql`
      CREATE TABLE IF NOT EXISTS auth_rate_limits (
        id BIGSERIAL PRIMARY KEY,
        scope TEXT NOT NULL,
        rate_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dashboard_members_user ON dashboard_members(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dashboard_members_composite ON dashboard_members(user_id, dashboard_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dashboard_join_codes_code ON dashboard_join_codes(code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dashboard_join_codes_dashboard ON dashboard_join_codes(dashboard_id, is_used)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_scope_key_created ON auth_rate_limits(scope, rate_key, created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dashboards_updated ON dashboards(updated_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dashboard_data_dashboard ON dashboard_data(dashboard_id)`;

    // Migrate locations -> dates: copy locations array under `dates` key when missing.
    await sql`
      UPDATE dashboard_data
      SET data = jsonb_set(
        data,
        '{dates}',
        COALESCE(data->'locations', '[]'::jsonb)
      )
      WHERE data ? 'locations' AND NOT (data ? 'dates')
    `;

    // Old expenses data shape is incompatible with the new Trips feature; ensure a
    // `trips` array exists so dashboards opened after this migration have a defined slot.
    await sql`
      UPDATE dashboard_data
      SET data = jsonb_set(data, '{trips}', '[]'::jsonb)
      WHERE NOT (data ? 'trips')
    `;

    // Migrate enabled_sections: replace 'locations' with 'dates' and 'expenses' with 'trips'.
    await sql`
      UPDATE dashboards
      SET enabled_sections = (
        SELECT jsonb_agg(
          CASE
            WHEN elem::text = '"locations"' THEN '"dates"'::jsonb
            WHEN elem::text = '"expenses"' THEN '"trips"'::jsonb
            ELSE elem
          END
        )
        FROM jsonb_array_elements(enabled_sections) AS elem
      )
      WHERE enabled_sections @> '["locations"]'::jsonb
         OR enabled_sections @> '["expenses"]'::jsonb
    `;

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
