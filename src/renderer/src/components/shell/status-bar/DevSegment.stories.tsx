import type { Meta, StoryObj } from '@storybook/react-vite'
import { DevSegment } from './DevSegment'

/**
 * `DevSegment` renders only when `import.meta.env.DEV` is true. In the
 * Storybook dev server that is the case, so the badge shows. In a production
 * build of the docs it renders nothing.
 */
const meta: Meta<typeof DevSegment> = {
  title: 'Components/Shell/StatusBar/DevSegment',
  component: DevSegment,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="flex h-7 items-stretch bg-bg-primary border border-border-default rounded">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
