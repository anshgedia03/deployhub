"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchVectorKnowledge = exports.upsertDocumentChunk = exports.generateEmbedding = exports.initQdrantCollection = void 0;
const js_client_rest_1 = require("@qdrant/js-client-rest");
const inference_1 = require("@huggingface/inference");
const shared_1 = require("@deployhub/shared");
const QDRANT_COLLECTION_NAME = 'deployhub_knowledge';
const EMBEDDING_MODEL = 'BAAI/bge-small-en-v1.5';
const VECTOR_SIZE = 384;
// Initialize Qdrant Client
const qdrantClient = new js_client_rest_1.QdrantClient({
    url: shared_1.env.QDRANT_URL || 'http://localhost:6333',
});
// Initialize Hugging Face Client
const hf = new inference_1.HfInference(process.env.HUGGINGFACE_API_KEY || shared_1.env.HUGGINGFACE_API_KEY || '');
/**
 * Initialize Qdrant collection for DeployHub Knowledge Base
 */
const initQdrantCollection = async () => {
    try {
        const result = await qdrantClient.getCollections();
        const exists = result.collections.some((c) => c.name === QDRANT_COLLECTION_NAME);
        if (!exists) {
            shared_1.Logger.info('Qdrant', `Creating collection "${QDRANT_COLLECTION_NAME}"...`);
            await qdrantClient.createCollection(QDRANT_COLLECTION_NAME, {
                vectors: {
                    size: VECTOR_SIZE,
                    distance: 'Cosine',
                },
            });
            shared_1.Logger.info('Qdrant', `Collection "${QDRANT_COLLECTION_NAME}" created successfully.`);
        }
        else {
            shared_1.Logger.info('Qdrant', `Collection "${QDRANT_COLLECTION_NAME}" is ready.`);
        }
    }
    catch (error) {
        shared_1.Logger.error('Qdrant', 'Failed to initialize Qdrant collection:', error?.message || error);
    }
};
exports.initQdrantCollection = initQdrantCollection;
/**
 * Generate embedding vector using Hugging Face Inference API
 */
const generateEmbedding = async (text) => {
    const hfApiKey = process.env.HUGGINGFACE_API_KEY || shared_1.env.HUGGINGFACE_API_KEY;
    if (hfApiKey) {
        try {
            const output = await hf.featureExtraction({
                model: EMBEDDING_MODEL,
                inputs: text,
            });
            if (output && Array.isArray(output) && output.length > 0) {
                if (typeof output[0] === 'number') {
                    return output;
                }
                else if (Array.isArray(output[0]) && output[0].length > 0 && typeof output[0][0] === 'number') {
                    const rows = output;
                    const firstRow = rows[0];
                    if (firstRow) {
                        const len = firstRow.length;
                        const avg = new Array(len).fill(0);
                        for (const row of rows) {
                            for (let i = 0; i < len; i++) {
                                avg[i] += row[i];
                            }
                        }
                        return avg.map((v) => v / rows.length);
                    }
                }
            }
        }
        catch (err) {
            shared_1.Logger.warn('Qdrant', `HuggingFace API embedding call failed: ${err?.message || err}. Using deterministic fallback vector.`);
        }
    }
    // Fallback vector generation (384 dimensions)
    const vector = new Array(VECTOR_SIZE).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    for (let i = 0; i < VECTOR_SIZE; i++) {
        vector[i] = Math.sin(hash + i) * 0.5 + 0.5;
    }
    return vector;
};
exports.generateEmbedding = generateEmbedding;
/**
 * Store a chunk/document in Qdrant with tenant payload filtering
 */
const upsertDocumentChunk = async (id, title, content, organizationId, type = 'doc', deploymentId) => {
    try {
        const vector = await (0, exports.generateEmbedding)(`${title}\n${content}`);
        const payload = {
            organizationId,
            deploymentId: deploymentId || null,
            type,
            title,
            content,
            createdAt: new Date().toISOString(),
        };
        const pointId = typeof id === 'number' ? id : (typeof id === 'string' && id.includes('-') ? id : Math.floor(Math.random() * 100000000));
        await qdrantClient.upsert(QDRANT_COLLECTION_NAME, {
            wait: true,
            points: [
                {
                    id: pointId,
                    vector,
                    payload: payload,
                },
            ],
        });
        shared_1.Logger.info('Qdrant', `Upserted chunk "${title}" into Qdrant for org ${organizationId}`);
    }
    catch (error) {
        shared_1.Logger.error('Qdrant', 'Error upserting document into Qdrant:', error?.message || error);
    }
};
exports.upsertDocumentChunk = upsertDocumentChunk;
/**
 * Search relevant chunks from Qdrant filtered strictly by organizationId
 */
const searchVectorKnowledge = async (query, organizationId, limit = 4) => {
    try {
        const queryVector = await (0, exports.generateEmbedding)(query);
        // In @qdrant/js-client-rest, search or query API retrieves matching points
        const searchResults = await qdrantClient.query(QDRANT_COLLECTION_NAME, {
            query: queryVector,
            limit,
            filter: {
                must: [
                    {
                        key: 'organizationId',
                        match: {
                            value: organizationId,
                        },
                    },
                ],
            },
        });
        const points = searchResults?.points || searchResults || [];
        return points.map((hit) => ({
            title: hit.payload?.title || 'Document',
            content: hit.payload?.content || '',
            score: hit.score || 0.9,
            type: hit.payload?.type || 'doc',
        }));
    }
    catch (error) {
        shared_1.Logger.error('Qdrant', 'Error querying Qdrant:', error?.message || error);
        return [];
    }
};
exports.searchVectorKnowledge = searchVectorKnowledge;
//# sourceMappingURL=qdrant.service.js.map