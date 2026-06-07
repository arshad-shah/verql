import { useEffect } from 'react'
import type { DataNoun } from '@shared/driver-capabilities'
import { useConnectionsStore } from '@/stores/connections'
import { useDriverCapabilitiesStore } from '@/stores/driver-capabilities'
import { useTranslation } from '@/i18n/I18nProvider'

export interface ResolvedNouns {
  object: DataNoun
  field: DataNoun
  record: DataNoun
}

/** Resolves the data-concept nouns (object/field/record) for a connection's
 *  driver, so the schema explorer can label things in the driver's own terms
 *  (table/column/row, collection/field/document, key/field/entry, …) instead
 *  of assuming SQL. Falls back to generic, i18n'd nouns when the driver doesn't
 *  declare its own via the `nouns` capability. */
export function useDataNouns(connectionId: string | null): ResolvedNouns {
  const { t } = useTranslation()
  const type = useConnectionsStore((s) =>
    connectionId ? (s.connections.find((c) => c.id === connectionId)?.type ?? null) : null
  )
  const caps = useDriverCapabilitiesStore((s) =>
    connectionId && type ? s.resolveCapabilities(connectionId, type) : null
  )
  const fetch = useDriverCapabilitiesStore((s) => s.fetch)
  useEffect(() => { if (type) fetch(type).catch(() => {}) }, [type, fetch])

  const n = caps?.nouns
  return {
    object: n?.object ?? { one: t('explorer.noun.object.one'), many: t('explorer.noun.object.many') },
    field: n?.field ?? { one: t('explorer.noun.field.one'), many: t('explorer.noun.field.many') },
    record: n?.record ?? { one: t('explorer.noun.record.one'), many: t('explorer.noun.record.many') },
  }
}

/** Title-case a lower-case noun for use as a standalone label/header. */
export function titleCase(noun: string): string {
  return noun.charAt(0).toUpperCase() + noun.slice(1)
}
