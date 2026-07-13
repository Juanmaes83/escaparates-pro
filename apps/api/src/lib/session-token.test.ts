import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createRefreshToken,
  createRefreshTokenExpiry,
  hashRefreshToken,
} from './session-token.js'

test('creates opaque refresh tokens and stable database hashes', () => {
  const token = createRefreshToken()
  const hash = hashRefreshToken(token)

  assert.equal(token.length >= 32, true)
  assert.equal(hash.length, 64)
  assert.equal(hashRefreshToken(token), hash)
  assert.notEqual(createRefreshToken(), token)
})

test('creates a 30 day refresh token expiry', () => {
  const now = new Date('2026-07-13T00:00:00.000Z')
  assert.equal(
    createRefreshTokenExpiry(now).toISOString(),
    '2026-08-12T00:00:00.000Z',
  )
})
