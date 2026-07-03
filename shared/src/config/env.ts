import { config } from 'dotenv';
import { z } from 'zod';
import path from 'path';

config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  PORT: z.string().default('4000'),
  MAX_UPLOAD_SIZE: z.coerce.number().default(100 * 1024 * 1024), // Default 100MB
  UPLOAD_DIR: z.string().default('uploads'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/deployhub'),
  PUBLIC_HOST: z.string().default('http://35.154.179.113'),
  ENCRYPTION_KEY: z.string().default('c30f40cf2003c2005a81878d65c30fb90731f87a8b6ebc453ef123d456fef093'),
});

export const env = envSchema.parse(process.env);

