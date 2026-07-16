export interface DbDiagnostic {
  stage: string | null
  sqlstate: string | null
  errorName: string | null
  table: string | null
  column: string | null
  constraint: string | null
  dataType: string | null
  routine: string | null
  schema: string | null
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
    requestId: string
    timestamp: string
    /**
     * Non-PII database diagnostic. Only attached on non-production environments
     * so a single failing request can be traced to its exact stage/SQLSTATE.
     */
    diagnostic?: DbDiagnostic
  }
}

export function buildErrorResponse(
  code: string,
  message: string,
  requestId: string,
  diagnostic?: DbDiagnostic,
): ErrorResponse {
  const error: ErrorResponse['error'] = {
    code,
    message,
    requestId,
    timestamp: new Date().toISOString(),
  }
  if (diagnostic) {
    error.diagnostic = diagnostic
  }
  return { error }
}

/**
 * Extract a safe, PII-free diagnostic from a thrown error.
 *
 * Walks the error `cause` chain to find a node-postgres `DatabaseError`
 * (identified by a 5-char SQLSTATE `code`) and reports only schema metadata:
 * SQLSTATE, table, column, constraint, data type, routine and schema. It never
 * reads `detail`/`where`/`hint`/`message`, which can contain submitted values
 * such as the email address.
 */
export function extractDbDiagnostic(
  err: unknown,
  stage: string | null,
): DbDiagnostic {
  const seen = new Set<unknown>()
  let node: unknown = err
  let pg: Record<string, unknown> | null = null

  while (node && typeof node === 'object' && !seen.has(node)) {
    seen.add(node)
    const candidate = node as Record<string, unknown>
    if (typeof candidate.code === 'string' && /^[0-9A-Z]{5}$/.test(candidate.code)) {
      pg = candidate
      break
    }
    node = candidate.cause
  }

  const source = (pg ?? {}) as Record<string, unknown>
  const str = (value: unknown): string | null =>
    typeof value === 'string' && value.length > 0 ? value : null

  const topName =
    err && typeof err === 'object' ? str((err as Record<string, unknown>).name) : null

  return {
    stage,
    sqlstate: str(source.code),
    errorName: topName,
    table: str(source.table),
    column: str(source.column),
    constraint: str(source.constraint),
    dataType: str(source.dataType),
    routine: str(source.routine),
    schema: str(source.schema),
  }
}
