import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { ExplainResult } from './ExplainPanel'
import { useExplainStore } from '@/stores/explain'

// Stub the IPC bridge so the component doesn't error when it registers
// `window.electronAPI.on(AI_EXPLAIN_EVENT, …)` inside its useEffect.
function stubElectronAPI() {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => null,
    on: () => () => {},
  }
}

// Wrapper that seeds the explain store before rendering each story.
function withExplainState(
  perTab: Parameters<typeof useExplainStore.setState>[0]['byTab'][string] | undefined,
  child: React.ReactNode,
) {
  return function StoreSeeder() {
    useEffect(() => {
      stubElectronAPI()
      useExplainStore.setState({
        byTab: perTab ? { 'demo-tab': perTab } : {},
      })
    }, [])
    return <>{child}</>
  }
}

const meta: Meta<typeof ExplainResult> = {
  title: 'Components/AI/ExplainCard',
  component: ExplainResult,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 480, padding: 16, background: 'var(--color-bg-primary)' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof ExplainResult>

// 1. Loading skeleton — no streaming text yet, just the skeleton animation.
export const LoadingSkeleton: Story = {
  render: () => {
    const Comp = withExplainState(
      { loading: true, streamingText: '', streamId: 'fake-stream-1', model: 'gpt-4o', durationMs: null, error: null },
      <ExplainResult tabId="demo-tab" explanation={null} />,
    )
    return <Comp />
  },
}

// 2. Streaming — loading with partial text already accumulated.
export const Streaming: Story = {
  render: () => {
    const Comp = withExplainState(
      {
        loading: true,
        streamingText: 'This query counts active **users** grouped by signup month…',
        streamId: 'fake-stream-2',
        model: 'gpt-4o',
        durationMs: null,
        error: null,
      },
      <ExplainResult tabId="demo-tab" explanation={null} />,
    )
    return <Comp />
  },
}

// 3. Complete — finished stream; full markdown explanation shown.
const COMPLETE_EXPLANATION = `This query retrieves the **top 10 customers** ranked by total order value.

\`\`\`sql
SELECT u.name, SUM(o.total) AS revenue
FROM users u
JOIN orders o ON o.user_id = u.id
GROUP BY u.name
ORDER BY revenue DESC
LIMIT 10;
\`\`\`

The \`JOIN\` links each order to its owner. \`SUM(o.total)\` aggregates spend per customer, and \`ORDER BY revenue DESC\` ensures the highest spenders appear first. The \`LIMIT 10\` caps the result set.`

export const Complete: Story = {
  render: () => {
    const Comp = withExplainState(
      { loading: false, streamingText: '', streamId: null, model: 'gpt-4o', durationMs: 1240, error: null },
      <ExplainResult tabId="demo-tab" explanation={COMPLETE_EXPLANATION} />,
    )
    return <Comp />
  },
}

// 4. Error — stream failed with a provider error.
export const Error: Story = {
  render: () => {
    const Comp = withExplainState(
      { loading: false, streamingText: '', streamId: null, model: null, durationMs: null, error: 'Provider unavailable' },
      // Pass a non-null explanation so the guard `!per?.loading && !explanation && !per?.error` doesn't hide the card.
      <ExplainResult tabId="demo-tab" explanation={null} />,
    )
    return <Comp />
  },
}

// 5. Hidden / no state — component renders nothing when there is no per-tab
//    state and no explanation. Confirms the early-return branch works.
export const HiddenNoState: Story = {
  render: () => {
    const Comp = withExplainState(
      undefined,
      <ExplainResult tabId="demo-tab" explanation={null} />,
    )
    return (
      <div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
          (No visible output expected — ExplainResult returns null)
        </p>
        <Comp />
      </div>
    )
  },
}
