import { test } from 'node:test'
import assert from 'node:assert/strict'

const { buildApp } = await import('../app.js')

test('auth register rejects invalid input before touching the database', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: {
        email: 'not-an-email',
        password: 'short',
      },
    })

    assert.equal(response.statusCode, 400)
    assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  } finally {
    await app.close()
  }
})

test('auth register requires legal acceptance', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: {
        email: 'legal-test@escaparates.pro',
        password: 'Password123!',
        name: 'Legal Test',
      },
    })

    assert.equal(response.statusCode, 400)
    assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  } finally {
    await app.close()
  }
})

test('auth login rejects invalid input before touching the database', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: {
        email: 'not-an-email',
        password: '',
      },
    })

    assert.equal(response.statusCode, 400)
    assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  } finally {
    await app.close()
  }
})

test('auth me requires a bearer token', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
    })

    assert.equal(response.statusCode, 401)
    assert.equal(response.json().error.code, 'UNAUTHORIZED')
  } finally {
    await app.close()
  }
})

test('auth logout requires a bearer token', async () => {
  const app = await buildApp()

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/logout',
    })

    assert.equal(response.statusCode, 401)
    assert.equal(response.json().error.code, 'UNAUTHORIZED')
  } finally {
    await app.close()
  }
})
