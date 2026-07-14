import { z } from 'zod'

const envSchema = z.object({
  PORT: z
    .string()
    .default('3001')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(65535)),
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  DATABASE_URL: z
    .string()
    .url()
    .refine((url) => url.startsWith('postgresql://') || url.startsWith('postgres://'), {
      message: 'DATABASE_URL must be a valid PostgreSQL connection string',
    })
    .optional(),
  CORS_ORIGINS: z.string().default(''),
  INTERNAL_DEBUG_TOKEN: z.string().min(32).optional(),
  APP_PUBLIC_URL: z.string().url().default('https://juanmaes83.github.io/escaparates-pro/'),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

// process.exit(1) above guarantees we never reach here with a failed parse,
// but TypeScript cannot narrow through process.exit, so we assert the type.
export const env = parsed.data as z.infer<typeof envSchema>
