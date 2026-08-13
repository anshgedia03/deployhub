"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAIQuery = exports.createLangChainTools = void 0;
const tools_1 = require("@langchain/core/tools");
const groq_1 = require("@langchain/groq");
const messages_1 = require("@langchain/core/messages");
const zod_1 = require("zod");
const shared_1 = require("@deployhub/shared");
const dockerode_1 = __importDefault(require("dockerode"));
const qdrant_service_1 = require("./qdrant.service");
const docker = new dockerode_1.default();
const sendSSE = (res, event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};
/**
 * Human-readable loader messages mapped carefully to tool names
 */
const TOOL_LOADER_MAP = {
    get_organization_employees: 'Getting organization employees...',
    get_user_deployments: 'Getting deployments...',
    get_container_health: 'Checking Docker container health...',
    search_vector_knowledge: 'Searching Qdrant vector database...',
};
/**
 * Build dynamic LangChain tools for a given user & organization context
 */
const createLangChainTools = (userId, organizationId, res) => {
    const getOrganizationEmployeesTool = new tools_1.DynamicStructuredTool({
        name: 'get_organization_employees',
        description: 'Fetch list and total count of employees belonging to the organization, including their usernames, emails, and roles.',
        schema: zod_1.z.object({
            queryPurpose: zod_1.z.string().optional().describe('Brief reason for fetching employees'),
        }),
        func: async () => {
            sendSSE(res, 'tool_start', {
                toolName: 'get_organization_employees',
                stepTitle: TOOL_LOADER_MAP.get_organization_employees,
                status: 'running',
            });
            try {
                const employees = await shared_1.User.find({
                    $or: [
                        { organizationId },
                        { _id: organizationId },
                        { accountType: 'employee' }
                    ]
                }).select('username email accountType role createdAt');
                const result = {
                    totalEmployees: employees.length,
                    employees: employees.map(e => ({
                        id: e._id,
                        username: e.username,
                        email: e.email,
                        accountType: e.accountType,
                        role: e.role || 'Member',
                        joinedAt: e.createdAt,
                    }))
                };
                sendSSE(res, 'tool_end', {
                    toolName: 'get_organization_employees',
                    stepTitle: TOOL_LOADER_MAP.get_organization_employees,
                    status: 'completed',
                    resultSummary: `Found ${employees.length} employees`,
                });
                return JSON.stringify(result);
            }
            catch (err) {
                sendSSE(res, 'tool_end', {
                    toolName: 'get_organization_employees',
                    stepTitle: TOOL_LOADER_MAP.get_organization_employees,
                    status: 'error',
                });
                return JSON.stringify({ error: err?.message || err });
            }
        },
    });
    const getUserDeploymentsTool = new tools_1.DynamicStructuredTool({
        name: 'get_user_deployments',
        description: 'Fetch total deployments, project status (running/building/stopped), public URLs, ports, and environment details for this organization.',
        schema: zod_1.z.object({
            searchFilter: zod_1.z.string().optional().describe('Optional filter for project name or status'),
        }),
        func: async ({ searchFilter }) => {
            sendSSE(res, 'tool_start', {
                toolName: 'get_user_deployments',
                stepTitle: TOOL_LOADER_MAP.get_user_deployments,
                status: 'running',
            });
            try {
                let query = {
                    $or: [
                        { organizationId },
                        { userId }
                    ]
                };
                if (searchFilter) {
                    query.projectName = { $regex: searchFilter, $options: 'i' };
                }
                const deployments = await shared_1.Deployment.find(query).sort({ createdAt: -1 });
                const result = {
                    totalDeployments: deployments.length,
                    deployments: deployments.map(d => ({
                        deploymentId: d.deploymentId,
                        projectName: d.projectName,
                        status: d.status,
                        port: d.port,
                        publicUrl: d.publicUrl,
                        gitUrl: d.gitUrl,
                        branch: d.branch,
                        createdAt: d.createdAt,
                    }))
                };
                sendSSE(res, 'tool_end', {
                    toolName: 'get_user_deployments',
                    stepTitle: TOOL_LOADER_MAP.get_user_deployments,
                    status: 'completed',
                    resultSummary: `Found ${deployments.length} deployments`,
                });
                return JSON.stringify(result);
            }
            catch (err) {
                sendSSE(res, 'tool_end', {
                    toolName: 'get_user_deployments',
                    stepTitle: TOOL_LOADER_MAP.get_user_deployments,
                    status: 'error',
                });
                return JSON.stringify({ error: err?.message || err });
            }
        },
    });
    const getContainerHealthTool = new tools_1.DynamicStructuredTool({
        name: 'get_container_health',
        description: 'Inspect live Docker containers on the host machine to check running state, container IDs, ports, and resource health.',
        schema: zod_1.z.object({
            projectName: zod_1.z.string().optional().describe('Optional specific project container name'),
        }),
        func: async ({ projectName }) => {
            sendSSE(res, 'tool_start', {
                toolName: 'get_container_health',
                stepTitle: TOOL_LOADER_MAP.get_container_health,
                status: 'running',
            });
            try {
                const containers = await docker.listContainers({ all: true });
                const filtered = containers.filter(c => {
                    if (!projectName)
                        return true;
                    return c.Names.some(name => name.includes(projectName));
                });
                const result = {
                    totalContainers: filtered.length,
                    containers: filtered.map(c => ({
                        id: c.Id.substring(0, 12),
                        names: c.Names,
                        image: c.Image,
                        state: c.State,
                        status: c.Status,
                        ports: c.Ports,
                    }))
                };
                sendSSE(res, 'tool_end', {
                    toolName: 'get_container_health',
                    stepTitle: TOOL_LOADER_MAP.get_container_health,
                    status: 'completed',
                    resultSummary: `${filtered.length} active containers`,
                });
                return JSON.stringify(result);
            }
            catch (err) {
                sendSSE(res, 'tool_end', {
                    toolName: 'get_container_health',
                    stepTitle: TOOL_LOADER_MAP.get_container_health,
                    status: 'error',
                });
                return JSON.stringify({ error: err?.message || err });
            }
        },
    });
    const searchVectorKnowledgeTool = new tools_1.DynamicStructuredTool({
        name: 'search_vector_knowledge',
        description: 'Perform RAG vector search in Qdrant database to retrieve relevant build log chunks, system docs, and project deployment histories.',
        schema: zod_1.z.object({
            searchQuery: zod_1.z.string().describe('Semantic query string to match in Qdrant vector index'),
        }),
        func: async ({ searchQuery }) => {
            sendSSE(res, 'tool_start', {
                toolName: 'search_vector_knowledge',
                stepTitle: TOOL_LOADER_MAP.search_vector_knowledge,
                status: 'running',
            });
            try {
                const chunks = await (0, qdrant_service_1.searchVectorKnowledge)(searchQuery, organizationId, 4);
                sendSSE(res, 'tool_end', {
                    toolName: 'search_vector_knowledge',
                    stepTitle: TOOL_LOADER_MAP.search_vector_knowledge,
                    status: 'completed',
                    resultSummary: `Retrieved ${chunks.length} relevant vector chunks`,
                });
                return JSON.stringify(chunks);
            }
            catch (err) {
                sendSSE(res, 'tool_end', {
                    toolName: 'search_vector_knowledge',
                    stepTitle: TOOL_LOADER_MAP.search_vector_knowledge,
                    status: 'error',
                });
                return JSON.stringify({ error: err?.message || err });
            }
        },
    });
    return [
        getOrganizationEmployeesTool,
        getUserDeploymentsTool,
        getContainerHealthTool,
        searchVectorKnowledgeTool,
    ];
};
exports.createLangChainTools = createLangChainTools;
/**
 * Execute AI Agent Prompt with Groq LLM & LangChain Tools
 */
