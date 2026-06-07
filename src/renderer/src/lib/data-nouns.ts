import type { DataNouns, DataNoun } from '@shared/driver-capabilities'
import type { MessageKey } from '@shared/i18n'

export interface ResolvedNouns {
  object: DataNoun
  field: DataNoun
  record: DataNoun
}

type Translate = (key: MessageKey) => string

/** Resolve a driver's `nouns` capability into a complete set, falling back to
 *  the generic, i18n'd words when a driver omits one. The single resolver
 *  shared by the explorer hook (`useDataNouns`) and the host error renderer, so
 *  noun resolution lives in exactly one place. */
export function resolveDataNouns(nouns: DataNouns | undefined, t: Translate): ResolvedNouns {
  return {
    object: nouns?.object ?? { one: t('explorer.noun.object.one'), many: t('explorer.noun.object.many') },
    field: nouns?.field ?? { one: t('explorer.noun.field.one'), many: t('explorer.noun.field.many') },
    record: nouns?.record ?? { one: t('explorer.noun.record.one'), many: t('explorer.noun.record.many') },
  }
}

/** Title-case a lower-case noun for use as a standalone label / header. */
export function titleCase(noun: string): string {
  return noun.charAt(0).toUpperCase() + noun.slice(1)
}

/** Interpolation vars for noun-aware i18n strings — lower-case and Title-cased
 *  singular/plural for each concept (`{object}`/`{objects}`/`{Object}`/… and
 *  the same for field/record). */
export function nounVars(n: ResolvedNouns): Record<string, string> {
  return {
    object: n.object.one, objects: n.object.many, Object: titleCase(n.object.one), Objects: titleCase(n.object.many),
    field: n.field.one, fields: n.field.many, Field: titleCase(n.field.one), Fields: titleCase(n.field.many),
    record: n.record.one, records: n.record.many, Record: titleCase(n.record.one), Records: titleCase(n.record.many),
  }
}
