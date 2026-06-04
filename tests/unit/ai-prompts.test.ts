import { describe, it, expect } from 'vitest'
import {
  buildChatSystemPrompt,
  buildExplainPrompt,
  buildGenerateQueryPrompt,
  buildInlineCompletePrompt,
  buildSummarizePrompt,
  RAW_TEMPLATES,
} from '../../src/main/plugins/bundled/ai/prompts'

// These tests pin the structural anchors that prompt-engineering changes are
// most likely to break by accident (e.g. someone trims the inline-complete
// EXAMPLES section while iterating on the rules). They don't snapshot the
// full prose — that would create churn on every reword. They lock the
// non-negotiables: placeholder coverage, key phrases the calling code
// relies on, optional-block elision.

describe('AI prompt templates', () => {
  describe('raw files', () => {
    it('every template is non-empty', () => {
      for (const [name, body] of Object.entries(RAW_TEMPLATES)) {
        expect(body.trim().length, `${name} is empty`).toBeGreaterThan(0)
      }
    })

    it('chat-fragments.md defines every fragment the chat-system template references', () => {
      const referenced = [...RAW_TEMPLATES.chatSystem.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
      for (const name of referenced) {
        expect(
          RAW_TEMPLATES.chatFragments,
          `chat-fragments.md is missing section "${name}"`
        ).toMatch(new RegExp(`^=== ${name} ===`, 'm'))
      }
    })
  })

  describe('buildChatSystemPrompt', () => {
    it('returns just the base rules when no context is provided', () => {
      const out = buildChatSystemPrompt({})
      expect(out).toContain("Verql's database assistant")
      expect(out).not.toContain('Active connection')
      expect(out).not.toContain('Saved connections')
      expect(out).not.toContain('Recent notifications')
      expect(out).not.toContain('Deep links')
      // No empty placeholders left behind.
      expect(out).not.toMatch(/\{\{|\}\}/)
    })

    it('renders connection metadata when present', () => {
      const out = buildChatSystemPrompt({
        connection: { driverName: 'PostgreSQL', type: 'postgresql' },
      })
      expect(out).toContain('Active connection: PostgreSQL (postgresql).')
    })

    it('renders all data blocks together with no triple-blank-line gaps', () => {
      const out = buildChatSystemPrompt({
        connection: { driverName: 'SQLite', type: 'sqlite' },
        schema: 'Tables in this database: users, orders.',
        connectionsList: '- Prod (postgresql) — connected [id: 1]',
        notificationsList: '- [error] Query timed out',
        appActionsCatalog: 'new-connection "Add a connection"',
      })
      expect(out).toContain('Active connection: SQLite (sqlite).')
      expect(out).toContain('Tables in this database: users, orders.')
      expect(out).toContain('Saved connections:')
      expect(out).toContain('Recent notifications:')
      expect(out).toContain('Deep links:')
      expect(out).toContain('new-connection "Add a connection"')
      // The render helper collapses runs of 3+ newlines to 2.
      expect(out).not.toMatch(/\n{3,}/)
    })

    it('skips whitespace-only optional fields', () => {
      const out = buildChatSystemPrompt({
        connection: { driverName: 'SQLite', type: 'sqlite' },
        schema: '   \n   ',
        connectionsList: '',
      })
      expect(out).toContain('SQLite')
      expect(out).not.toContain('Saved connections')
      // No leftover label fragments.
      expect(out).not.toMatch(/^Tables/m)
    })
  })

  describe('buildExplainPrompt', () => {
    it('locks the constraints the rendering UI relies on', () => {
      const out = buildExplainPrompt()
      expect(out).toContain('Markdown')
      expect(out).toContain('120 words')
      expect(out).toContain('Do not reproduce the query')
      // No bullet lists / no headings is part of the contract — make sure
      // the template stays in line with that.
      expect(out).toContain('Do not use headings or bullet lists')
    })
  })

  describe('buildGenerateQueryPrompt', () => {
    it('embeds the schema block when schema is provided', () => {
      const out = buildGenerateQueryPrompt({ schema: 'users(id, name)' })
      expect(out).toContain('DATABASE SCHEMA:')
      expect(out).toContain('users(id, name)')
      // The hard rule on the calling code is "no markdown" — keep it.
      expect(out).toContain('No markdown, no backticks')
    })

    it('omits the schema block when nothing is supplied', () => {
      const out = buildGenerateQueryPrompt({})
      expect(out).not.toContain('DATABASE SCHEMA')
    })
  })

  describe('buildInlineCompletePrompt', () => {
    it('pins the contract sections', () => {
      const out = buildInlineCompletePrompt({})
      // The sanitizer in enhancements.ts depends on the model honouring
      // these contracts — keep the headers in the prompt.
      expect(out).toContain('INPUT FORMAT')
      expect(out).toContain('OUTPUT FORMAT')
      expect(out).toContain('DECISION RULES')
      expect(out).toContain('FORBIDDEN')
      expect(out).toContain('EXAMPLES')
      // The cursor token is `|`. The whole input contract hinges on this
      // single character — losing it would silently break completions.
      expect(out).toContain('| marking the cursor')
    })

    it('still appends the schema block when given', () => {
      const out = buildInlineCompletePrompt({ schema: 'users(id, name)' })
      expect(out).toContain('DATABASE SCHEMA:')
      expect(out).toContain('users(id, name)')
    })
  })

  describe('buildSummarizePrompt', () => {
    it('keeps the 200-word ceiling and third-person voice', () => {
      const out = buildSummarizePrompt()
      expect(out).toContain('under 200 words')
      expect(out).toContain('third person')
    })
  })
})
