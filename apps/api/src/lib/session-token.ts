import { createHash, randomBytes } from 'node:crypto'

export const REFRESH_TOKEN_TTL_DAYS = 30

export function createRefreshToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function createRefreshTokenExpiry(now = new Date()): Date {
  return new Date(now.getTime() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
}
