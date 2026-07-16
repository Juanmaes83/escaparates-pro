import { createHash, createHmac } from 'node:crypto'
import { env } from '../config/env.js'

type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicUrl: string
  uploadTtlSeconds: number
}

type PresignedRequest = {
  url: string
  headers: Record<string, string>
  expiresIn: number
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest()
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function encodePath(value: string): string {
  return value.split('/').map((part) => encodeURIComponent(part)).join('/')
}

function timestamp(date: Date): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '')
  return { amzDate: iso, dateStamp: iso.slice(0, 8) }
}

/**
 * Names of the required R2 settings the running process is missing (or, for
 * STORAGE_PROVIDER, not exactly "r2"). Names only — never values. Used to make a
 * STORAGE_NOT_CONFIGURED 503 diagnosable from a single request in staging.
 */
export function missingR2Settings(): string[] {
  const checks: Array<[string, boolean]> = [
    ['STORAGE_PROVIDER=r2', env.STORAGE_PROVIDER === 'r2'],
    ['R2_ACCOUNT_ID', Boolean(env.R2_ACCOUNT_ID)],
    ['R2_ACCESS_KEY_ID', Boolean(env.R2_ACCESS_KEY_ID)],
    ['R2_SECRET_ACCESS_KEY', Boolean(env.R2_SECRET_ACCESS_KEY)],
    ['R2_BUCKET', Boolean(env.R2_BUCKET)],
    ['R2_PUBLIC_URL', Boolean(env.R2_PUBLIC_URL)],
  ]
  return checks.filter(([, ok]) => !ok).map(([name]) => name)
}

export function getR2Config(): R2Config | null {
  if (
    env.STORAGE_PROVIDER !== 'r2' ||
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET ||
    !env.R2_PUBLIC_URL
  ) return null

  return {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_BUCKET,
    publicUrl: env.R2_PUBLIC_URL.replace(/\/+$/, ''),
    uploadTtlSeconds: env.R2_UPLOAD_TTL_SECONDS,
  }
}

export function publicAssetUrl(storageKey: string, config = getR2Config()): string | null {
  if (!config) return null
  return `${config.publicUrl}/${encodePath(storageKey)}`
}

function createPresignedRequest(
  method: 'PUT' | 'DELETE',
  storageKey: string,
  mimeType: string | null,
  config = getR2Config(),
  now = new Date(),
): PresignedRequest | null {
  if (!config) return null

  const host = `${config.accountId}.r2.cloudflarestorage.com`
  const canonicalUri = `/${encodeURIComponent(config.bucket)}/${encodePath(storageKey)}`
  const { amzDate, dateStamp } = timestamp(now)
  const region = 'auto'
  const service = 's3'
  const scope = `${dateStamp}/${region}/${service}/aws4_request`
  const credential = `${config.accessKeyId}/${scope}`
  const signedHeaders = mimeType ? 'content-type;host' : 'host'
  const query = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(config.uploadTtlSeconds),
    'X-Amz-SignedHeaders': signedHeaders,
  })
  query.sort()

  const canonicalHeaders = mimeType
    ? `content-type:${mimeType.trim()}\nhost:${host}\n`
    : `host:${host}\n`
  const canonicalRequest = [
    method,
    canonicalUri,
    query.toString(),
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n')
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join('\n')

  const dateKey = hmac(`AWS4${config.secretAccessKey}`, dateStamp)
  const regionKey = hmac(dateKey, region)
  const serviceKey = hmac(regionKey, service)
  const signingKey = hmac(serviceKey, 'aws4_request')
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex')
  query.set('X-Amz-Signature', signature)

  return {
    url: `https://${host}${canonicalUri}?${query.toString()}`,
    headers: mimeType ? { 'Content-Type': mimeType } : {},
    expiresIn: config.uploadTtlSeconds,
  }
}

export function createPresignedPutUrl(
  storageKey: string,
  mimeType: string,
  config = getR2Config(),
  now = new Date(),
): PresignedRequest | null {
  return createPresignedRequest('PUT', storageKey, mimeType, config, now)
}

export function createPresignedDeleteUrl(
  storageKey: string,
  config = getR2Config(),
  now = new Date(),
): PresignedRequest | null {
  return createPresignedRequest('DELETE', storageKey, null, config, now)
}

export async function deleteR2Object(storageKey: string): Promise<boolean> {
  const request = createPresignedDeleteUrl(storageKey)
  if (!request) return false
  const response = await fetch(request.url, { method: 'DELETE', headers: request.headers })
  if (response.ok || response.status === 404) return true
  throw new Error(`R2 deletion failed with HTTP ${response.status}`)
}
