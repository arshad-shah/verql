import type { Meta, StoryObj } from '@storybook/react-vite'
import { Grid } from './Grid'

const DemoBox = ({ children }: { children: string }) => (
  <div style={{ padding: '8px 16px', background: 'var(--color-bg-tertiary)', borderRadius: 4, fontSize: 12, color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)', textAlign: 'center' }}>
    {children}
  </div>
)

const meta = {
  title: 'Primitives/Layout/Grid',
  component: Grid,
  argTypes: {
    columns: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6, 12],
    },
    gap: {
      control: 'select',
      options: [undefined, 'xs', 'sm', 'md', 'lg', 'xl'],
    },
  },
} satisfies Meta<typeof Grid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    columns: 3,
    gap: 'md',
    children: (
      <>
        <DemoBox>1</DemoBox>
        <DemoBox>2</DemoBox>
        <DemoBox>3</DemoBox>
        <DemoBox>4</DemoBox>
        <DemoBox>5</DemoBox>
        <DemoBox>6</DemoBox>
      </>
    ),
    style: { width: 480 },
  },
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 480 }}>
      {([2, 3, 4] as const).map((cols) => (
        <div key={cols}>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>columns={cols}</div>
          <Grid columns={cols} gap="sm">
            {Array.from({ length: cols * 2 }, (_, i) => (
              <DemoBox key={i}>{i + 1}</DemoBox>
            ))}
          </Grid>
        </div>
      ))}
    </div>
  ),
}
