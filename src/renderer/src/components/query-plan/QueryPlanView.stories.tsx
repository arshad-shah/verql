import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryPlanView } from './QueryPlanView'
import type { PlanNode } from '@shared/types'

const plan: PlanNode[] = [
  {
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
  },
]

const meta: Meta<typeof QueryPlanView> = {
  title: 'Components/QueryPlan/QueryPlanView',
  component: QueryPlanView,
  decorators: [
    (Story) => (
      <div style={{ width: 760, height: 360 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** A full normalized plan tree, with the total-cost header. */
export const WithPlan: Story = {
  args: { plan },
}

/** Empty plan — renders the "no plan" placeholder. */
export const Empty: Story = {
  args: { plan: [] },
}
