/**
 * Parses a `verql://action/<id>?k=v` deep link into an action id and params.
 * Returns null for anything that isn't a verql action link, so the markdown
 * renderer can fall back to treating it as an ordinary external link.
 */
export function parseActionHref(
  href: string
): { id: string; params: Record<string, string> } | null {
  if (!href) return null

  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }

  if (url.protocol !== 'verql:' || url.hostname !== 'action') return null

  const id = url.pathname.replace(/^\/+/, '')
  if (!id) return null

  const params: Record<string, string> = {}
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value
  }

  return { id, params }
}
