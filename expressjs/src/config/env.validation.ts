import { z } from 'zod';

const envSchema = z.object({
  SERVER_PORT: z.string().transform((val) => parseInt(val, 10)).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  HOST: z.string().default('0.0.0.0'),

  // Database Configuration
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DATABASE_URL: z.string().url(),

  // Authentication & Security
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),

  // Google OAuth Configuration (optional if not always used)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  CALL_BACK_URL: z.string().url().optional(),

  // CORS Configuration
  ALLOWED_ORIGINS: z.string().transform((val) => val.split(',')),
  ALLOWED_METHODS: z.string().transform((val) => val.split(',')),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}
