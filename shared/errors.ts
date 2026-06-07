/** Best-effort human-readable message from an unknown thrown value — the one
 *  home for the `err instanceof Error ? err.message : String(err)` idiom that
 *  was hand-rolled across the main process and renderer. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
