import { test } from 'node:test'
import assert from 'node:assert/strict'

const { buildApp } = await import('../app.js')

test('billing catalog exposes approved pricing', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/billing/catalog',
    })

    const body = response.json()
    const pro = body.plans.find((plan: { id: string }) => plan.id === 'pro')
    const studio = body.plans.find((plan: { id: string }) => plan.id === 'studio')
    const credits = body.creditPacks.find((pack: { id: string }) => pack.id === 'credits_29')

    assert.equal(response.statusCode, 200)
    assert.equal(body.currency, 'EUR')
    assert.equal(pro.monthly, 49)
    assert.equal(pro.yearly, 490)
    assert.equal(studio.monthly, 99)
    assert.equal(studio.yearly, 990)
    assert.equal(credits.price, 29)
  } finally {
    await app.close()
  }
})

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

test('billing portal requires authentication', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/billing/portal',
    })

    assert.equal(response.statusCode, 401)
    assert.equal(response.json().error.code, 'UNAUTHORIZED')
  } finally {
    await app.close()
  }
})

test('billing credits requires authentication', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/billing/credits',
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
