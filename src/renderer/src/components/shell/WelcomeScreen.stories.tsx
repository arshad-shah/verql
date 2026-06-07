import type { Meta, StoryObj } from '@storybook/react-vite'
import { WelcomeScreen } from './WelcomeScreen'

/**
 * Empty-workspace watermark shown when no tab is open. It takes no props and
 * pulls its keyboard hints from a static table, so there is a single state.
 */
const meta: Meta<typeof WelcomeScreen> = {
  title: 'Components/Shell/WelcomeScreen',
  component: WelcomeScreen,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="h-screen w-screen">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
