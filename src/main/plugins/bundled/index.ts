// Single entry point that lists every bundled plugin shipped with the app.
//
// The orchestrator imports `bundledPlugins` (this file) and registers each
// entry in order; nothing else in main/ outside this file should know what
// drivers ship out of the box. Adding a new bundled driver = adding it to
// this list.
//
// Order matters here: AI registers a service that other plugins ask for
// when they register their tools, and core-themes must register before the
// first window paints to avoid a flash of unthemed UI. Drivers themselves
// are listed last and can register in any order.
import type { PluginManifest } from '../types'

interface BundledPluginModule {
  manifest: PluginManifest
  activate: (ctx: import('../sdk/types').PluginContext) => void | Promise<void>
  deactivate?: () => void | Promise<void>
}

import * as ai from './ai'
import * as osNotifications from './os-notifications'
import * as dbTools from './db-tools'
import * as coreThemes from './core-themes'
import * as coreFormats from './core-formats'
import * as sshTunnel from './ssh-tunnel'
import * as mongodb from './mongodb'
import * as redis from './redis'
import * as snowflake from './snowflake'
import * as postgresql from './postgresql'
import * as mysql from './mysql'
import * as sqlite from './sqlite'

export const bundledPlugins: BundledPluginModule[] = [
  ai,
  osNotifications,
  dbTools,
  coreThemes,
  coreFormats,
  sshTunnel,
  mongodb,
  redis,
  snowflake,
  postgresql,
  mysql,
  sqlite,
]
