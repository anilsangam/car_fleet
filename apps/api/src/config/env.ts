import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/car_rental'),
  SESSION_SECRET: z.string().default('car-rental-production-secure-session-key-2026-supersecret!'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  ADMIN_EMAIL: z.string().email().default('admin@eliteride.com'),
  ADMIN_PASSWORD: z.string().min(6).default('Admin@12345'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables configuration:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

