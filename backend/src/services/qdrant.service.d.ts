/**
 * Initialize Qdrant collection for DeployHub Knowledge Base
 */
export declare const initQdrantCollection: () => Promise<void>;
/**
 * Generate embedding vector using Hugging Face Inference API
 */
export declare const generateEmbedding: (text: string) => Promise<number[]>;
export interface QdrantChunkPayload {
    organizationId: string;
    deploymentId?: string | null;
    type: 'log' | 'project_metadata' | 'doc' | 'system';
    title: string;
    content: string;
    createdAt: string;
}
/**
 * Store a chunk/document in Qdrant with tenant payload filtering
 */
export declare const upsertDocumentChunk: (id: string | number, title: string, content: string, organizationId: string, type?: "log" | "project_metadata" | "doc" | "system", deploymentId?: string) => Promise<void>;
/**
 * Search relevant chunks from Qdrant filtered strictly by organizationId
 */
export declare const searchVectorKnowledge: (query: string, organizationId: string, limit?: number) => Promise<Array<{
    title: string;
    content: string;
    score: number;
    type: string;
}>>;
//# sourceMappingURL=qdrant.service.d.ts.map