import type { Meta, StoryObj } from '@storybook/react-vite'
import { KbdGroup } from './KbdGroup'

const meta: Meta<typeof KbdGroup> = {
  title: 'Primitives/Typography/KbdGroup',
  component: KbdGroup,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    separator: { control: 'inline-radio', options: ['gap', 'plus'] },
    accelerator: { control: 'text' },
  },
}
export default meta
type Story = StoryObj<typeof KbdGroup>

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 320 }}>
    <span style={{ width: 96, fontSize: 12, color: 'var(--color-text-tertiary)' }}>{label}</span>
    {children}
  </div>
)

export const Default: Story = {
  args: { keys: ['mod', 'K'], size: 'md', separator: 'gap' },
}

export const FromAccelerator: Story = {
  name: 'From accelerator string',
  args: { accelerator: 'CmdOrCtrl+Shift+P' },
}

export const Separators: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row label="gap">
        <KbdGroup keys={['mod', 'shift', 'P']} separator="gap" />
      </Row>
      <Row label="plus">
        <KbdGroup keys={['mod', 'shift', 'P']} separator="plus" />
      </Row>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Row key={size} label={size}>
          <KbdGroup keys={['mod', 'enter']} size={size} />
        </Row>
      ))}
    </div>
  ),
}

/** Special tokens render as glyphs (arrows, tab, space, escape, modifiers). */
export const SpecialKeys: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row label="arrows"><KbdGroup keys={['up', 'down', 'left', 'right']} /></Row>
      <Row label="whitespace"><KbdGroup keys={['tab', 'space', 'enter']} /></Row>
      <Row label="editing"><KbdGroup keys={['escape', 'backspace']} /></Row>
      <Row label="modifiers"><KbdGroup keys={['cmd', 'ctrl', 'shift', 'alt']} /></Row>
    </div>
  ),
}
