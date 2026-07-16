import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildErrorResponse, extractDbDiagnostic } from './errors.js'

test('extractDbDiagnostic reads SQLSTATE/table/column and never leaks detail', () => {
  const pgError = {
    name: 'error',
    code: '42703',
    table: 'users',
    column: 'stripe_customer_id',
    constraint: null,
    routine: 'errorMissingColumn',
    schema: 'public',
    detail: 'sensitive@example.test',
  }

  const diag = extractDbDiagnostic(pgError, 'insert_user')

  assert.equal(diag.stage, 'insert_user')
  assert.equal(diag.sqlstate, '42703')
  assert.equal(diag.table, 'users')
  assert.equal(diag.column, 'stripe_customer_id')
  assert.equal(diag.routine, 'errorMissingColumn')
  assert.equal(diag.schema, 'public')
  // No PII/secret-bearing field is ever copied into the diagnostic.
  assert.equal(JSON.stringify(diag).includes('sensitive@example.test'), false)
})

test('extractDbDiagnostic walks the cause chain to find the pg error', () => {
  const wrapped = {
    name: 'DrizzleQueryError',
    message: 'Failed query',
    cause: { code: '23505', constraint: 'users_email_key', table: 'users' },
  }

  const diag = extractDbDiagnostic(wrapped, 'insert_user')

  assert.equal(diag.sqlstate, '23505')
  assert.equal(diag.constraint, 'users_email_key')
  assert.equal(diag.errorName, 'DrizzleQueryError')
})

test('extractDbDiagnostic returns null SQLSTATE for non-database errors', () => {
  const diag = extractDbDiagnostic(new Error('boom'), 'create_session')
  assert.equal(diag.stage, 'create_session')
  assert.equal(diag.sqlstate, null)
  assert.equal(diag.table, null)
})

test('buildErrorResponse omits diagnostic unless one is provided', () => {
  const without = buildErrorResponse('INTERNAL_SERVER_ERROR', 'x', 'req_1')
  assert.equal('diagnostic' in without.error, false)

  const diag = extractDbDiagnostic({ code: '42P01', table: 'legal_acceptances' }, 'legal_acceptance')
  const withDiag = buildErrorResponse('INTERNAL_SERVER_ERROR', 'x', 'req_2', diag)
  assert.equal(withDiag.error.diagnostic?.sqlstate, '42P01')
  assert.equal(withDiag.error.diagnostic?.table, 'legal_acceptances')
})
