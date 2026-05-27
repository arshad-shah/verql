// Shared JSON pretty-printer for plugin authors whose editor language is JSON
// (e.g. MongoDB query documents). Like formatSql, it never throws and returns
// the input unchanged when it isn't valid JSON — so formatting a shell-style or
// partially-typed query is a safe no-op rather than data loss.

export function formatJson(source: string, indent = 2): string {
  try {
    return JSON.stringify(JSON.parse(source), null, indent)
  } catch {
    return source
  }
}
