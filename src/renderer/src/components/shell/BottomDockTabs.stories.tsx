import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { BottomDockTabs } from './BottomDockTabs'

const meta: Meta<typeof BottomDockTabs> = {
  title: 'Components/Shell/BottomDockTabs',
  component: BottomDockTabs,
  parameters: { layout: 'fullscreen' },
  args: {
    onSelect: fn(),
    onClose: fn(),
  },
}
export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {
  args: {
    tabs: [{ id: 'output', title: 'Output' }],
    activeId: 'output',
  },
}

export const Multiple: Story = {
  args: {
    tabs: [
      { id: 'output', title: 'Output' },
      { id: 'problems', title: 'Problems' },
      { id: 'activity', title: 'Activity' },
    ],
    activeId: 'problems',
  },
}
