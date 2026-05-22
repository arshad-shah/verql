import type { Meta, StoryObj } from '@storybook/react-vite'
import { Kbd } from './Kbd'
import { KbdGroup } from './KbdGroup'

const meta = {
  title: 'Primitives/Typography/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['solid', 'outline', 'ghost'] },
  },
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 360 }}>
    <span style={{ width: 80, fontSize: 12, color: 'var(--color-text-tertiary)' }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{children}</div>
  </div>
)

export const Default: Story = {
  args: { children: 'K', size: 'md', variant: 'solid' },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row label="sm">
        <Kbd size="sm">K</Kbd>
        <Kbd size="sm">Esc</Kbd>
      </Row>
      <Row label="md">
        <Kbd size="md">K</Kbd>
        <Kbd size="md">Esc</Kbd>
      </Row>
      <Row label="lg">
        <Kbd size="lg">K</Kbd>
        <Kbd size="lg">Esc</Kbd>
      </Row>
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row label="solid"><Kbd variant="solid">K</Kbd></Row>
      <Row label="outline"><Kbd variant="outline">K</Kbd></Row>
      <Row label="ghost"><Kbd variant="ghost">K</Kbd></Row>
    </div>
  ),
}

export const Matrix: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['solid', 'outline', 'ghost'] as const).map((variant) => (
        <Row key={variant} label={variant}>
          <Kbd size="sm" variant={variant}>K</Kbd>
          <Kbd size="md" variant={variant}>K</Kbd>
          <Kbd size="lg" variant={variant}>K</Kbd>
        </Row>
      ))}
    </div>
  ),
}

export const Groups: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row label="palette"><KbdGroup keys={['mod', 'shift', 'p']} /></Row>
      <Row label="save"><KbdGroup accelerator="CmdOrCtrl+S" /></Row>
      <Row label="undo"><KbdGroup keys={['mod', 'z']} /></Row>
      <Row label="redo"><KbdGroup keys={['mod', 'shift', 'z']} /></Row>
      <Row label="escape"><KbdGroup keys={['escape']} /></Row>
      <Row label="arrows">
        <KbdGroup keys={['up']} />
        <KbdGroup keys={['down']} />
        <KbdGroup keys={['left']} />
        <KbdGroup keys={['right']} />
      </Row>
      <Row label="enter / tab / space">
        <KbdGroup keys={['enter']} />
        <KbdGroup keys={['tab']} />
        <KbdGroup keys={['space']} />
      </Row>
    </div>
  ),
}

export const GroupSeparators: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row label="gap"><KbdGroup keys={['mod', 'shift', 'p']} separator="gap" /></Row>
      <Row label="plus"><KbdGroup keys={['mod', 'shift', 'p']} separator="plus" /></Row>
    </div>
  ),
}

export const GroupSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row label="sm"><KbdGroup keys={['mod', 'shift', 'p']} size="sm" /></Row>
      <Row label="md"><KbdGroup keys={['mod', 'shift', 'p']} size="md" /></Row>
      <Row label="lg"><KbdGroup keys={['mod', 'shift', 'p']} size="lg" /></Row>
    </div>
  ),
}

export const GroupVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row label="solid"><KbdGroup keys={['mod', 'shift', 'p']} variant="solid" /></Row>
      <Row label="outline"><KbdGroup keys={['mod', 'shift', 'p']} variant="outline" /></Row>
      <Row label="ghost"><KbdGroup keys={['mod', 'shift', 'p']} variant="ghost" /></Row>
    </div>
  ),
}
