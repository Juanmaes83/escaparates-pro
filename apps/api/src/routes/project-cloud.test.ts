import { test } from 'node:test'
import assert from 'node:assert/strict'

const { buildApp } = await import('../app.js')

const protectedRoutes = [
  { method: 'GET', url: '/v1/projects' },
  { method: 'POST', url: '/v1/projects', payload: {} },
  { method: 'GET', url: '/v1/projects/00000000-0000-4000-8000-000000000000' },
  { method: 'PATCH', url: '/v1/projects/00000000-0000-4000-8000-000000000000', payload: {} },
  { method: 'DELETE', url: '/v1/projects/00000000-0000-4000-8000-000000000000' },
  { method: 'GET', url: '/v1/projects/00000000-0000-4000-8000-000000000000/versions' },
  { method: 'POST', url: '/v1/projects/00000000-0000-4000-8000-000000000000/versions', payload: {} },
  { method: 'POST', url: '/v1/projects/00000000-0000-4000-8000-000000000000/publish', payload: {} },
  { method: 'DELETE', url: '/v1/projects/00000000-0000-4000-8000-000000000000/publish' },
  { method: 'POST', url: '/v1/projects/00000000-0000-4000-8000-000000000000/assets', payload: {} },
  { method: 'POST', url: '/v1/projects/00000000-0000-4000-8000-000000000000/assets/00000000-0000-4000-8000-000000000001/complete', payload: {} },
  { method: 'DELETE', url: '/v1/projects/00000000-0000-4000-8000-000000000000/assets/00000000-0000-4000-8000-000000000001' },
] as const

for (const route of protectedRoutes) {
  test(`${route.method} ${route.url} requires authentication`, async () => {
    const app = await buildApp()
    try {
      const response = await app.inject({
        method: route.method,
        url: route.url,
        payload: 'payload' in route ? route.payload : undefined,
      })
      assert.equal(response.statusCode, 401)
      assert.equal(response.json().error.code, 'UNAUTHORIZED')
    } finally {
      await app.close()
    }
  })
}

test('public publication rejects invalid slug before database access', async () => {
  const app = await buildApp()
  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/publications/x',
    })
    assert.equal(response.statusCode, 400)
    assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  } finally {
    await app.close()
  }
})
