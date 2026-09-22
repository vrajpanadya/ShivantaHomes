import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().optional().or(z.literal('')),
  JWT_SECRET: z.string().min(8).default('dev-only-insecure-jwt-secret-change-in-prod'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().or(z.literal('')),
  CLOUDINARY_API_KEY: z.string().optional().or(z.literal('')),
  CLOUDINARY_API_SECRET: z.string().optional().or(z.literal('')),
  ADMIN_EMAIL: z.string().default('admin@shivantahomes.com'),
  ADMIN_PASSWORD: z.string().default('Shivanta@123'),
  ADMIN_NAME: z.string().default('Site Administrator'),
  EMAIL_FROM: z.string().optional().or(z.literal('')),
  RESEND_API_KEY: z.string().optional().or(z.literal('')),
  WHATSAPP_NUMBER: z.string().default('919104717214'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

if (env.NODE_ENV === 'production') {
  const issues: string[] = [];
  if (!env.MONGODB_URI) issues.push('MONGODB_URI');
  if (env.JWT_SECRET === 'dev-only-insecure-jwt-secret-change-in-prod') issues.push('JWT_SECRET');
  if (issues.length) {
    console.warn(`⚠️  Production warning: set real values for ${issues.join(', ')} (dev fallbacks in use).`);
  }
}

export const isProduction = env.NODE_ENV === 'production';
