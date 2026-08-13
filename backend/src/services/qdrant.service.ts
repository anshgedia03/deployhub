import { QdrantClient } from '@qdrant/js-client-rest';
import { HfInference } from '@huggingface/inference';
import { env, Logger } from '@deployhub/shared';

const QDRANT_COLLECTION_NAME = 'deployhub_knowledge';
const EMBEDDING_MODEL = 'BAAI/bge-small-en-v1.5';
const VECTOR_SIZE = 384;

// Initialize Qdrant Client
const qdrantClient = new QdrantClient({
  url: env.QDRANT_URL || 'http://localhost:6333',
});

// Initialize Hugging Face Client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || env.HUGGINGFACE_API_KEY || '');

/**
 * Initialize Qdrant collection for DeployHub Knowledge Base
 */
export const initQdrantCollection = async (): Promise<void> => {
  try {
    const result = await qdrantClient.getCollections();
    const exists = result.collections.some((c) => c.name === QDRANT_COLLECTION_NAME);

    if (!exists) {
      Logger.info('Qdrant', `Creating collection "${QDRANT_COLLECTION_NAME}"...`);
      await qdrantClient.createCollection(QDRANT_COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });
      Logger.info('Qdrant', `Collection "${QDRANT_COLLECTION_NAME}" created successfully.`);
    } else {
      Logger.info('Qdrant', `Collection "${QDRANT_COLLECTION_NAME}" is ready.`);
    }
  } catch (error: any) {
    Logger.error('Qdrant', 'Failed to initialize Qdrant collection:', error?.message || error);
  }
};

/**
 * Generate embedding vector using Hugging Face Inference API
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const hfApiKey = process.env.HUGGINGFACE_API_KEY || env.HUGGINGFACE_API_KEY;

  if (hfApiKey) {
    try {
      const output = await hf.featureExtraction({
        model: EMBEDDING_MODEL,
        inputs: text,
      });

      if (output && Array.isArray(output) && output.length > 0) {
        if (typeof output[0] === 'number') {
          return output as number[];
        } else if (Array.isArray(output[0]) && output[0].length > 0 && typeof output[0][0] === 'number') {
          const rows = output as number[][];
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
    } catch (err: any) {
      Logger.warn('Qdrant', `HuggingFace API embedding call failed: ${err?.message || err}. Using deterministic fallback vector.`);
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
export const upsertDocumentChunk = async (
  id: string | number,
  title: string,
  content: string,
  organizationId: string,
  type: 'log' | 'project_metadata' | 'doc' | 'system' = 'doc',
  deploymentId?: string
): Promise<void> => {
  try {
    const vector = await generateEmbedding(`${title}\n${content}`);

    const payload: QdrantChunkPayload = {
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
          payload: payload as unknown as Record<string, any>,
        },
      ],
    });
    Logger.info('Qdrant', `Upserted chunk "${title}" into Qdrant for org ${organizationId}`);
  } catch (error: any) {
    Logger.error('Qdrant', 'Error upserting document into Qdrant:', error?.message || error);
  }
};

/**
 * Search relevant chunks from Qdrant filtered strictly by organizationId
 */
export const searchVectorKnowledge = async (
  query: string,
  organizationId: string,
  limit: number = 4
): Promise<Array<{ title: string; content: string; score: number; type: string }>> => {
  try {
    const queryVector = await generateEmbedding(query);

    // In @qdrant/js-client-rest, search or query API retrieves matching points
    const searchResults = await (qdrantClient as any).query(QDRANT_COLLECTION_NAME, {
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

    return points.map((hit: any) => ({
      title: (hit.payload?.title as string) || 'Document',
      content: (hit.payload?.content as string) || '',
      score: hit.score || 0.9,
      type: (hit.payload?.type as string) || 'doc',
    }));
  } catch (error: any) {
    Logger.error('Qdrant', 'Error querying Qdrant:', error?.message || error);
    return [];
  }
};
