import { randomBytes } from 'crypto';
import {
  APP_URL,
  consumeRateLimit,
  cors,
  errResponse,
  getClientIp,
  getUserIdFromRequest,
  normalizeRateLimitKey,
  rateLimitResponse,
  sql
} from '../../lib/auth-shared.js';
import { DEFAULT_DASHBOARD_DATA, initializeDatabase, normalizeDashboardData, normalizeDashboardSections } from '../../lib/db.js';

const JOIN_CODE_RATE_LIMIT = { limit: 10, windowSeconds: 15 * 60 };
const JOIN_CODE_IP_RATE_LIMIT = { limit: 60, windowSeconds: 15 * 60 };
let schemaPromise = null;

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = initializeDatabase().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

function getPathSegments(req) {
  const rawPath = req.query?.path;
  const values = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];

  return values
    .flatMap((value) => String(value).split('/'))
    .map((value) => value.trim())
    .filter((value) => value && value !== '__root__');
}

async function userHasDashboard(userId) {
  const result = await sql`
    SELECT 1
    FROM dashboard_members
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  return result.rows.length > 0;
}

async function requireDashboardMember(dashboardId, userId) {
  const result = await sql`
    SELECT role
    FROM dashboard_members
    WHERE dashboard_id = ${dashboardId} AND user_id = ${userId}
    LIMIT 1
  `;

  return result.rows[0] || null;
}

async function getDashboardSummary(dashboardId) {
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
            FROM dashboard_members sm
            JOIN users u ON u.id = sm.user_id
            WHERE sm.dashboard_id = s.id
          ) member_rows
        ),
        '[]'::json
      ) AS members
    FROM dashboards s
    WHERE s.id = ${dashboardId}
    LIMIT 1
  `;

  return result.rows[0] || null;
}

function generateJoinCode() {
  return randomBytes(6).toString('base64url').toUpperCase();
}

function buildInviteLink(dashboardId, joinCode) {
  if (!dashboardId || !joinCode) return null;
  const inviteUrl = new URL('/dashboard-selection/', APP_URL);
  inviteUrl.searchParams.set('inviteDashboard', dashboardId);
  inviteUrl.searchParams.set('inviteCode', joinCode);
  return inviteUrl.toString();
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

function normalizeDashboardName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  return name.slice(0, 80);
}

async function createJoinCode(dashboardId) {
  const code = generateJoinCode();

  await sql`
    INSERT INTO dashboard_join_codes (dashboard_id, code, is_used, expires_at)
    VALUES (${dashboardId}, ${code}, false, NOW() + INTERVAL '7 days')
  `;

  return code;
}

