import { test } from 'node:test'
import assert from 'node:assert/strict'

const { buildApp } = await import('../app.js')

test('billing status requires authentication', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/billing/status',
    })

    assert.equal(response.statusCode, 401)
    assert.equal(response.json().error.code, 'UNAUTHORIZED')
  } finally {
    await app.close()
  }
})

test('billing checkout requires authentication', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/billing/checkout',
      payload: {
        plan: 'pro',
      },
    })

    assert.equal(response.statusCode, 401)
    assert.equal(response.json().error.code, 'UNAUTHORIZED')
  } finally {
    await app.close()
  }
})

test('stripe webhook is closed when not configured', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/billing/webhook',
      headers: {
        'stripe-signature': 'test-signature',
      },
      payload: {
        id: 'evt_test',
        type: 'checkout.session.completed',
      },
    })

    assert.equal(response.statusCode, 503)
    assert.equal(response.json().error.code, 'WEBHOOK_NOT_CONFIGURED')
  } finally {
    await app.close()
  }
})
