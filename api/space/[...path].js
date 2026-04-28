import { randomBytes, randomUUID } from 'crypto';
import {
  consumeRateLimit,
  cors,
  errResponse,
  getClientIp,
  getUserIdFromRequest,
  normalizeRateLimitKey,
  rateLimitResponse,
  sql
} from '../../lib/auth-shared.js';
import { DEFAULT_SPACE_DATA, initializeDatabase, normalizeSpaceData, normalizeSpaceSections } from '../../lib/db.js';

const JOIN_CODE_RATE_LIMIT = { limit: 10, windowSeconds: 15 * 60 };
const JOIN_CODE_IP_RATE_LIMIT = { limit: 60, windowSeconds: 15 * 60 };

async function ensureSchema() {
  await initializeDatabase();
}

function getPathSegments(req) {
  const rawPath = req.query?.path;
  const values = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];

  return values
    .flatMap((value) => String(value).split('/'))
    .map((value) => value.trim())
    .filter((value) => value && value !== '__root__');
}

async function userHasSpace(userId) {
  const result = await sql`
    SELECT 1
    FROM space_members
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  return result.rows.length > 0;
}

async function requireSpaceMember(spaceId, userId) {
  const result = await sql`
    SELECT role
    FROM space_members
    WHERE shelf_id = ${spaceId} AND user_id = ${userId}
    LIMIT 1
  `;

  return result.rows[0] || null;
}

async function getSpaceSummary(spaceId) {
  const result = await sql`
    SELECT
      s.id,
      s.name,
      s.created_by,
      s.logo_url AS logo,
      s.enabled_sections AS "enabledSections",
      s.created_at,
      s.updated_at,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', member_rows.id,
              'name', member_rows.name,
              'username', member_rows.username,
              'role', member_rows.role
            )
            ORDER BY CASE WHEN member_rows.role = 'owner' THEN 0 ELSE 1 END, member_rows.joined_at
          )
          FROM (
            SELECT u.id, u.display_name AS name, u.username, sm.role, sm.joined_at
            FROM space_members sm
            JOIN users u ON u.id = sm.user_id
            WHERE sm.shelf_id = s.id
          ) member_rows
        ),
        '[]'::json
      ) AS members
    FROM spaces s
    WHERE s.id = ${spaceId}
    LIMIT 1
  `;

  return result.rows[0] || null;
}

function generateJoinCode() {
  return randomBytes(6).toString('base64url').toUpperCase();
}

function sanitizeHttpUrl(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';

  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function normalizeSpaceName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  return name.slice(0, 80);
}

async function createJoinCode(spaceId) {
  const code = generateJoinCode();

  await sql`
    INSERT INTO space_join_codes (shelf_id, code, is_used, expires_at)
    VALUES (${spaceId}, ${code}, false, NOW() + INTERVAL '7 days')
  `;

  return code;
}

async function getLatestActiveJoinCode(spaceId) {
  const result = await sql`
    SELECT id, code, expires_at, created_at
    FROM space_join_codes
    WHERE shelf_id = ${spaceId}
      AND is_used = false
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  return result.rows[0] || null;
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await ensureSchema();

    const segments = getPathSegments(req);

    if (segments.length === 0) {
      if (req.method === 'GET') {
        const result = await sql`
          SELECT
            s.id,
            s.name,
            s.created_by,
            s.logo_url AS logo,
            s.enabled_sections AS "enabledSections",
            sm.role,
            s.created_at,
            s.updated_at,
            COALESCE(
              (
                SELECT json_agg(
                  json_build_object(
                    'id', member_rows.id,
                    'name', member_rows.name,
                    'username', member_rows.username,
                    'role', member_rows.role
                  )
                  ORDER BY CASE WHEN member_rows.role = 'owner' THEN 0 ELSE 1 END, member_rows.joined_at
                )
                FROM (
                  SELECT u.id, u.display_name AS name, u.username, member_sm.role, member_sm.joined_at
                  FROM space_members member_sm
                  JOIN users u ON u.id = member_sm.user_id
                  WHERE member_sm.shelf_id = s.id
                ) member_rows
              ),
              '[]'::json
            ) AS members
          FROM spaces s
          JOIN space_members sm ON s.id = sm.shelf_id
          WHERE sm.user_id = ${userId}
          ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC
        `;

        return res.json({ spaces: result.rows });
      }

      if (req.method === 'POST') {
        if (await userHasSpace(userId)) {
          return res.status(409).json({ error: 'You already belong to a space. Each user can only have one space.' });
        }
        const name = normalizeSpaceName(req.body?.name);
        if (!name) return res.status(400).json({ error: 'Name required' });
        const spaceId = randomUUID();
        const enabledSections = normalizeSpaceSections(req.body?.enabledSections);

        const created = await sql`
          INSERT INTO spaces (id, name, created_by, enabled_sections, updated_at)
          VALUES (${spaceId}, ${name}, ${userId}, ${JSON.stringify(enabledSections)}::jsonb, NOW())
          RETURNING id, name, created_by, logo_url AS logo, enabled_sections AS "enabledSections", created_at, updated_at
        `;
        const space = created.rows[0];

        await sql`
          INSERT INTO space_members (shelf_id, user_id, role)
          VALUES (${space.id}, ${userId}, 'owner')
          ON CONFLICT (shelf_id, user_id) DO NOTHING
        `;

        await sql`
          INSERT INTO space_data (shelf_id, data)
          VALUES (${space.id}, ${JSON.stringify(DEFAULT_SPACE_DATA)}::jsonb)
          ON CONFLICT (shelf_id) DO NOTHING
        `;

        const joinCode = await createJoinCode(space.id);

        const createdSpace = await getSpaceSummary(space.id);
        return res.status(201).json({ space: createdSpace, shelf: createdSpace, joinCode });
      }
    }

    if (segments.length === 1 && segments[0] === 'join' && req.method === 'POST') {
      const spaceId = (req.body?.spaceId || req.body?.shelfId)?.trim();
      const joinCode = req.body?.joinCode?.trim().toUpperCase();
      if (!spaceId || !joinCode) {
        return res.status(400).json({ error: 'Space ID and join code are required' });
      }

      const ip = getClientIp(req);
      const [joinLimit, ipLimit] = await Promise.all([
        consumeRateLimit({
          scope: 'space-join-code',
          key: `${userId}:${normalizeRateLimitKey(spaceId)}:${ip}`,
          ...JOIN_CODE_RATE_LIMIT
        }),
        consumeRateLimit({
          scope: 'space-join-code-ip',
          key: ip,
          ...JOIN_CODE_IP_RATE_LIMIT
        })
      ]);

      if (!joinLimit.allowed || !ipLimit.allowed) {
        return rateLimitResponse(
          res,
          !joinLimit.allowed ? joinLimit : ipLimit,
          'Too many join-code attempts. Please wait a few minutes and try again.'
        );
      }

      const existingMember = await requireSpaceMember(spaceId, userId);
      if (existingMember) {
        return res.status(409).json({ error: 'You are already a member of this space' });
      }

      if (await userHasSpace(userId)) {
        return res.status(409).json({ error: 'You already belong to a space. Each user can only have one space.' });
      }

      const codeMatch = await sql`
        SELECT id
        FROM space_join_codes
        WHERE shelf_id = ${spaceId}
          AND code = ${joinCode}
          AND is_used = false
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;
      if (codeMatch.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired join code' });
      }

      await sql`
        INSERT INTO space_members (shelf_id, user_id, role)
        VALUES (${spaceId}, ${userId}, 'member')
      `;

      await sql`
        UPDATE space_join_codes
        SET is_used = true
        WHERE id = ${codeMatch.rows[0].id}
      `;

      const space = await getSpaceSummary(spaceId);

      return res.json({ success: true, space, shelf: space });
    }

    if (segments.length === 1 && req.method === 'PATCH') {
      const spaceId = segments[0];
      const membership = await requireSpaceMember(spaceId, userId);
      if (!membership) return res.status(403).json({ error: 'Not a member of this space' });
      if (membership.role !== 'owner') {
        return res.status(403).json({ error: 'Only the space owner can update space settings' });
      }

      const nextName = normalizeSpaceName(req.body?.name);
      const nextLogo = typeof req.body?.logo === 'string' ? sanitizeHttpUrl(req.body.logo) : undefined;
      const hasEnabledSections = Array.isArray(req.body?.enabledSections);
      const nextEnabledSections = hasEnabledSections ? normalizeSpaceSections(req.body.enabledSections) : undefined;

      if (!nextName && nextLogo === undefined && !hasEnabledSections) {
        return res.status(400).json({ error: 'At least one space setting is required' });
      }

      const existingSpace = await getSpaceSummary(spaceId);
      if (!existingSpace) return res.status(404).json({ error: 'Space not found' });

      const updated = await sql`
        UPDATE spaces
        SET
          name = ${nextName || existingSpace.name},
          logo_url = ${nextLogo === undefined ? existingSpace.logo : nextLogo || null},
          enabled_sections = ${JSON.stringify(nextEnabledSections || existingSpace.enabledSections || normalizeSpaceSections())}::jsonb,
          updated_at = NOW()
        WHERE id = ${spaceId}
        RETURNING id, name, created_by, logo_url AS logo, enabled_sections AS "enabledSections", created_at, updated_at
      `;

      return res.json({ space: updated.rows[0], shelf: updated.rows[0] });
    }

    if (segments.length === 2 && segments[1] === 'share' && ['GET', 'POST'].includes(req.method)) {
      const spaceId = segments[0];
      const membership = await requireSpaceMember(spaceId, userId);
      if (!membership) return res.status(403).json({ error: 'Not a member of this space' });

      const space = await getSpaceSummary(spaceId);
      if (!space) return res.status(404).json({ error: 'Space not found' });

      let activeCode = await getLatestActiveJoinCode(spaceId);

      if (req.method === 'POST') {
        if (membership.role !== 'owner') {
          return res.status(403).json({ error: 'Only the space owner can generate a new join code' });
        }

        await sql`
          UPDATE space_join_codes
          SET is_used = true
          WHERE shelf_id = ${spaceId}
            AND is_used = false
            AND expires_at > NOW()
        `;

        await createJoinCode(spaceId);
        activeCode = await getLatestActiveJoinCode(spaceId);
      } else if (!activeCode) {
        await createJoinCode(spaceId);
        activeCode = await getLatestActiveJoinCode(spaceId);
      }

      return res.json({
        spaceId: space.id,
        spaceName: space.name,
        joinCode: activeCode?.code || null,
        expiresAt: activeCode?.expires_at || null
      });
    }

    if (segments.length === 2 && segments[1] === 'data' && ['GET', 'POST'].includes(req.method)) {
      const spaceId = segments[0];
      const membership = await requireSpaceMember(spaceId, userId);
      if (!membership) return res.status(403).json({ error: 'Not a member of this space' });

      if (req.method === 'GET') {
        const result = await sql`
          SELECT data
          FROM space_data
          WHERE shelf_id = ${spaceId}
          LIMIT 1
        `;

        return res.json(normalizeSpaceData(result.rows[0]?.data || DEFAULT_SPACE_DATA));
      }

      const payload = req.body?.data;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Data payload is required' });
      }
      const normalizedPayload = normalizeSpaceData(payload);

      await sql`
        INSERT INTO space_data (shelf_id, data, updated_at)
        VALUES (${spaceId}, ${JSON.stringify(normalizedPayload)}::jsonb, NOW())
        ON CONFLICT (shelf_id)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `;

      await sql`
        UPDATE spaces
        SET updated_at = NOW()
        WHERE id = ${spaceId}
      `;

      return res.json({ success: true });
    }

    if (segments.length === 2 && segments[1] === 'membership' && req.method === 'DELETE') {
      const spaceId = segments[0];
      const membership = await requireSpaceMember(spaceId, userId);
      if (!membership) return res.status(404).json({ error: 'Space not found' });

      await sql`
        DELETE FROM space_members
        WHERE shelf_id = ${spaceId} AND user_id = ${userId}
      `;

      const remainingMembers = await sql`
        SELECT COUNT(*)::int AS count
        FROM space_members
        WHERE shelf_id = ${spaceId}
      `;

      if ((remainingMembers.rows[0]?.count || 0) === 0) {
        await sql`
          DELETE FROM spaces
          WHERE id = ${spaceId}
        `;
      } else if (membership.role === 'owner') {
        await sql`
          UPDATE space_members
          SET role = 'owner'
          WHERE shelf_id = ${spaceId}
            AND user_id = (
              SELECT user_id
              FROM space_members
              WHERE shelf_id = ${spaceId}
              ORDER BY joined_at ASC
              LIMIT 1
            )
        `;
      }

      return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    return errResponse(res, error);
  }
}
