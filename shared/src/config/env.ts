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
  MONGODB_URI: z.string().default('mongodb://localhost:27017/deployx'),
  PUBLIC_HOST: z.string().default('http://52.66.235.124'),
});

export const env = envSchema.parse(process.env);
