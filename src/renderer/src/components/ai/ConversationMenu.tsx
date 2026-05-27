import { useEffect, useRef, useState } from 'react'
import { History, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { useAIStore } from '@/stores/ai'
import { Flex, Text, Input, IconButton, ScrollArea } from '@/primitives'

/**
 * Conversation switcher shown at the top of the chat panel. Lists persisted
 * conversations and lets the user start a new one, switch, rename, or delete.
 * Branching is initiated from a message (see MessageBubble), not here.
 */
export function ConversationMenu() {
  const conversations = useAIStore((s) => s.conversations)
  const activeId = useAIStore((s) => s.activeConversationId)
  const newConversation = useAIStore((s) => s.newConversation)
  const switchConversation = useAIStore((s) => s.switchConversation)
  const deleteConversation = useAIStore((s) => s.deleteConversation)
  const renameConversation = useAIStore((s) => s.renameConversation)

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const active = conversations.find((c) => c.id === activeId)
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const commitEdit = () => {
    if (editingId) renameConversation(editingId, draft)
    setEditingId(null)
  }

  return (
    <div ref={ref} className="relative border-b border-[var(--color-border)]">
      <Flex align="center" gap="xs" className="px-2 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left rounded-md px-1.5 py-1 hover:bg-hover transition-colors"
          aria-label="Conversation history"
          aria-expanded={open}
        >
          <History size={12} className="text-text-tertiary shrink-0" />
          <Text size="xs" truncate className="flex-1">{active?.title ?? 'New chat'}</Text>
        </button>
        <IconButton
          label="New chat"
          size="xs"
          variant="ghost"
          onClick={() => { newConversation(); setOpen(false) }}
        >
          <Plus size={14} />
        </IconButton>
      </Flex>

      {open && (
        <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded-lg border border-border-default bg-bg-elevated shadow-dropdown overflow-hidden">
          <ScrollArea direction="vertical" className="max-h-64 py-1">
            {sorted.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-hover ${c.id === activeId ? 'bg-accent/10' : ''}`}
                onClick={() => { if (editingId !== c.id) { void switchConversation(c.id); setOpen(false) } }}
              >
                {editingId === c.id ? (
                  <>
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      size="xs"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="flex-1"
                    />
                    <IconButton label="Save name" size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); commitEdit() }}>
                      <Check size={12} />
                    </IconButton>
                    <IconButton label="Cancel rename" size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingId(null) }}>
                      <X size={12} />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <Text size="xs" truncate className="flex-1">{c.title}</Text>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <IconButton label="Rename conversation" size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setDraft(c.title) }}>
                        <Pencil size={11} />
                      </IconButton>
                      <IconButton label="Delete conversation" size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); void deleteConversation(c.id) }}>
                        <Trash2 size={11} />
                      </IconButton>
                    </div>
                  </>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
