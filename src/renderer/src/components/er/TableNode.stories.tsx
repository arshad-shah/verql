import type { Meta, StoryObj } from '@storybook/react-vite'
import { ReactFlow, ReactFlowProvider, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TableNode } from './TableNode'
import type { TableNodeData } from './er-layout'

const nodeTypes = { tableNode: TableNode }

/** TableNode is an xyflow node component (renders Handles), so it needs a
 *  ReactFlow canvas to mount. Each story renders a single tableNode on a
 *  minimal, fitView-ed canvas. */
function Canvas({ data }: { data: TableNodeData }) {
  const nodes: Node<TableNodeData>[] = [
    { id: data.tableName, type: 'tableNode', position: { x: 0, y: 0 }, data },
  ]
  return (
    <div style={{ width: 360, height: 320 }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        />
      </ReactFlowProvider>
    </div>
  )
}

const meta: Meta<typeof Canvas> = {
  title: 'Components/Er/TableNode',
  component: Canvas,
}
export default meta
type Story = StoryObj<typeof meta>

/** A table with a primary key, a foreign key, and plain columns. */
export const WithKeys: Story = {
  args: {
    data: {
      tableName: 'orders',
      color: '#7c6ff7',
      columns: [
        { name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false },
        { name: 'customer_id', dataType: 'uuid', isPrimaryKey: false, isForeignKey: true },
        { name: 'total', dataType: 'numeric', isPrimaryKey: false, isForeignKey: false },
        { name: 'status', dataType: 'text', isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', dataType: 'timestamptz', isPrimaryKey: false, isForeignKey: false },
      ],
    },
  },
}

/** A small lookup table with only a primary key. */
export const Minimal: Story = {
  args: {
    data: {
      tableName: 'tags',
      color: '#28c840',
      columns: [
        { name: 'id', dataType: 'serial', isPrimaryKey: true, isForeignKey: false },
        { name: 'label', dataType: 'varchar(64)', isPrimaryKey: false, isForeignKey: false },
      ],
    },
  },
}
