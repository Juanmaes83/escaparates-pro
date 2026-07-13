import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env['NODE_ENV'] = 'staging'
process.env['INTERNAL_DEBUG_TOKEN'] = 'test-internal-debug-token-000000000000'

const { buildApp } = await import('../app.js')
const { isInternalDbMigrateEnabled } = await import('./internal-db-migrate.js')

test('internal DB migrate endpoint is only enabled for staging with a token', () => {
  assert.equal(isInternalDbMigrateEnabled('staging', undefined), false)
  assert.equal(
    isInternalDbMigrateEnabled('staging', 'test-internal-debug-token-000000000000'),
    true,
  )
  assert.equal(
    isInternalDbMigrateEnabled(
      'production',
      'test-internal-debug-token-000000000000',
    ),
    false,
  )
})

test('internal DB migrate endpoint requires a debug token in staging', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/internal/db/migrate',
    })

    assert.equal(response.statusCode, 401)
    assert.equal(response.json().error.code, 'UNAUTHORIZED')
  } finally {
    await app.close()
  }
})

test('internal DB migrate endpoint rejects an invalid debug token', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/internal/db/migrate',
      headers: {
        'x-internal-debug-token': 'wrong-internal-debug-token-0000000000',
      },
    })

    assert.equal(response.statusCode, 401)
    assert.equal(response.json().error.code, 'UNAUTHORIZED')
  } finally {
    await app.close()
  }
})

test('internal DB migrate endpoint does not expose secrets when DB is unavailable', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/internal/db/migrate',
      headers: {
        'x-internal-debug-token': 'test-internal-debug-token-000000000000',
      },
    })

    assert.equal(response.statusCode, 503)
    const body = response.json()
    assert.equal(body.error.code, 'DATABASE_UNAVAILABLE')
    assert.equal(JSON.stringify(body).includes('DATABASE_URL'), false)
    assert.equal(JSON.stringify(body).includes('test-internal-debug-token'), false)
  } finally {
    await app.close()
  }
})
