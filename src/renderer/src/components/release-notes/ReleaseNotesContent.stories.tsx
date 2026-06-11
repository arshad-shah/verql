import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Gauge, Table2, Wrench } from 'lucide-react'
import { ReleaseNotesContent } from './ReleaseNotesContent'
import type { ReleaseNote } from '@/lib/release-notes'

const SAMPLE: ReleaseNote = {
  version: '1.2.0',
  date: '2026-06-01',
  headline: 'Faster plans, friendlier browsing',
  summary: 'A quick taste of what a curated release page looks like, with grouped highlights.',
  groups: [
    {
      title: 'New features',
      tone: 'feature',
      highlights: [
        { id: 'explain', icon: Gauge, title: 'Driver-declared EXPLAIN', description: 'Query plans now use the right syntax for each driver.' },
        { id: 'browse', icon: Table2, title: 'Browse data in any store', description: 'A one-click grid for Redis keys and Mongo documents.' },
      ],
    },
    {
      title: 'Fixes',
      tone: 'fix',
      highlights: [
        { id: 'mysql', icon: Wrench, title: 'Tidier MySQL explorer', description: 'Server-internal databases are hidden from the tree.' },
      ],
    },
  ],
  links: [{ label: 'Full changelog', url: 'https://example.com/changelog' }],
}

const meta = {
  title: 'Components/Release Notes/ReleaseNotesContent',
  component: ReleaseNotesContent,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ReleaseNotesContent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { note: SAMPLE },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Faster plans, friendlier browsing')).toBeInTheDocument()
    await expect(canvas.getByText('Driver-declared EXPLAIN')).toBeInTheDocument()
    await expect(canvas.getByText('New features')).toBeInTheDocument()
  },
}
