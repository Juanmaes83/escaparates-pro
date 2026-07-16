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
  STRIPE_PRICE_PRO_YEARLY: z.string().min(1).optional(),
  STRIPE_PRICE_STUDIO_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_STUDIO_YEARLY: z.string().min(1).optional(),
  STRIPE_PRICE_CREDITS_29: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STORAGE_PROVIDER: z.enum(['r2']).optional(),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(1).optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
  R2_UPLOAD_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  ASSET_MAX_IMAGE_BYTES: z.coerce.number().int().positive().default(25 * 1024 * 1024),
  ASSET_MAX_VIDEO_BYTES: z.coerce.number().int().positive().default(250 * 1024 * 1024),
  ASSET_MAX_FONT_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data as z.infer<typeof envSchema>
