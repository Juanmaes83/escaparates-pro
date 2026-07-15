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

export function createPresignedPutUrl(
  storageKey: string,
  mimeType: string,
  config = getR2Config(),
  now = new Date(),
): { url: string; headers: Record<string, string>; expiresIn: number } | null {
  if (!config) return null

  const host = `${config.accountId}.r2.cloudflarestorage.com`
  const canonicalUri = `/${encodeURIComponent(config.bucket)}/${encodePath(storageKey)}`
  const { amzDate, dateStamp } = timestamp(now)
  const region = 'auto'
  const service = 's3'
  const scope = `${dateStamp}/${region}/${service}/aws4_request`
  const credential = `${config.accessKeyId}/${scope}`
  const query = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(config.uploadTtlSeconds),
    'X-Amz-SignedHeaders': 'content-type;host',
  })
  query.sort()

  const canonicalHeaders = `content-type:${mimeType.trim()}\nhost:${host}\n`
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    query.toString(),
    canonicalHeaders,
    'content-type;host',
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
    headers: { 'Content-Type': mimeType },
    expiresIn: config.uploadTtlSeconds,
  }
}
