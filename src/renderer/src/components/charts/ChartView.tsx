import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import type { ChartType } from './chart-detect'
import { Flex, Text } from '@/primitives'

const COLORS = ['#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd', '#56b6c2', '#d19a66']

interface Props {
  type: ChartType
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
}

export function ChartView({ type, data, xKey, yKey }: Props) {
  if (type === 'none' || data.length === 0) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Text size="sm" color="muted">No chart available</Text>
      </Flex>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === 'bar' ? (
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
          <XAxis dataKey={xKey} tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a3e' }} />
          <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a3e' }} />
          <Tooltip contentStyle={{ backgroundColor: '#12121f', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey={yKey} fill="#7c6ff7" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : type === 'line' ? (
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
          <XAxis dataKey={xKey} tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a3e' }} />
          <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a3e' }} />
          <Tooltip contentStyle={{ backgroundColor: '#12121f', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey={yKey} stroke="#7c6ff7" strokeWidth={2} dot={{ fill: '#7c6ff7', r: 3 }} />
        </LineChart>
      ) : type === 'pie' ? (
        <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius="70%" label={{ fill: '#ccc', fontSize: 11 }}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#12121f', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
        </PieChart>
      ) : type === 'scatter' ? (
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
          <XAxis dataKey={xKey} name={xKey} tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a3e' }} />
          <YAxis dataKey={yKey} name={yKey} tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a3e' }} />
          <Tooltip contentStyle={{ backgroundColor: '#12121f', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
          <Scatter data={data} fill="#7c6ff7" />
        </ScatterChart>
      ) : (
        <div />
      )}
    </ResponsiveContainer>
  )
}
