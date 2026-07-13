import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, normalizeEmail, verifyPassword } from './password.js'

test('normalizes email before persistence', () => {
  assert.equal(normalizeEmail('  USER@Example.COM  '), 'user@example.com')
})

test('hashes and verifies a password without exposing the raw password', async () => {
  const hash = await hashPassword('Correct Horse Battery Staple')

  assert.equal(hash.includes('Correct Horse Battery Staple'), false)
  assert.equal(await verifyPassword('Correct Horse Battery Staple', hash), true)
  assert.equal(await verifyPassword('wrong password', hash), false)
})
