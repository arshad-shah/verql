// English catalogue — composed from per-domain modules so each surface's strings
// live in their own file (parallel-friendly, easy to scan). The composed `en`
// object is the structural source of truth from which `MessageKey` is derived.
//
// Key convention: `domain.surface.key`. Values are ICU-subset templates
// (see shared/i18n/format.ts) — `{name}` placeholders and `{n, plural, …}`.
//
// To add a surface: create/extend a domain module here and import it below.
import { common } from './common'
import { command } from './command'
import { settings } from './settings'
import { connections } from './connections'
import { menu } from './menu'
import { actions } from './actions'
import { errors } from './errors'
import { explorer } from './explorer'
import { query } from './query'

export const en = {
  common,
  command,
  settings,
  connections,
  menu,
  actions,
  errors,
  explorer,
  query,
} as const
