import type { Meta, StoryObj } from '@storybook/react-vite'
import { GradientSurface } from './GradientSurface'

const meta: Meta<typeof GradientSurface> = {
  title: 'Primitives/Surfaces/GradientSurface',
  component: GradientSurface,
  argTypes: {
    tone: { control: 'select', options: ['accent', 'neutral'] },
    intensity: { control: 'select', options: ['subtle', 'bold'] },
  },
}
export default meta
type Story = StoryObj<typeof GradientSurface>

const Sample = () => (
  <div className="flex h-40 w-56 flex-col justify-end p-5 gap-1">
    <div className="h-8 w-8 rounded-lg" style={{ background: 'linear-gradient(140deg,var(--color-accent),var(--color-accent-emphasis))' }} />
    <span className="text-text-primary font-semibold">Verql</span>
    <span className="text-text-secondary text-xs">A theme-derived gradient surface.</span>
  </div>
)

export const Default: Story = {
  args: { tone: 'accent', intensity: 'subtle' },
  render: (args) => (
    <GradientSurface {...args} className="rounded-xl border border-border-default">
      <Sample />
    </GradientSurface>
  ),
}

/** All tone × intensity combinations. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(['accent', 'neutral'] as const).map((tone) =>
        (['subtle', 'bold'] as const).map((intensity) => (
          <div key={`${tone}-${intensity}`} className="flex flex-col gap-1.5">
            <span className="text-xs text-text-muted">{tone} · {intensity}</span>
            <GradientSurface tone={tone} intensity={intensity} className="rounded-xl border border-border-default">
              <Sample />
            </GradientSurface>
          </div>
        )),
      )}
    </div>
  ),
}
