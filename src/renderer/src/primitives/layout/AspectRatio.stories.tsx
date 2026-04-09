import type { Meta, StoryObj } from '@storybook/react'
import { AspectRatio } from './AspectRatio'

const meta = {
  title: 'Primitives/Layout/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs'],
  argTypes: {
    ratio: {
      control: 'select',
      options: ['square', 'video', '4/3'],
    },
  },
} satisfies Meta<typeof AspectRatio>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    ratio: 'video',
    style: { width: 320, background: 'var(--color-bg-tertiary)', borderRadius: 8 },
    children: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 12, color: 'var(--color-text-secondary)' }}>
        16 / 9 video
      </div>
    ),
  },
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {(['square', 'video', '4/3'] as const).map((ratio) => (
        <div key={ratio} style={{ width: 160 }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>ratio="{ratio}"</div>
          <AspectRatio ratio={ratio} style={{ background: 'var(--color-bg-tertiary)', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 11, color: 'var(--color-text-muted)' }}>
              {ratio}
            </div>
          </AspectRatio>
        </div>
      ))}
    </div>
  ),
}
