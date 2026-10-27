import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>): Env => envSchema.parse(config);
