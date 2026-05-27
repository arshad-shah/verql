// Lightweight, dependency-free token accounting for the chat orchestration
// layer. We don't ship a real tokenizer (it would pull in a large data file and
// vary per model); a chars/4 heuristic is close enough to budget context and is
// always cheap to compute. The point is to keep the request bounded, not to
// bill anyone.
import type { AIChatMessage } from '@shared/ai-types'

/** Rough token estimate for a string (~4 chars/token, the common English ratio). */
export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

/** Estimated tokens a single message contributes once serialized for the API,
 *  including its tool-call arguments and a small per-message overhead. */
export function estimateMessageTokens(msg: AIChatMessage): number {
  let total = estimateTokens(msg.content)
  if (msg.toolCalls) {
    for (const tc of msg.toolCalls) total += estimateTokens(tc.name) + estimateTokens(tc.arguments)
  }
  // Role tag + message framing overhead.
  return total + 4
}

/**
 * Trim conversation history (system message excluded) to fit a token budget,
 * keeping the most recent messages. Guarantees a valid payload:
 *   - the newest message is always kept, even if it alone exceeds the budget;
 *   - the kept window starts on a `user` message, so we never send an orphaned
 *     tool result (whose `assistant` tool-call turn was trimmed away) or lead
 *     with an assistant turn — both of which providers reject.
 */
export function trimMessagesToBudget(messages: AIChatMessage[], maxTokens: number): AIChatMessage[] {
  if (messages.length === 0) return messages

  let total = 0
  let startIdx = messages.length - 1
  for (let i = messages.length - 1; i >= 0; i--) {
    const t = estimateMessageTokens(messages[i])
    // Always keep the newest message; otherwise stop once we'd overflow.
    if (i < messages.length - 1 && total + t > maxTokens) break
    total += t
    startIdx = i
  }

  // Advance to the first real `user` turn so the window is a valid start.
  while (startIdx < messages.length && messages[startIdx].role !== 'user') startIdx++
  // If advancing consumed everything (e.g. the tail is assistant/tool only),
  // fall back to the last message rather than sending nothing.
  if (startIdx >= messages.length) startIdx = messages.length - 1

  return messages.slice(startIdx)
}
