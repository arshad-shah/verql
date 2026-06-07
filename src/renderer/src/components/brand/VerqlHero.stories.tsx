import type { Meta, StoryObj } from '@storybook/react-vite'
import { VerqlHero } from './VerqlHero'

const meta: Meta<typeof VerqlHero> = {
  title: 'Components/Brand/VerqlHero',
  component: VerqlHero,
}
export default meta
type Story = StoryObj<typeof meta>

/** Default hero size, as used in the boot splash and empty states. */
export const Default: Story = {
  args: { size: 120 },
}

/** Larger size for prominent welcome/landing surfaces. */
export const Large: Story = {
  args: { size: 200 },
}

/** Custom className — tinted to the accent color. */
export const CustomClassName: Story = {
  args: { size: 120, className: 'text-accent opacity-80' },
}
