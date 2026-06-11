import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ReleaseNotesContent } from './ReleaseNotesContent'
import { getLatestReleaseNote } from '@/lib/release-notes'

// Render the real, curated latest release so the story stays truthful and its
// copy resolves through the i18n surface (no inlined strings).
const latest = getLatestReleaseNote()!

const meta = {
  title: 'Components/Release Notes/ReleaseNotesContent',
  component: ReleaseNotesContent,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ReleaseNotesContent>

export default meta
type Story = StoryObj<typeof meta>

export const Latest: Story = {
  args: { note: latest },
  play: async ({ canvas }) => {
    // Chrome strings are stable i18n keys; assert on the version header + eyebrow.
    await expect(canvas.getByText(`Verql ${latest.version}`)).toBeInTheDocument()
    await expect(canvas.getByText('What’s new')).toBeInTheDocument()
  },
}