const processAIQuery = async (query, userId, organizationId, res) => {
    const apiKey = process.env.GROQ_API_KEY || shared_1.env.GROQ_API_KEY;
    const tools = (0, exports.createLangChainTools)(userId, organizationId, res);
    // Fallback intelligent local tool execution if Groq Key is not provided
    if (!apiKey) {
        shared_1.Logger.warn('AI', 'GROQ_API_KEY missing. Executing intelligent local tool matching agent...');
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('employee') || lowerQuery.includes('user') || lowerQuery.includes('team') || lowerQuery.includes('people') || lowerQuery.includes('organization')) {
            const empTool = tools.find(t => t.name === 'get_organization_employees');
            const empDataStr = await empTool.invoke({});
            const empData = JSON.parse(empDataStr);
            sendSSE(res, 'thinking', { stepTitle: 'Finalizing response...' });
            const reply = `### Organization Employees Summary\n\nYour organization currently has **${empData.totalEmployees}** total member(s):\n\n` +
                empData.employees.map((e) => `- **${e.username}** (\`${e.email}\`) — Role: *${e.role}* (${e.accountType})`).join('\n') +
                `\n\n*Note: Configure \`GROQ_API_KEY\` in environment for advanced multi-tool LLM reasoning.*`;
            sendSSE(res, 'token', reply);
            sendSSE(res, 'done', { success: true });
            return;
        }
        if (lowerQuery.includes('deploy') || lowerQuery.includes('project') || lowerQuery.includes('app') || lowerQuery.includes('status')) {
            const depTool = tools.find(t => t.name === 'get_user_deployments');
            const depDataStr = await depTool.invoke({});
            const depData = JSON.parse(depDataStr);
            sendSSE(res, 'thinking', { stepTitle: 'Finalizing response...' });
            const reply = `### Organization Deployments Summary\n\nYour organization has **${depData.totalDeployments}** project deployment(s):\n\n` +
                depData.deployments.map((d) => `- **${d.projectName}**: Status \`${d.status}\`${d.publicUrl ? ` — [Live App](${d.publicUrl})` : ''} (Port: ${d.port || 'N/A'})`).join('\n') +
                `\n\n*Note: Configure \`GROQ_API_KEY\` in environment for advanced multi-tool LLM reasoning.*`;
            sendSSE(res, 'token', reply);
            sendSSE(res, 'done', { success: true });
            return;
        }
        // Default RAG Qdrant search
        const ragTool = tools.find(t => t.name === 'search_vector_knowledge');
        const ragDataStr = await ragTool.invoke({ searchQuery: query });
        const chunks = JSON.parse(ragDataStr);
        sendSSE(res, 'thinking', { stepTitle: 'Finalizing response...' });
        let reply = `### DeployHub Knowledge Response\n\nBased on vector index search:\n\n`;
        if (chunks.length > 0) {
            reply += chunks.map((c) => `> **${c.title}**\n> ${c.content}\n`).join('\n');
        }
        else {
            reply += `No specific build log or project vector chunks found matching "${query}". You can ask about **total employees**, **active deployments**, or **container health**!`;
        }
        sendSSE(res, 'token', reply);
        sendSSE(res, 'done', { success: true });
        return;
    }
    // Full LangChain Agent with Groq
    try {
        const model = new groq_1.ChatGroq({
            apiKey,
            model: 'openai/gpt-oss-20b',
            temperature: 0.2,
        }).bindTools(tools);
        const messages = [
            new messages_1.SystemMessage('You are DeployHub AI, an expert cloud infrastructure & DevOps AI agent. ' +
                'You have access to tools to query organization employees, project deployments, Docker container health, and Qdrant vector database chunks. ' +
                'Always use appropriate tools when user asks factual questions about employees, deployments, or build logs. ' +
                'Synthesize findings into clean, concise Markdown responses with bold headings, bullet lists, and status indicators.'),
            new messages_1.HumanMessage(query),
        ];
        let response = await model.invoke(messages);
        // If model decides to call tools
        if (response.tool_calls && response.tool_calls.length > 0) {
            messages.push(response);
            for (const call of response.tool_calls) {
                const targetTool = tools.find((t) => t.name === call.name);
                if (targetTool) {
                    const toolResult = await targetTool.invoke(call.args);
                    messages.push(new messages_1.ToolMessage({
                        content: toolResult,
                        tool_call_id: call.id || call.name,
                    }));
                }
            }
            sendSSE(res, 'thinking', { stepTitle: 'Finalizing response...' });
            response = await model.invoke(messages);
        }
        else {
            sendSSE(res, 'thinking', { stepTitle: 'Finalizing response...' });
        }
        const contentText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        sendSSE(res, 'token', contentText);
        sendSSE(res, 'done', { success: true });
    }
    catch (error) {
        shared_1.Logger.error('AI', 'Error during Groq LLM processing:', error?.message || error);
        sendSSE(res, 'error', { message: error?.message || 'AI query processing failed.' });
    }
};
exports.processAIQuery = processAIQuery;
//# sourceMappingURL=ai.service.js.map