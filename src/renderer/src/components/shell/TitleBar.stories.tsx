import type { Meta, StoryObj } from '@storybook/react-vite'
import { TitleBar, type TitleBarPlatform } from './TitleBar'
import type { MenuBarItem } from './MenuBar'

// The title bar is owned by the app on every platform. Window controls differ:
// macOS keeps native traffic lights (drawn by the OS — simulated here only so
// the reserved left inset reads correctly), while Windows + Linux render the
// real app-drawn WindowControls (shown here exactly as in the app, via the
// actual TitleBar component).

const SAMPLE_MENU: MenuBarItem[] = [
  { id: 0, label: 'File', enabled: true },
  { id: 1, label: 'Edit', enabled: true },
  { id: 2, label: 'View', enabled: true },
  { id: 3, label: 'Window', enabled: true },
  { id: 4, label: 'Help', enabled: true },
]

/** Simulated macOS traffic lights, positioned where the OS draws them. */
function MacTrafficLights() {
  return (
    <div className="pointer-events-none absolute left-[15px] top-1/2 flex -translate-y-1/2 gap-2" aria-hidden="true">
      <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
      <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
      <span className="h-3 w-3 rounded-full bg-[#28c840]" />
    </div>
  )
}

/** Frames the title bar inside a mock app window so the layout reads clearly. */
function WindowPreview({ platform }: { platform: TitleBarPlatform }) {
  return (
    <div className="w-[820px] overflow-hidden rounded-lg border border-border shadow-2xl">
      <div className="relative">
        <TitleBar platform={platform} menuItems={platform === 'darwin' ? undefined : SAMPLE_MENU} />
        {platform === 'darwin' && <MacTrafficLights />}
        {/* Windows + Linux: the real WindowControls render inside TitleBar. */}
      </div>
      <div className="flex h-44 items-center justify-center bg-bg-secondary text-sm text-text-muted">
        Application content
      </div>
    </div>
  )
}

const meta: Meta<typeof WindowPreview> = {
  title: 'Shell/TitleBar',
  component: WindowPreview,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof WindowPreview>

export const MacOS: Story = {
  name: 'macOS — native traffic lights',
  args: { platform: 'darwin' },
}

export const Windows: Story = {
  name: 'Windows — menu bar + controls',
  args: { platform: 'win32' },
}

export const Linux: Story = {
  name: 'Linux — app-drawn controls',
  args: { platform: 'linux' },
}

/** All three side by side for a quick consistency check. */
export const AllPlatforms: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(['darwin', 'win32', 'linux'] as const).map((p) => (
        <div key={p} className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{p}</span>
          <WindowPreview platform={p} />
        </div>
      ))}
    </div>
  ),
}
