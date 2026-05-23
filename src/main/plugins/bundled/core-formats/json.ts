export function exportToJson(rows: Record<string, unknown>[], pretty = true): string {
  return pretty ? JSON.stringify(rows, null, 2) : JSON.stringify(rows)
}
