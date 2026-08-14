import { Response } from 'express';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatGroq } from '@langchain/groq';
import { BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { User, Deployment, env, Logger } from '@deployhub/shared';
import Docker from 'dockerode';
import { searchVectorKnowledge } from './qdrant.service';

const docker = new Docker();

export interface SSEEventData {
  event: 'tool_start' | 'tool_end' | 'thinking' | 'token' | 'done' | 'error';
  data: any;
}

const sendSSE = (res: Response, event: string, data: any) => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

/**
 * Human-readable loader messages mapped carefully to tool names
 */
const TOOL_LOADER_MAP: Record<string, string> = {
  get_organization_employees: 'Getting organization employees...',
  get_employee_details: 'Fetching employee profile & access...',
  get_user_deployments: 'Getting organization deployments...',
  get_project_details: 'Inspecting project configuration...',
  get_deployment_logs: 'Retrieving deployment logs...',
  get_container_health: 'Checking Docker container health...',
  search_vector_knowledge: 'Searching Qdrant vector database...',
};

/**
 * Build dynamic LangChain tools for a given user & organization context
 */
export const createLangChainTools = (userId: string, organizationId: string, res: Response) => {
  // 1. Get Organization Employees (Strictly Tenant Scoped)
  const getOrganizationEmployeesTool = new DynamicStructuredTool({
    name: 'get_organization_employees',
    description: 'Fetch the complete list and total count of members/employees in this organization (owner + employees).',
    schema: z.object({
      roleFilter: z.string().optional().describe('Optional role filter (e.g. Developer, QA, Member)'),
    }),
    func: async ({ roleFilter }) => {
      sendSSE(res, 'tool_start', {
        toolName: 'get_organization_employees',
        stepTitle: TOOL_LOADER_MAP.get_organization_employees,
        status: 'running',
      });

      try {
        const [orgOwner, employees] = await Promise.all([
          User.findById(organizationId).select('username email accountType role createdAt'),
          User.find({
            organizationId: organizationId,
            accountType: 'employee',
          }).select('username email accountType role createdAt'),
        ]);

        const allMembers: any[] = [];
        if (orgOwner) {
          allMembers.push({
            id: orgOwner._id,
            username: orgOwner.username,
            email: orgOwner.email,
            accountType: orgOwner.accountType,
            role: 'Organization Owner',
            joinedAt: orgOwner.createdAt,
          });
        }

        for (const emp of employees) {
          if (!roleFilter || emp.role?.toLowerCase().includes(roleFilter.toLowerCase())) {
            allMembers.push({
              id: emp._id,
              username: emp.username,
              email: emp.email,
              accountType: emp.accountType,
              role: emp.role || 'Member',
              joinedAt: emp.createdAt,
            });
          }
        }

        const result = {
          totalEmployees: allMembers.length,
          employees: allMembers,
        };

        sendSSE(res, 'tool_end', {
          toolName: 'get_organization_employees',
          stepTitle: TOOL_LOADER_MAP.get_organization_employees,
          status: 'completed',
          resultSummary: `Found ${allMembers.length} members`,
        });

        return JSON.stringify(result);
      } catch (err: any) {
        sendSSE(res, 'tool_end', {
          toolName: 'get_organization_employees',
          stepTitle: TOOL_LOADER_MAP.get_organization_employees,
          status: 'error',
        });
        return JSON.stringify({ error: err?.message || err });
      }
    },
  });

  // 2. Get Employee Details & Project Access
  const getEmployeeDetailsTool = new DynamicStructuredTool({
    name: 'get_employee_details',
    description: 'Lookup an individual employee by username or email and see their profile, role, and assigned project access levels.',
    schema: z.object({
      identifier: z.string().describe('Username or email of the employee to look up'),
    }),
    func: async ({ identifier }) => {
      sendSSE(res, 'tool_start', {
        toolName: 'get_employee_details',
        stepTitle: TOOL_LOADER_MAP.get_employee_details,
        status: 'running',
      });

      try {
        const regex = new RegExp(`^${identifier.trim()}$`, 'i');
        const user = await User.findOne({
          $and: [
            { $or: [{ organizationId: organizationId }, { _id: organizationId }] },
            { $or: [{ username: regex }, { email: regex }] }
          ]
        }).select('username email accountType role accessLevel createdAt');

        if (!user) {
          sendSSE(res, 'tool_end', {
            toolName: 'get_employee_details',
            stepTitle: TOOL_LOADER_MAP.get_employee_details,
            status: 'completed',
            resultSummary: `Employee not found: ${identifier}`,
          });
          return JSON.stringify({ found: false, message: `No employee matching '${identifier}' in this organization.` });
        }

        // Check project access for this employee
        const isOwner = user.accountType === 'organization';
        const projects = await Deployment.find({
          $or: [{ organizationId }, { userId: organizationId }]
        }).select('projectName status accessControl');

        const projectAccess = projects.map(p => {
          if (isOwner) {
            return { projectName: p.projectName, status: p.status, accessLevel: 'full (owner)' };
          }
          const userAccess = p.accessControl?.find((ac: any) => ac.employeeId?.toString() === user._id.toString());
          return {
            projectName: p.projectName,
            status: p.status,
            accessLevel: userAccess ? userAccess.accessLevel : 'none',
          };
        });

        const result = {
          found: true,
          employee: {
            id: user._id,
            username: user.username,
            email: user.email,
            accountType: user.accountType,
            role: user.role || 'Member',
            defaultAccess: user.accessLevel,
            joinedAt: user.createdAt,
          },
          projectAccess,
        };

        sendSSE(res, 'tool_end', {
          toolName: 'get_employee_details',
          stepTitle: TOOL_LOADER_MAP.get_employee_details,
          status: 'completed',
          resultSummary: `Found details for ${user.username}`,
        });

        return JSON.stringify(result);
      } catch (err: any) {
        sendSSE(res, 'tool_end', {
          toolName: 'get_employee_details',
          stepTitle: TOOL_LOADER_MAP.get_employee_details,
          status: 'error',
        });
        return JSON.stringify({ error: err?.message || err });
      }
    },
  });

  // 3. Get User / Organization Deployments
  const getUserDeploymentsTool = new DynamicStructuredTool({
    name: 'get_user_deployments',
    description: 'Fetch total deployments, project status (running/building/stopped/failed), public URLs, and ports for this organization.',
    schema: z.object({
      statusFilter: z.enum(['running', 'building', 'stopped', 'failed', 'all']).optional().describe('Filter by deployment status'),
      searchFilter: z.string().optional().describe('Filter by project name'),
    }),
    func: async ({ statusFilter, searchFilter }) => {
      sendSSE(res, 'tool_start', {
        toolName: 'get_user_deployments',
        stepTitle: TOOL_LOADER_MAP.get_user_deployments,
        status: 'running',
      });

      try {
        const query: any = {
          $or: [{ organizationId }, { userId: organizationId }]
        };

        if (statusFilter && statusFilter !== 'all') {
          query.status = statusFilter;
        }

        if (searchFilter) {
          query.projectName = { $regex: searchFilter, $options: 'i' };
        }

        const deployments = await Deployment.find(query).sort({ createdAt: -1 });

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
      } catch (err: any) {
        sendSSE(res, 'tool_end', {
          toolName: 'get_user_deployments',
          stepTitle: TOOL_LOADER_MAP.get_user_deployments,
          status: 'error',
        });
        return JSON.stringify({ error: err?.message || err });
      }
    },
  });

  // 4. Get Specific Project Details
  const getProjectDetailsTool = new DynamicStructuredTool({
    name: 'get_project_details',
    description: 'Get deep details about a specific project: git repository, branch, port, public URL, status, and which employees have access.',
    schema: z.object({
      projectNameOrId: z.string().describe('Project name or deployment ID to inspect'),
    }),
    func: async ({ projectNameOrId }) => {
      sendSSE(res, 'tool_start', {
        toolName: 'get_project_details',
        stepTitle: TOOL_LOADER_MAP.get_project_details,
        status: 'running',
      });

      try {
        const deployment = await Deployment.findOne({
          $and: [
            { $or: [{ organizationId }, { userId: organizationId }] },
            {
              $or: [
                { projectName: { $regex: `^${projectNameOrId.trim()}$`, $options: 'i' } },
                { deploymentId: projectNameOrId.trim() }
              ]
            }
          ]
        });

        if (!deployment) {
          sendSSE(res, 'tool_end', {
            toolName: 'get_project_details',
            stepTitle: TOOL_LOADER_MAP.get_project_details,
            status: 'completed',
            resultSummary: `Project not found: ${projectNameOrId}`,
          });
          return JSON.stringify({ found: false, message: `Project '${projectNameOrId}' not found.` });
        }

        // Populate employee names in accessControl
        const employeeIds = deployment.accessControl?.map((ac: any) => ac.employeeId) || [];
        const employees = await User.find({ _id: { $in: employeeIds } }).select('username email role');

        const permissions = deployment.accessControl?.map((ac: any) => {
          const emp = employees.find(e => e._id.toString() === ac.employeeId?.toString());
          return {
            employeeId: ac.employeeId,
            username: emp ? emp.username : 'Unknown',
            email: emp ? emp.email : 'Unknown',
            accessLevel: ac.accessLevel,
          };
        }) || [];

        const result = {
          found: true,
          project: {
            deploymentId: deployment.deploymentId,
            projectName: deployment.projectName,
            status: deployment.status,
            containerId: deployment.containerId || 'N/A',
            port: deployment.port,
            publicUrl: deployment.publicUrl,
            gitUrl: deployment.gitUrl,
            branch: deployment.branch,
            createdAt: deployment.createdAt,
            assignedEmployees: permissions,
          }
        };

        sendSSE(res, 'tool_end', {
          toolName: 'get_project_details',
          stepTitle: TOOL_LOADER_MAP.get_project_details,
          status: 'completed',
          resultSummary: `Inspected project ${deployment.projectName}`,
        });

        return JSON.stringify(result);
      } catch (err: any) {
        sendSSE(res, 'tool_end', {
          toolName: 'get_project_details',
          stepTitle: TOOL_LOADER_MAP.get_project_details,
          status: 'error',
        });
        return JSON.stringify({ error: err?.message || err });
      }
    },
  });

  // 5. Get Deployment Logs
  const getDeploymentLogsTool = new DynamicStructuredTool({
    name: 'get_deployment_logs',
    description: 'Retrieve recent build or runtime container logs for a project to troubleshoot build failures, crashes, or status.',
    schema: z.object({
      projectNameOrId: z.string().describe('Project name or deployment ID to get logs for'),
    }),
    func: async ({ projectNameOrId }) => {
      sendSSE(res, 'tool_start', {
        toolName: 'get_deployment_logs',
        stepTitle: TOOL_LOADER_MAP.get_deployment_logs,
        status: 'running',
      });

      try {
        const deployment = await Deployment.findOne({
          $and: [
            { $or: [{ organizationId }, { userId: organizationId }] },
            {
              $or: [
                { projectName: { $regex: `^${projectNameOrId.trim()}$`, $options: 'i' } },
                { deploymentId: projectNameOrId.trim() }
              ]
            }
          ]
        });

        if (!deployment) {
          sendSSE(res, 'tool_end', {
            toolName: 'get_deployment_logs',
            stepTitle: TOOL_LOADER_MAP.get_deployment_logs,
            status: 'completed',
            resultSummary: `Project not found: ${projectNameOrId}`,
          });
          return JSON.stringify({ found: false, message: `Project '${projectNameOrId}' not found.` });
        }

        let containerLogs = '';
        if (deployment.containerId) {
          try {
            const container = docker.getContainer(deployment.containerId);
            const rawLogs = await container.logs({
              stdout: true,
              stderr: true,
              tail: 50,
              timestamps: true,
            });
            containerLogs = rawLogs.toString('utf-8');
          } catch (e: any) {
            containerLogs = `Could not fetch live container logs: ${e?.message || e}`;
          }
        } else {
          containerLogs = `No active Docker container registered. Project status is '${deployment.status}'.`;
        }

        const result = {
          projectName: deployment.projectName,
          status: deployment.status,
          port: deployment.port,
          logs: containerLogs.slice(-2500),
        };

        sendSSE(res, 'tool_end', {
          toolName: 'get_deployment_logs',
          stepTitle: TOOL_LOADER_MAP.get_deployment_logs,
          status: 'completed',
          resultSummary: `Retrieved logs for ${deployment.projectName}`,
        });

        return JSON.stringify(result);
      } catch (err: any) {
        sendSSE(res, 'tool_end', {
          toolName: 'get_deployment_logs',
          stepTitle: TOOL_LOADER_MAP.get_deployment_logs,
          status: 'error',
        });
        return JSON.stringify({ error: err?.message || err });
      }
    },
  });

  // 6. Get Docker Container Health
  const getContainerHealthTool = new DynamicStructuredTool({
    name: 'get_container_health',
    description: 'Inspect live Docker containers on the host machine to check running state, container IDs, ports, and health.',
    schema: z.object({
      containerName: z.string().optional().describe('Optional container name filter'),
    }),
    func: async ({ containerName }) => {
      sendSSE(res, 'tool_start', {
        toolName: 'get_container_health',
        stepTitle: TOOL_LOADER_MAP.get_container_health,
        status: 'running',
      });

      try {
        const containers = await docker.listContainers({ all: true });
        const filtered = containers.filter(c => {
          if (!containerName) return true;
          return c.Names.some(name => name.toLowerCase().includes(containerName.toLowerCase()));
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
      } catch (err: any) {
        sendSSE(res, 'tool_end', {
          toolName: 'get_container_health',
          stepTitle: TOOL_LOADER_MAP.get_container_health,
          status: 'error',
        });
        return JSON.stringify({ error: err?.message || err });
      }
    },
  });

  // 7. Search Vector Knowledge (Qdrant RAG)
  const searchVectorKnowledgeTool = new DynamicStructuredTool({
    name: 'search_vector_knowledge',
    description: 'Perform RAG vector search in Qdrant database to retrieve relevant build log chunks, system docs, and project deployment histories.',
    schema: z.object({
      searchQuery: z.string().describe('Semantic query string to match in Qdrant vector index'),
    }),
    func: async ({ searchQuery }) => {
      sendSSE(res, 'tool_start', {
        toolName: 'search_vector_knowledge',
        stepTitle: TOOL_LOADER_MAP.search_vector_knowledge,
        status: 'running',
      });

      try {
        const chunks = await searchVectorKnowledge(searchQuery, organizationId, 4);

        sendSSE(res, 'tool_end', {
          toolName: 'search_vector_knowledge',
          stepTitle: TOOL_LOADER_MAP.search_vector_knowledge,
          status: 'completed',
          resultSummary: `Retrieved ${chunks.length} relevant vector chunks`,
        });

        return JSON.stringify(chunks);
      } catch (err: any) {
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
    getEmployeeDetailsTool,
    getUserDeploymentsTool,
    getProjectDetailsTool,
    getDeploymentLogsTool,
    getContainerHealthTool,
    searchVectorKnowledgeTool,
  ];
};

/**
 * Execute AI Agent Prompt with Groq LLM & LangChain Tools
 */
export const processAIQuery = async (
  query: string,
  userId: string,
  organizationId: string,
  res: Response
): Promise<void> => {
  const apiKey = process.env.GROQ_API_KEY || (env as any).GROQ_API_KEY;

  const tools = createLangChainTools(userId, organizationId, res);

  // Fallback intelligent local tool execution if Groq Key is not provided
  if (!apiKey) {
    Logger.warn('AI', 'GROQ_API_KEY missing. Executing intelligent local tool matching agent...');

    const lowerQuery = query.toLowerCase();

    // Specific employee lookup in fallback mode
    if (lowerQuery.includes('who is') || lowerQuery.includes('detail of') || lowerQuery.includes('details of') || lowerQuery.includes('access of')) {
      const words = query.split(/\s+/);
      const identifier = words[words.length - 1]?.replace(/[^a-zA-Z0-9@._-]/g, '') || '';
      const empDetailsTool = tools.find(t => t.name === 'get_employee_details')!;
      const empDetailsStr = await empDetailsTool.invoke({ identifier });
      const empDetails = JSON.parse(empDetailsStr);

      sendSSE(res, 'thinking', { stepTitle: 'Finalizing employee profile...' });

      if (empDetails.found) {
        let reply = `Employee Profile:\n` +
          `• Username: ${empDetails.employee.username}\n` +
          `• Email: ${empDetails.employee.email}\n` +
          `• Role: ${empDetails.employee.role}\n` +
          `• Account Type: ${empDetails.employee.accountType}\n\n` +
          `Project Permissions:\n`;
        reply += empDetails.projectAccess.map((p: any) => `• ${p.projectName} (Status: ${p.status}) - Access: ${p.accessLevel}`).join('\n');
        sendSSE(res, 'token', reply);
      } else {
        sendSSE(res, 'token', empDetails.message || `No employee found matching "${identifier}".`);
      }
      sendSSE(res, 'done', { success: true });
      return;
    }

    // Specific project lookup in fallback mode
    if (lowerQuery.includes('project detail') || lowerQuery.includes('about project') || lowerQuery.includes('inspect project')) {
      const words = query.split(/\s+/);
      const projName = words[words.length - 1]?.replace(/[^a-zA-Z0-9_-]/g, '') || '';
      const projTool = tools.find(t => t.name === 'get_project_details')!;
      const projData = JSON.parse(await projTool.invoke({ projectNameOrId: projName }));

      sendSSE(res, 'thinking', { stepTitle: 'Finalizing project overview...' });

      if (projData.found) {
        const p = projData.project;
        let reply = `Project Details: ${p.projectName}\n` +
          `• Status: ${p.status}\n` +
          `• Port: ${p.port || 'N/A'}\n` +
          `• Public URL: ${p.publicUrl || 'N/A'}\n` +
          `• Git Repository: ${p.gitUrl || 'N/A'} (Branch: ${p.branch || 'main'})\n\n` +
          `Assigned Employee Access:\n`;
        if (p.assignedEmployees.length > 0) {
          reply += p.assignedEmployees.map((e: any) => `• ${e.username} (${e.email}) - Access: ${e.accessLevel}`).join('\n');
        } else {
          reply += `• No custom employee access restrictions assigned (Organization owner full access).`;
        }
        sendSSE(res, 'token', reply);
      } else {
        sendSSE(res, 'token', projData.message || `Project "${projName}" not found.`);
      }
      sendSSE(res, 'done', { success: true });
      return;
    }

    // Check for combined multi-tool queries in fallback mode
    const hasEmployeeQuery = lowerQuery.includes('employee') || lowerQuery.includes('user') || lowerQuery.includes('team') || lowerQuery.includes('people') || lowerQuery.includes('organization');
    const hasDeployQuery = lowerQuery.includes('deploy') || lowerQuery.includes('project') || lowerQuery.includes('app');
    const hasContainerQuery = lowerQuery.includes('container') || lowerQuery.includes('docker') || lowerQuery.includes('health') || lowerQuery.includes('running');

    if (hasEmployeeQuery && hasDeployQuery) {
      const empTool = tools.find(t => t.name === 'get_organization_employees')!;
      const depTool = tools.find(t => t.name === 'get_user_deployments')!;

      const empData = JSON.parse(await empTool.invoke({}));
      const depData = JSON.parse(await depTool.invoke({}));

      sendSSE(res, 'thinking', { stepTitle: 'Finalizing combined report...' });

      let reply = `Organization Summary (${empData.totalEmployees} Members, ${depData.totalDeployments} Projects):\n\n`;
      reply += `Employees:\n` + empData.employees.map((e: any, i: number) => `${i + 1}. ${e.username} (${e.email}) - ${e.role || 'Member'}`).join('\n');
      reply += `\n\nProjects & Deployments:\n` + depData.deployments.map((d: any, i: number) => `${i + 1}. ${d.projectName} (Status: ${d.status}, Port: ${d.port || 'N/A'}${d.publicUrl ? `, URL: ${d.publicUrl}` : ''})`).join('\n');

      sendSSE(res, 'token', reply);
      sendSSE(res, 'done', { success: true });
      return;
    }

    if (hasEmployeeQuery) {
      const empTool = tools.find(t => t.name === 'get_organization_employees')!;
      const empData = JSON.parse(await empTool.invoke({}));

      sendSSE(res, 'thinking', { stepTitle: 'Finalizing response...' });

      const reply = `Total Organization Members: ${empData.totalEmployees}\n\n` +
        empData.employees.map((e: any, i: number) => `${i + 1}. ${e.username} (${e.email}) - Role: ${e.role || 'Member'}`).join('\n');

      sendSSE(res, 'token', reply);
      sendSSE(res, 'done', { success: true });
      return;
    }

    if (hasDeployQuery || lowerQuery.includes('status')) {
      const depTool = tools.find(t => t.name === 'get_user_deployments')!;
      const depData = JSON.parse(await depTool.invoke({}));

      sendSSE(res, 'thinking', { stepTitle: 'Finalizing response...' });

      const reply = `Total Deployments: ${depData.totalDeployments}\n\n` +
        depData.deployments.map((d: any, i: number) => `${i + 1}. ${d.projectName} (Status: ${d.status}, Port: ${d.port || 'N/A'}${d.publicUrl ? `, URL: ${d.publicUrl}` : ''})`).join('\n');

      sendSSE(res, 'token', reply);
      sendSSE(res, 'done', { success: true });
      return;
    }

    if (hasContainerQuery) {
      const containerTool = tools.find(t => t.name === 'get_container_health')!;
      const containerData = JSON.parse(await containerTool.invoke({}));

      sendSSE(res, 'thinking', { stepTitle: 'Finalizing response...' });

      const reply = `Total Active Containers: ${containerData.totalContainers}\n\n` +
        containerData.containers.map((c: any, i: number) => `${i + 1}. Container ${c.names[0]?.replace('/', '') || c.id} (Status: ${c.status}, State: ${c.state}, Image: ${c.image})`).join('\n');

      sendSSE(res, 'token', reply);
      sendSSE(res, 'done', { success: true });
      return;
    }

    // Default RAG Qdrant search
    const ragTool = tools.find(t => t.name === 'search_vector_knowledge')!;
    const ragDataStr = await ragTool.invoke({ searchQuery: query });
    const chunks = JSON.parse(ragDataStr);

    sendSSE(res, 'thinking', { stepTitle: 'Finalizing response...' });

    let reply = `Knowledge Search Results:\n\n`;
    if (chunks.length > 0) {
      reply += chunks.map((c: any) => `• ${c.title}:\n  ${c.content}\n`).join('\n');
    } else {
      reply += `No specific build logs or project knowledge chunks matched "${query}". You can ask about organization employees, project details, or container health!`;
    }

    sendSSE(res, 'token', reply);
    sendSSE(res, 'done', { success: true });
    return;
  }

  // Full LangChain Agent with Groq
  try {
    const model = new ChatGroq({
      apiKey,
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
    }).bindTools(tools);

    const messages: BaseMessage[] = [
      new SystemMessage(
        'You are DeployHub AI, an expert cloud infrastructure and DevOps assistant. ' +
        'You have access to specialized tools for organization employees, individual employee details, deployments, project configurations, deployment logs, and container telemetry. ' +
        'When presenting lists of projects, containers, or structured comparisons, format them in clean GitHub Flavored Markdown tables (with columns like Project Name, Status, Port, Public URL). ' +
        'Ensure Status columns use standard uppercase values like RUNNING, FAILED, STOPPED, or BUILDING.'
      ),
      new HumanMessage(query),
    ];

    let response = await model.invoke(messages);

    // Multi-step agent loop (up to 5 tool execution iterations)
    let iterations = 0;
    while (response.tool_calls && response.tool_calls.length > 0 && iterations < 5) {
      iterations++;
      messages.push(response);

      for (const call of response.tool_calls) {
        const targetTool = tools.find((t) => t.name === call.name);
        if (targetTool) {
          try {
            const toolResult = await (targetTool as any).invoke(call.args);
            messages.push(
              new ToolMessage({
                content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
                tool_call_id: call.id || call.name,
              })
            );
          } catch (err: any) {
            messages.push(
              new ToolMessage({
                content: JSON.stringify({ error: err.message || 'Tool execution error' }),
                tool_call_id: call.id || call.name,
              })
            );
          }
        }
      }

      sendSSE(res, 'thinking', { stepTitle: 'Synthesizing report...' });
      response = await model.invoke(messages);
    }

    const contentText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content || '');
    sendSSE(res, 'token', contentText || 'Completed processing your request.');
    sendSSE(res, 'done', { success: true });
  } catch (error: any) {
    Logger.error('AI', 'Error during Groq LLM processing:', error?.message || error);
    sendSSE(res, 'error', { message: error?.message || 'AI query processing failed.' });
  }
};
