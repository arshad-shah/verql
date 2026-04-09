import type { Meta, StoryObj } from '@storybook/react-vite'
import { Accordion } from './Accordion'
import { Badge } from '../data-display/Badge'
import { Plus, RefreshCw } from 'lucide-react'

const meta = {
  title: 'Primitives/Surfaces/Accordion',
  component: Accordion,
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ width: 280, border: '1px solid var(--color-border-default)', borderRadius: 8, overflow: 'hidden' }}>
      <Accordion>
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>
            <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Connections</span>
            <Badge size="sm">3</Badge>
            <Accordion.Actions>
              <button style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 2 }}>
                <Plus size={12} />
              </button>
            </Accordion.Actions>
          </Accordion.Trigger>
          <Accordion.Content>
            <div style={{ padding: '4px 8px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Connection items would go here
            </div>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Trigger>
            <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Tables</span>
            <Badge size="sm">12</Badge>
          </Accordion.Trigger>
          <Accordion.Content>
            <div style={{ padding: '4px 8px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Table items would go here
            </div>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Trigger>
            <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Views</span>
            <Badge size="sm">2</Badge>
          </Accordion.Trigger>
          <Accordion.Content>
            <div style={{ padding: '4px 8px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              View items would go here
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32 }}>
      <div style={{ width: 240 }}>
        <p style={{ fontSize: 12, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Size: sm (default)</p>
        <div style={{ border: '1px solid var(--color-border-default)', borderRadius: 8, overflow: 'hidden' }}>
          <Accordion size="sm">
            <Accordion.Item defaultOpen>
              <Accordion.Trigger>Small Section</Accordion.Trigger>
              <Accordion.Content>
                <div style={{ padding: '4px 8px', fontSize: 12, color: 'var(--color-text-secondary)' }}>Content</div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </div>
      </div>
      <div style={{ width: 280 }}>
        <p style={{ fontSize: 12, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Size: md</p>
        <div style={{ border: '1px solid var(--color-border-default)', borderRadius: 8, overflow: 'hidden' }}>
          <Accordion size="md">
            <Accordion.Item defaultOpen>
              <Accordion.Trigger>Medium Section</Accordion.Trigger>
              <Accordion.Content>
                <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>Content</div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </div>
      </div>
    </div>
  ),
}