async function getLatestActiveJoinCode(dashboardId) {
  const result = await sql`
    SELECT id, code, expires_at, created_at
    FROM dashboard_join_codes
    WHERE dashboard_id = ${dashboardId}
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
            json_agg(
              json_build_object(
                'id', u.id,
                'name', u.display_name,
                'username', u.username,
                'role', member_sm.role
              )
              ORDER BY CASE WHEN member_sm.role = 'owner' THEN 0 ELSE 1 END, member_sm.joined_at
            ) FILTER (WHERE u.id IS NOT NULL) AS members
          FROM dashboards s
          JOIN dashboard_members sm ON s.id = sm.dashboard_id AND sm.user_id = ${userId}
          LEFT JOIN dashboard_members member_sm ON s.id = member_sm.dashboard_id
          LEFT JOIN users u ON u.id = member_sm.user_id
          GROUP BY s.id, s.name, s.created_by, s.logo_url, s.enabled_sections, s.created_at, s.updated_at, sm.role
          ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC
        `;

        return res.json({ dashboards: result.rows });
      }

      if (req.method === 'POST') {
        if (await userHasDashboard(userId)) {
          return res.status(409).json({ error: 'You already belong to a dashboard. Each user can only have one dashboard.' });
        }
        const name = normalizeDashboardName(req.body?.name);
        if (!name) return res.status(400).json({ error: 'Name required' });
        const rand4 = () => String(Math.floor(1000 + Math.random() * 9000));
        const dashboardId = `${rand4()}-${rand4()}`;
        const enabledSections = normalizeDashboardSections(req.body?.enabledSections);

        const created = await sql`
          INSERT INTO dashboards (id, name, created_by, enabled_sections, updated_at)
          VALUES (${dashboardId}, ${name}, ${userId}, ${JSON.stringify(enabledSections)}::jsonb, NOW())
          RETURNING id, name, created_by, logo_url AS logo, enabled_sections AS "enabledSections", created_at, updated_at
        `;
        const dashboard = created.rows[0];

        await sql`
          INSERT INTO dashboard_members (dashboard_id, user_id, role)
          VALUES (${dashboard.id}, ${userId}, 'owner')
          ON CONFLICT (dashboard_id, user_id) DO NOTHING
        `;

        await sql`
          INSERT INTO dashboard_data (dashboard_id, data)
          VALUES (${dashboard.id}, ${JSON.stringify(DEFAULT_DASHBOARD_DATA)}::jsonb)
          ON CONFLICT (dashboard_id) DO NOTHING
        `;

        const joinCode = await createJoinCode(dashboard.id);

        const createdDashboard = { ...(await getDashboardSummary(dashboard.id)), role: 'owner' };
        return res.status(201).json({ dashboard: createdDashboard, shelf: createdDashboard, joinCode });
      }
    }

    if (segments.length === 1 && segments[0] === 'join' && req.method === 'POST') {
      const dashboardId = (req.body?.dashboardId || req.body?.shelfId)?.trim();
      const joinCode = req.body?.joinCode?.trim().toUpperCase();
      if (!dashboardId || !joinCode) {
        return res.status(400).json({ error: 'dashboard ID and join code are required' });
      }

      const ip = getClientIp(req);
      const [joinLimit, ipLimit] = await Promise.all([
        consumeRateLimit({
          scope: 'dashboard-join-code',
          key: `${userId}:${normalizeRateLimitKey(dashboardId)}:${ip}`,
          ...JOIN_CODE_RATE_LIMIT
        }),
        consumeRateLimit({
          scope: 'dashboard-join-code-ip',
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

      const existingMember = await requireDashboardMember(dashboardId, userId);
      if (existingMember) {
        return res.status(409).json({ error: 'You are already a member of this dashboard' });
      }

      if (await userHasDashboard(userId)) {
        return res.status(409).json({ error: 'You already belong to a dashboard. Each user can only have one dashboard.' });
      }

      const codeMatch = await sql`
        SELECT id
        FROM dashboard_join_codes
        WHERE dashboard_id = ${dashboardId}
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
        INSERT INTO dashboard_members (dashboard_id, user_id, role)
        VALUES (${dashboardId}, ${userId}, 'member')
      `;

      await sql`
        UPDATE dashboard_join_codes
        SET is_used = true
        WHERE id = ${codeMatch.rows[0].id}
      `;

      const dashboard = { ...(await getDashboardSummary(dashboardId)), role: 'member' };

      return res.json({ success: true, dashboard, shelf: dashboard });
    }

    if (segments.length === 1 && req.method === 'PATCH') {
      const dashboardId = segments[0];
      const membership = await requireDashboardMember(dashboardId, userId);
      if (!membership) return res.status(403).json({ error: 'Not a member of this dashboard' });
      if (membership.role !== 'owner') {
        return res.status(403).json({ error: 'Only the dashboard owner can update dashboard settings' });
      }

      const nextName = normalizeDashboardName(req.body?.name);
      const nextLogo = typeof req.body?.logo === 'string' ? sanitizeHttpUrl(req.body.logo) : undefined;
      const hasEnabledSections = Array.isArray(req.body?.enabledSections);
      const nextEnabledSections = hasEnabledSections ? normalizeDashboardSections(req.body.enabledSections) : undefined;

      if (!nextName && nextLogo === undefined && !hasEnabledSections) {
        return res.status(400).json({ error: 'At least one dashboard setting is required' });
      }

      const existingDashboard = await getDashboardSummary(dashboardId);
      if (!existingDashboard) return res.status(404).json({ error: 'dashboard not found' });

      await sql`
        UPDATE dashboards
        SET
          name = ${nextName || existingDashboard.name},
          logo_url = ${nextLogo === undefined ? existingDashboard.logo : nextLogo || null},
          enabled_sections = ${JSON.stringify(nextEnabledSections || existingDashboard.enabledSections || normalizeDashboardSections())}::jsonb,
          updated_at = NOW()
        WHERE id = ${dashboardId}
      `;

      const updatedDashboard = await getDashboardSummary(dashboardId);
      return res.json({
        dashboard: { ...updatedDashboard, role: membership.role },
        shelf: { ...updatedDashboard, role: membership.role }
      });
    }

    if (segments.length === 2 && segments[1] === 'share' && ['GET', 'POST'].includes(req.method)) {
      const dashboardId = segments[0];
      const membership = await requireDashboardMember(dashboardId, userId);
      if (!membership) return res.status(403).json({ error: 'Not a member of this dashboard' });

      const dashboard = await getDashboardSummary(dashboardId);
      if (!dashboard) return res.status(404).json({ error: 'dashboard not found' });

      let activeCode = await getLatestActiveJoinCode(dashboardId);

      if (req.method === 'POST') {
        if (membership.role !== 'owner') {
          return res.status(403).json({ error: 'Only the dashboard owner can generate a new join code' });
        }

        await sql`
          UPDATE dashboard_join_codes
          SET is_used = true
          WHERE dashboard_id = ${dashboardId}
            AND is_used = false
            AND expires_at > NOW()
        `;

        await createJoinCode(dashboardId);
        activeCode = await getLatestActiveJoinCode(dashboardId);
      }

      const canGenerateInvite = membership.role === 'owner';
      return res.json({
        dashboardId: dashboard.id,
        dashboardName: dashboard.name,
        role: membership.role,
        canGenerateInvite,
        joinCode: activeCode?.code || null,
        expiresAt: activeCode?.expires_at || null,
        inviteLink: activeCode?.code ? buildInviteLink(dashboard.id, activeCode.code) : null
      });
    }

    if (segments.length === 2 && segments[1] === 'data' && ['GET', 'POST'].includes(req.method)) {
      const dashboardId = segments[0];
      const membership = await requireDashboardMember(dashboardId, userId);
      if (!membership) return res.status(403).json({ error: 'Not a member of this dashboard' });

      if (req.method === 'GET') {
        const result = await sql`
          SELECT data
          FROM dashboard_data
          WHERE dashboard_id = ${dashboardId}
          LIMIT 1
        `;

        return res.json(normalizeDashboardData(result.rows[0]?.data || DEFAULT_DASHBOARD_DATA));
      }

      const payload = req.body?.data;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Data payload is required' });
      }
      const normalizedPayload = normalizeDashboardData(payload);

      await sql`
        INSERT INTO dashboard_data (dashboard_id, data, updated_at)
        VALUES (${dashboardId}, ${JSON.stringify(normalizedPayload)}::jsonb, NOW())
        ON CONFLICT (dashboard_id)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `;

      await sql`
        UPDATE dashboards
        SET updated_at = NOW()
        WHERE id = ${dashboardId}
      `;

      return res.json({ success: true });
    }

    if (segments.length === 2 && segments[1] === 'membership' && req.method === 'DELETE') {
      const dashboardId = segments[0];
      const membership = await requireDashboardMember(dashboardId, userId);
      if (!membership) return res.status(404).json({ error: 'dashboard not found' });

      await sql`
        DELETE FROM dashboard_members
        WHERE dashboard_id = ${dashboardId} AND user_id = ${userId}
      `;

      const remainingMembers = await sql`
        SELECT COUNT(*)::int AS count
        FROM dashboard_members
        WHERE dashboard_id = ${dashboardId}
      `;

      if ((remainingMembers.rows[0]?.count || 0) === 0) {
        await sql`
          DELETE FROM dashboards
          WHERE id = ${dashboardId}
        `;
      } else if (membership.role === 'owner') {
        await sql`
          UPDATE dashboard_members
          SET role = 'owner'
          WHERE dashboard_id = ${dashboardId}
            AND user_id = (
              SELECT user_id
              FROM dashboard_members
              WHERE dashboard_id = ${dashboardId}
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
