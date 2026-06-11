import { useEffect } from 'react'
import { useDbType } from '@/stores/connections'
import { useDriverCapabilitiesStore } from '@/stores/driver-capabilities'
import { useTranslation } from '@/i18n/I18nProvider'
import { resolveDataNouns, type ResolvedNouns } from '@/lib/data-nouns'

export type { ResolvedNouns } from '@/lib/data-nouns'
export { titleCase, nounVars } from '@/lib/data-nouns'

/** Resolves the data-concept nouns (object/field/record) for a connection's
 *  driver, so the schema explorer can label things in the driver's own terms
 *  (table/column/row, collection/field/document, key/field/entry, …) instead
 *  of assuming SQL. Falls back to generic, i18n'd nouns when the driver doesn't
 *  declare its own via the `nouns` capability. */
export function useDataNouns(connectionId: string | null): ResolvedNouns {
  const { t } = useTranslation()
  const type = useDbType(connectionId)
  const caps = useDriverCapabilitiesStore((s) =>
    connectionId && type ? s.resolveCapabilities(connectionId, type) : null
  )
  const fetch = useDriverCapabilitiesStore((s) => s.fetch)
  useEffect(() => { if (type) fetch(type).catch(() => {}) }, [type, fetch])

  return resolveDataNouns(caps?.nouns, t)
}
