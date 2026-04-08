export function exportToJson(
  rows: Record<string, unknown>[],
  pretty: boolean = true
): string {
  return pretty
    ? JSON.stringify(rows, null, 2)
    : JSON.stringify(rows)
}
