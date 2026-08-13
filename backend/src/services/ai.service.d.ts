import { Response } from 'express';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
export interface SSEEventData {
    event: 'tool_start' | 'tool_end' | 'thinking' | 'token' | 'done' | 'error';
    data: any;
}
/**
 * Build dynamic LangChain tools for a given user & organization context
 */
export declare const createLangChainTools: (userId: string, organizationId: string, res: Response) => (DynamicStructuredTool<z.ZodObject<{
    queryPurpose: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    queryPurpose?: string | undefined;
}, {
    queryPurpose?: string | undefined;
}, string, unknown, "get_organization_employees"> | DynamicStructuredTool<z.ZodObject<{
    searchFilter: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    searchFilter?: string | undefined;
}, {
    searchFilter?: string | undefined;
}, string, unknown, "get_user_deployments"> | DynamicStructuredTool<z.ZodObject<{
    projectName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    projectName?: string | undefined;
}, {
    projectName?: string | undefined;
}, string, unknown, "get_container_health"> | DynamicStructuredTool<z.ZodObject<{
    searchQuery: z.ZodString;
}, z.core.$strip>, {
    searchQuery: string;
}, {
    searchQuery: string;
}, string, unknown, "search_vector_knowledge">)[];
/**
 * Execute AI Agent Prompt with Groq LLM & LangChain Tools
 */
export declare const processAIQuery: (query: string, userId: string, organizationId: string, res: Response) => Promise<void>;
//# sourceMappingURL=ai.service.d.ts.map