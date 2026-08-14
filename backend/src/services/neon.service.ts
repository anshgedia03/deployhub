import { Pool } from 'pg';
import { env, Logger } from '@deployhub/shared';
import crypto from 'crypto';

let pool: Pool | null = null;

export const getNeonPool = (): Pool | null => {
  const connectionString = process.env.NEON_DATABASE_URL || (env as any).NEON_DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      Logger.error('NeonPostgres', 'Unexpected error on idle Neon PostgreSQL client:', err);
    });
  }

  return pool;
};

/**
 * Initialize Neon PostgreSQL Tables for AI Chat Persistence
 */
export const initNeonDatabase = async (): Promise<void> => {
  const p = getNeonPool();
  if (!p) {
    Logger.warn('NeonPostgres', 'NEON_DATABASE_URL not configured. Chat history persistence is in memory/fallback mode.');
    return;
  }

  try {
    const client = await p.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          organization_id VARCHAR(64) NOT NULL,
          title VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
          id VARCHAR(64) PRIMARY KEY,
          session_id VARCHAR(64) REFERENCES chat_sessions(id) ON DELETE CASCADE,
          sender VARCHAR(16) NOT NULL,
          text TEXT NOT NULL,
          tool_steps JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_chat_sessions_org ON chat_sessions(organization_id, user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
      `);

      Logger.info('NeonPostgres', 'Neon PostgreSQL chat tables initialized successfully.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    Logger.error('NeonPostgres', 'Failed to initialize Neon PostgreSQL database:', err?.message || err);
  }
};

/**
 * Create a new Chat Session in Neon PostgreSQL
 */
export const createChatSession = async (
  userId: string,
  organizationId: string,
  title: string
): Promise<{ id: string; userId: string; organizationId: string; title: string; createdAt: string }> => {
  const sessionId = `session_${crypto.randomUUID()}`;
  const p = getNeonPool();

  if (!p) {
    return {
      id: sessionId,
      userId,
      organizationId,
      title,
      createdAt: new Date().toISOString(),
    };
  }

  const query = `
    INSERT INTO chat_sessions (id, user_id, organization_id, title)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, organization_id, title, created_at;
  `;

  const res = await p.query(query, [sessionId, userId, organizationId, title.trim()]);
  const row = res.rows[0];

  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    title: row.title,
    createdAt: row.created_at,
  };
};

/**
 * List all Chat Sessions for a user & organization
 */
export const listChatSessions = async (
  userId: string,
  organizationId: string
): Promise<Array<{ id: string; title: string; createdAt: string; updatedAt: string }>> => {
  const p = getNeonPool();
  if (!p) return [];

  const query = `
    SELECT id, title, created_at, updated_at
    FROM chat_sessions
    WHERE organization_id = $1 OR user_id = $2
    ORDER BY updated_at DESC;
  `;

  const res = await p.query(query, [organizationId, userId]);
  return res.rows.map(r => ({
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
};

/**
 * Get all messages for a specific Chat Session
 */
export const getChatMessages = async (
  sessionId: string
): Promise<Array<{ id: string; sender: 'user' | 'ai'; text: string; toolSteps?: any; createdAt: string }>> => {
  const p = getNeonPool();
  if (!p) return [];

  const query = `
    SELECT id, sender, text, tool_steps, created_at
    FROM chat_messages
    WHERE session_id = $1
    ORDER BY created_at ASC;
  `;

  const res = await p.query(query, [sessionId]);
  return res.rows.map(r => ({
    id: r.id,
    sender: r.sender,
    text: r.text,
    toolSteps: r.tool_steps,
    createdAt: r.created_at,
  }));
};

/**
 * Save a message to an existing Chat Session
 */
export const saveChatMessage = async (
  sessionId: string,
  sender: 'user' | 'ai',
  text: string,
  toolSteps?: any
): Promise<void> => {
  const p = getNeonPool();
  if (!p || !sessionId) return;

  const msgId = `msg_${crypto.randomUUID()}`;

  try {
    await p.query(
      `
      INSERT INTO chat_messages (id, session_id, sender, text, tool_steps)
      VALUES ($1, $2, $3, $4, $5);
      `,
      [msgId, sessionId, sender, text, toolSteps ? JSON.stringify(toolSteps) : null]
    );

    // Update session timestamp
    await p.query(
      `
      UPDATE chat_sessions
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
      `,
      [sessionId]
    );
  } catch (err: any) {
    Logger.error('NeonPostgres', 'Failed to save chat message to Neon:', err?.message || err);
  }
};

/**
 * Delete a Chat Session and cascaded messages
 */
export const deleteChatSession = async (
  sessionId: string,
  organizationId: string
): Promise<boolean> => {
  const p = getNeonPool();
  if (!p) return true;

  const query = `
    DELETE FROM chat_sessions
    WHERE id = $1 AND organization_id = $2;
  `;

  const res = await p.query(query, [sessionId, organizationId]);
  return (res.rowCount ?? 0) > 0;
};
