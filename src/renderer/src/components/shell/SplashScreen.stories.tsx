import type { Meta, StoryObj } from '@storybook/react-vite'
import { SplashScreen } from './SplashScreen'

const meta: Meta<typeof SplashScreen> = {
  title: 'Components/Shell/SplashScreen',
  component: SplashScreen,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CustomStatus: Story = {
  args: { status: 'Loading settings…' },
}

export const ConnectingStatus: Story = {
  args: { status: 'Restoring your last session…' },
}
