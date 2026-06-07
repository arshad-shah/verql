import type { Meta, StoryObj } from '@storybook/react-vite'
import { PlanNodeView } from './PlanNode'
import type { PlanNode } from '@shared/types'

const leaf: PlanNode = {
  type: 'Seq Scan',
  table: 'orders',
  cost: 240.5,
  rows: 10000,
  details: 'Filter: status = \'open\'',
  children: [],
}

const tree: PlanNode = {
  type: 'Hash Join',
  cost: 980.2,
  rows: 8200,
  actualTime: 14.6,
  details: 'Hash Cond: (o.customer_id = c.id)',
  children: [
    {
      type: 'Seq Scan',
      table: 'orders',
      cost: 240.5,
      rows: 10000,
      actualTime: 5.1,
      details: '',
      children: [],
    },
    {
      type: 'Hash',
      cost: 120.0,
      rows: 1500,
      actualTime: 2.3,
      details: '',
      children: [
        {
          type: 'Index Scan',
          table: 'customers',
          cost: 60.0,
          rows: 1500,
          actualTime: 1.0,
          details: 'Index: customers_pkey',
          children: [],
        },
      ],
    },
  ],
}

const meta: Meta<typeof PlanNodeView> = {
  title: 'Components/QueryPlan/PlanNode',
  component: PlanNodeView,
  decorators: [
    (Story) => (
      <div style={{ width: 720, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** A single leaf node — high cost ratio renders the red cost bar. */
export const Leaf: Story = {
  args: { node: leaf, maxCost: 240.5 },
}

/** A nested plan with children at multiple depths and per-node timings. */
export const NestedTree: Story = {
  args: { node: tree, maxCost: 980.2 },
}

/** Low cost relative to maxCost — renders the green cost bar. */
export const LowCost: Story = {
  args: { node: leaf, maxCost: 2000 },
}
