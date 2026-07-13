import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64
const HASH_VERSION = 'scrypt-v1'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url')
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer
  return `${HASH_VERSION}:${salt}:${derivedKey.toString('base64url')}`
}

export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  if (!storedHash) {
    return false
  }

  const [version, salt, hash] = storedHash.split(':')
  if (version !== HASH_VERSION || !salt || !hash) {
    return false
  }

  const expected = Buffer.from(hash, 'base64url')
  const actual = (await scrypt(password, salt, expected.length)) as Buffer

  if (actual.length !== expected.length) {
    return false
  }

  return timingSafeEqual(actual, expected)
}
