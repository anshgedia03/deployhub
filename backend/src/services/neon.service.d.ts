import { Pool } from 'pg';
export declare const getNeonPool: () => Pool | null;
/**
 * Initialize Neon PostgreSQL Tables for AI Chat Persistence
 */
export declare const initNeonDatabase: () => Promise<void>;
/**
 * Create a new Chat Session in Neon PostgreSQL
 */
export declare const createChatSession: (userId: string, organizationId: string, title: string) => Promise<{
    id: string;
    userId: string;
    organizationId: string;
    title: string;
    createdAt: string;
}>;
/**
 * List all Chat Sessions for a user & organization
 */
export declare const listChatSessions: (userId: string, organizationId: string) => Promise<Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}>>;
/**
 * Get all messages for a specific Chat Session
 */
export declare const getChatMessages: (sessionId: string) => Promise<Array<{
    id: string;
    sender: "user" | "ai";
    text: string;
    toolSteps?: any;
    createdAt: string;
}>>;
/**
 * Save a message to an existing Chat Session
 */
export declare const saveChatMessage: (sessionId: string, sender: "user" | "ai", text: string, toolSteps?: any) => Promise<void>;
/**
 * Delete a Chat Session and cascaded messages
 */
export declare const deleteChatSession: (sessionId: string, organizationId: string) => Promise<boolean>;
//# sourceMappingURL=neon.service.d.ts.map