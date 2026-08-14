"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChatSession = exports.saveChatMessage = exports.getChatMessages = exports.listChatSessions = exports.createChatSession = exports.initNeonDatabase = exports.getNeonPool = void 0;
const pg_1 = require("pg");
const shared_1 = require("@deployhub/shared");
const crypto_1 = __importDefault(require("crypto"));
let pool = null;
const getNeonPool = () => {
    const connectionString = process.env.NEON_DATABASE_URL || shared_1.env.NEON_DATABASE_URL;
    if (!connectionString) {
        return null;
    }
    if (!pool) {
        pool = new pg_1.Pool({
            connectionString,
            ssl: {
                rejectUnauthorized: false,
            },
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });
        pool.on('error', (err) => {
            shared_1.Logger.error('NeonPostgres', 'Unexpected error on idle Neon PostgreSQL client:', err);
        });
    }
    return pool;
};
exports.getNeonPool = getNeonPool;
/**
 * Initialize Neon PostgreSQL Tables for AI Chat Persistence
 */
const initNeonDatabase = async () => {
    const p = (0, exports.getNeonPool)();
    if (!p) {
        shared_1.Logger.warn('NeonPostgres', 'NEON_DATABASE_URL not configured. Chat history persistence is in memory/fallback mode.');
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
            shared_1.Logger.info('NeonPostgres', 'Neon PostgreSQL chat tables initialized successfully.');
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        shared_1.Logger.error('NeonPostgres', 'Failed to initialize Neon PostgreSQL database:', err?.message || err);
    }
};
exports.initNeonDatabase = initNeonDatabase;
/**
 * Create a new Chat Session in Neon PostgreSQL
 */
const createChatSession = async (userId, organizationId, title) => {
    const sessionId = `session_${crypto_1.default.randomUUID()}`;
    const p = (0, exports.getNeonPool)();
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
exports.createChatSession = createChatSession;
/**
 * List all Chat Sessions for a user & organization
 */
const listChatSessions = async (userId, organizationId) => {
    const p = (0, exports.getNeonPool)();
    if (!p)
        return [];
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
exports.listChatSessions = listChatSessions;
/**
 * Get all messages for a specific Chat Session
 */
const getChatMessages = async (sessionId) => {
    const p = (0, exports.getNeonPool)();
    if (!p)
        return [];
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
exports.getChatMessages = getChatMessages;
/**
 * Save a message to an existing Chat Session
 */
const saveChatMessage = async (sessionId, sender, text, toolSteps) => {
    const p = (0, exports.getNeonPool)();
    if (!p || !sessionId)
        return;
    const msgId = `msg_${crypto_1.default.randomUUID()}`;
    try {
        await p.query(`
      INSERT INTO chat_messages (id, session_id, sender, text, tool_steps)
      VALUES ($1, $2, $3, $4, $5);
      `, [msgId, sessionId, sender, text, toolSteps ? JSON.stringify(toolSteps) : null]);
        // Update session timestamp
        await p.query(`
      UPDATE chat_sessions
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
      `, [sessionId]);
    }
    catch (err) {
        shared_1.Logger.error('NeonPostgres', 'Failed to save chat message to Neon:', err?.message || err);
    }
};
exports.saveChatMessage = saveChatMessage;
/**
 * Delete a Chat Session and cascaded messages
 */
const deleteChatSession = async (sessionId, organizationId) => {
    const p = (0, exports.getNeonPool)();
    if (!p)
        return true;
    const query = `
    DELETE FROM chat_sessions
    WHERE id = $1 AND organization_id = $2;
  `;
    const res = await p.query(query, [sessionId, organizationId]);
    return (res.rowCount ?? 0) > 0;
};
exports.deleteChatSession = deleteChatSession;
//# sourceMappingURL=neon.service.js.map