import { IPC_CHANNELS } from '@shared/ipc'
import type { Handle } from './context'
import type { AppDataStore } from '../appdata/store'

/**
 * IPC surface for the internal app-data store. Pure glue — every handler is a
 * thin pass-through to AppDataStore, which owns the SQL.
 */
export function registerAppDataHandlers(handle: Handle, appData: AppDataStore): void {
  handle(IPC_CHANNELS.APPDATA_CONVERSATIONS_LIST, async () => appData.listConversations())
  handle(IPC_CHANNELS.APPDATA_CONVERSATIONS_UPSERT, async (c) => appData.upsertConversation(c))
  handle(IPC_CHANNELS.APPDATA_CONVERSATIONS_DELETE, async (id) => appData.deleteConversation(id))
  handle(IPC_CHANNELS.APPDATA_CONVERSATIONS_SET_ACTIVE, async (id) =>
    appData.setActiveConversationId(id),
  )
  handle(IPC_CHANNELS.APPDATA_CONVERSATIONS_IMPORT, async (conversations, activeId) => ({
    imported: appData.importConversations(conversations, activeId),
  }))

  handle(IPC_CHANNELS.APPDATA_SAVED_QUERIES_LIST, async () => appData.listSavedQueries())
  handle(IPC_CHANNELS.APPDATA_SAVED_QUERIES_UPSERT, async (q) => appData.upsertSavedQuery(q))
  handle(IPC_CHANNELS.APPDATA_SAVED_QUERIES_DELETE, async (id) => appData.deleteSavedQuery(id))
  handle(IPC_CHANNELS.APPDATA_SAVED_QUERIES_IMPORT, async (queries) => ({
    imported: appData.importSavedQueries(queries),
  }))
}
