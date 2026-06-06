import type { Meta, StoryObj } from '@storybook/react-vite'
import { WindowControls } from './WindowControls'

// The app-drawn minimise / maximise / close controls (used on Linux, and shown
// here so the actual hover/active styling is inspectable). Hover each button:
// minimise/maximise tint with the surface hover colour; close turns red. Hover
// stays contained within each button's bounds.

const meta: Meta<typeof WindowControls> = {
  title: 'Shell/WindowControls',
  component: WindowControls,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof WindowControls>

/** Rendered inside a title-bar-height strip, exactly as in the app. */
export const Default: Story = {
  render: () => (
    <div className="flex h-10 w-[420px] items-center justify-end border border-border bg-bg-primary">
      <WindowControls />
    </div>
  ),
}

/** On a wider bar with a faux app title, to show real positioning. */
export const InTitleBar: Story = {
  render: () => (
    <div className="flex h-10 w-[640px] items-center border border-border bg-bg-primary">
      <span className="pl-4 text-sm font-semibold tracking-wide text-text-primary">Verql</span>
      <div className="flex-1" />
      <WindowControls />
    </div>
  ),
}
