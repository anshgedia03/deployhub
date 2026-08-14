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
export declare const createLangChainTools: (userId: string, organizationId: string, res: Response, executedTools?: any[], scopedEntities?: {
    selectedProjects?: string[] | undefined;
    selectedEmployees?: string[] | undefined;
}) => (DynamicStructuredTool<z.ZodObject<{}, z.core.$strip>, Record<string, never>, Record<string, never>, string, unknown, "get_organization_overview"> | DynamicStructuredTool<z.ZodObject<{
    roleFilter: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>, {
    roleFilter?: string | null;
}, {
    roleFilter?: string | null | undefined;
}, string, unknown, "get_organization_employees"> | DynamicStructuredTool<z.ZodObject<{
    identifier: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>, {
    identifier?: string | null;
}, {
    identifier?: string | null | undefined;
}, string, unknown, "get_employee_details"> | DynamicStructuredTool<z.ZodObject<{
    statusFilter: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        all: "all";
        running: "running";
        building: "building";
        stopped: "stopped";
        failed: "failed";
    }>>>;
    searchFilter: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>, {
    statusFilter?: any;
    searchFilter?: string | null;
}, {
    statusFilter?: "all" | "running" | "building" | "stopped" | "failed" | null | undefined;
    searchFilter?: string | null | undefined;
}, string, unknown, "get_user_deployments"> | DynamicStructuredTool<z.ZodObject<{
    projectNameOrId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>, {
    projectNameOrId?: string | null;
}, {
    projectNameOrId?: string | null | undefined;
}, string, unknown, "get_project_details"> | DynamicStructuredTool<z.ZodObject<{}, z.core.$strip>, Record<string, never>, Record<string, never>, string, unknown, "get_project_access_matrix"> | DynamicStructuredTool<z.ZodObject<{
    specificPort: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strip>, {
    specificPort?: number | null;
}, {
    specificPort?: number | null | undefined;
}, string, unknown, "get_port_allocations"> | DynamicStructuredTool<z.ZodObject<{
    projectNameOrId: z.ZodString;
}, z.core.$strip>, {
    projectNameOrId: string;
}, {
    projectNameOrId: string;
}, string, unknown, "analyze_build_failure"> | DynamicStructuredTool<z.ZodObject<{
    projectNameOrId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>, {
    projectNameOrId?: string | null;
}, {
    projectNameOrId?: string | null | undefined;
}, string, unknown, "get_deployment_logs"> | DynamicStructuredTool<z.ZodObject<{
    containerName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>, {
    containerName?: string | null;
}, {
    containerName?: string | null | undefined;
}, string, unknown, "get_container_health"> | DynamicStructuredTool<z.ZodObject<{
    searchQuery: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>, {
    searchQuery?: string | null;
}, {
    searchQuery?: string | null | undefined;
}, string, unknown, "search_vector_knowledge"> | DynamicStructuredTool<z.ZodObject<{
    employeeIdentifier: z.ZodString;
    projectNameOrId: z.ZodString;
    accessLevel: z.ZodEnum<{
        full: "full";
        limited: "limited";
        none: "none";
    }>;
}, z.core.$strip>, {
    employeeIdentifier: string;
    projectNameOrId: string;
    accessLevel: "full" | "limited" | "none";
}, {
    employeeIdentifier: string;
    projectNameOrId: string;
    accessLevel: "full" | "limited" | "none";
}, string, unknown, "update_project_access_level"> | DynamicStructuredTool<z.ZodObject<{
    employeeIdentifier: z.ZodString;
    accessLevel: z.ZodEnum<{
        full: "full";
        limited: "limited";
    }>;
}, z.core.$strip>, {
    employeeIdentifier: string;
    accessLevel: "full" | "limited";
}, {
    employeeIdentifier: string;
    accessLevel: "full" | "limited";
}, string, unknown, "update_employee_org_access"> | DynamicStructuredTool<z.ZodObject<{
    projectNameOrId: z.ZodString;
}, z.core.$strip>, {
    projectNameOrId: string;
}, {
    projectNameOrId: string;
}, string, unknown, "restart_project_container"> | DynamicStructuredTool<z.ZodObject<{
    projectNameOrId: z.ZodString;
}, z.core.$strip>, {
    projectNameOrId: string;
}, {
    projectNameOrId: string;
}, string, unknown, "start_project_container"> | DynamicStructuredTool<z.ZodObject<{
    projectNameOrId: z.ZodString;
}, z.core.$strip>, {
    projectNameOrId: string;
}, {
    projectNameOrId: string;
}, string, unknown, "stop_project_container"> | DynamicStructuredTool<z.ZodObject<{
    projectNameOrId: z.ZodString;
    newGitUrl: z.ZodString;
}, z.core.$strip>, {
    projectNameOrId: string;
    newGitUrl: string;
}, {
    projectNameOrId: string;
    newGitUrl: string;
}, string, unknown, "update_project_git_url">)[];
/**
 * Execute AI Agent Prompt with Groq LLM & LangChain Tools
 */
export declare const processAIQuery: (query: string, userId: string, organizationId: string, res: Response, sessionId?: string, selectedModel?: string, selectedEntities?: Array<{
    id: string;
    type: "project" | "employee";
    title: string;
    subtitle?: string;
    status?: string;
    badge?: string;
}>) => Promise<void>;
//# sourceMappingURL=ai.service.d.ts.map