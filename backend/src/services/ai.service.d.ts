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
    roleFilter: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    roleFilter?: string | undefined;
}, {
    roleFilter?: string | undefined;
}, string, unknown, "get_organization_employees"> | DynamicStructuredTool<z.ZodObject<{
    identifier: z.ZodString;
}, z.core.$strip>, {
    identifier: string;
}, {
    identifier: string;
}, string, unknown, "get_employee_details"> | DynamicStructuredTool<z.ZodObject<{
    statusFilter: z.ZodOptional<z.ZodEnum<{
        all: "all";
        running: "running";
        building: "building";
        stopped: "stopped";
        failed: "failed";
    }>>;
    searchFilter: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    statusFilter?: "all" | "running" | "building" | "stopped" | "failed" | undefined;
    searchFilter?: string | undefined;
}, {
    statusFilter?: "all" | "running" | "building" | "stopped" | "failed" | undefined;
    searchFilter?: string | undefined;
}, string, unknown, "get_user_deployments"> | DynamicStructuredTool<z.ZodObject<{
    projectNameOrId: z.ZodString;
}, z.core.$strip>, {
    projectNameOrId: string;
}, {
    projectNameOrId: string;
}, string, unknown, "get_project_details"> | DynamicStructuredTool<z.ZodObject<{
    projectNameOrId: z.ZodString;
}, z.core.$strip>, {
    projectNameOrId: string;
}, {
    projectNameOrId: string;
}, string, unknown, "get_deployment_logs"> | DynamicStructuredTool<z.ZodObject<{
    containerName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    containerName?: string | undefined;
}, {
    containerName?: string | undefined;
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
export declare const processAIQuery: (query: string, userId: string, organizationId: string, res: Response, sessionId?: string) => Promise<void>;
//# sourceMappingURL=ai.service.d.ts.map