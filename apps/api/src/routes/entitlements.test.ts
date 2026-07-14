import { test } from 'node:test'
import assert from 'node:assert/strict'

const { buildApp } = await import('../app.js')

test('entitlements require authentication', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/entitlements',
    })

    assert.equal(response.statusCode, 401)
    assert.equal(response.json().error.code, 'UNAUTHORIZED')
  } finally {
    await app.close()
  }
})
